'use server';

import { revalidatePath } from 'next/cache';
import { anzeigeName } from '@/lib/namen';
import { and, eq } from 'drizzle-orm';
import { db, termine, votes, besuche, wirtshaeuser, kasse, pushSubscriptions } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { getAktiveMitglieder, nachtragsfristOffen, getVergabeStand, getStats, getPraesidentId } from '@/lib/queries';
import { vergabeWechsel, wechselTexte } from '@/lib/badges';
import { WACKELT_AB_UNENTSCHULDIGT, berlinTag } from '@/lib/punkte';
import { HOIBE_KELLERPREIS_CENTS } from '@/lib/preise';
import { mailAn } from '@/lib/mail';
import { pushAnAlle, pushAn } from '@/lib/push';
import { datumLang } from '@/lib/format';
import { newId, nowIso } from '@/lib/ids';

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/termin');
  revalidatePath('/karte');
  revalidatePath('/spezln');
}

export async function neuerTermin(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const datum = String(formData.get('datum') ?? '');
  const zeit = String(formData.get('zeit') ?? '19:00');
  const planerId = String(formData.get('planerId') ?? me.id);
  if (!datum) return;
  db.insert(termine)
    .values({ id: newId('t'), datum, zeit, phase: 'planung', planerId, createdAt: nowIso() })
    .run();
  revalidateAll();
}

/** Best-effort-Geocoding über Nominatim (OSM) — scheitert leise. */
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'wirtschaftln.de (Stammtisch-App)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Nur Google-Hosts als Wirtshaus-Foto-URL — sonst könnte ein manipulierter
 * Request beliebige Fremd-URLs einschleusen, die dann bei allen Mitgliedern
 * als <img> laden (Tracking) oder die DB aufblähen.
 */
function erlaubteFotoUrl(url: string): string | null {
  if (!url || url.length > 2048) return null;
  try {
    const host = new URL(url).hostname;
    return /(^|\.)(googleusercontent\.com|gstatic\.com|googleapis\.com)$/.test(host) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Wirtshaus aus den Hidden-Fields der Google-Autocomplete-Suche anlegen
 * (Fallback: Freitext-Name + Nominatim-Geocoding). Gibt die neue ID zurück.
 */
async function wirtshausAusSuche(formData: FormData, vorgeschlagenVon: string | null): Promise<string | null> {
  const name = String(formData.get('w_name') ?? '').trim() || String(formData.get('w_freitext') ?? '').trim();
  if (!name) return null;
  // Gleicher Name schon da (z. B. Altbestand-Klassiker wird wiederbesucht)? → kein Duplikat anlegen
  const bekannt = db
    .select()
    .from(wirtshaeuser)
    .all()
    .find((w) => w.name.trim().toLowerCase() === name.toLowerCase());
  if (bekannt) return bekannt.id;
  const adresse = String(formData.get('w_adresse') ?? '').trim() || null;
  const bezirk = String(formData.get('w_bezirk') ?? '').trim() || null;
  const telefon = String(formData.get('w_telefon') ?? '').trim() || null;
  const fotoRoh = erlaubteFotoUrl(String(formData.get('w_photoUrl') ?? '').trim());
  const photoUrl = fotoRoh ? await stabileFotoUrl(fotoRoh) : null;
  let lat = Number(formData.get('w_lat')) || null;
  let lng = Number(formData.get('w_lng')) || null;
  if (lat == null || lng == null) {
    const coords = await geocode(adresse ? `${adresse}` : `${name}, München`);
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
  }
  const wid = newId('w');
  db.insert(wirtshaeuser)
    .values({ id: wid, name, adresse, bezirk, telefon, photoUrl, lat, lng, vorgeschlagenVon, createdAt: nowIso() })
    .run();
  return wid;
}

/**
 * „Wirtshaus gfunden" — darf jeder: landet als offener Pin auf der Karte
 * und steht dem nächsten Organisator zur Auswahl.
 */
export async function wirtshausVorschlagen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  await wirtshausAusSuche(formData, me.id);
  revalidateAll();
}

export async function wirtshausFestlegen(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  // Festlegen/Ändern darf der Organisator (bzw. jeder, wenn keiner eingetragen is),
  // der aktuelle Präsident oder der Admin — und nur solange der Abend nicht
  // läuft/abgeschlossen is (löst Push + Mail an alle aus).
  const darf = me.role === 'admin' || !termin.planerId || termin.planerId === me.id || me.id === getPraesidentId();
  if (!darf) return;
  if (termin.phase === 'heute' || termin.phase === 'abgeschlossen') return;

  // Entweder ein offenes (gfundenes) Wirtshaus auswählen oder ein neues suchen
  let wid = String(formData.get('vorhandenesWirtshausId') ?? '').trim() || null;
  if (wid && !db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wid)).get()) wid = null;
  if (!wid) wid = await wirtshausAusSuche(formData, null);
  if (!wid) return;

  db.update(termine).set({ wirtshausId: wid, phase: 'reserviert' }).where(eq(termine.id, terminId)).run();

  // Reserviert → alle Spezln kriegen Push + Mail und können zu-/absagen
  const wirtshaus = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wid)).get();
  const wann = `${datumLang(termin.datum)}, ${termin.zeit} Uhr`;
  const titel = `🍺 Reserviert: ${wirtshaus?.name ?? 'Wirtshaus'}`;
  const text = `Da nächste Stammtisch is fix: ${wirtshaus?.name ?? '—'}${wirtshaus?.bezirk ? ` (${wirtshaus.bezirk})` : ''} am ${wann}. Sag zua oder ab!`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== me.id).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titel, text, '/termin'),
    mailAn(empfaenger, titel, `Servus!\n\n${text}\n\n→ https://wirtschaftln.de/termin\n\nDei Wirtschaftln-App`),
  ]);
  revalidateAll();
}

/** Push-Abo eines Geräts speichern (kommt aus dem Service-Worker-Subscribe im Client). */
export async function pushAbonnieren(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const me = await getCurrentMember();
  if (!me || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;
  db.insert(pushSubscriptions)
    .values({ id: newId('p'), memberId: me.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, createdAt: nowIso() })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { memberId: me.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    })
    .run();
}

export async function abstimmen(terminId: string, wert: 'zu' | 'ab') {
  // „Vielleicht" is abgschafft — alte Stimmen bleiben in der DB, neue gibt's nur no zu/ab
  if (wert !== 'zu' && wert !== 'ab') return;
  const me = await getCurrentMember();
  if (!me) return;
  const vorhanden = db
    .select()
    .from(votes)
    .where(eq(votes.terminId, terminId))
    .all()
    .find((v) => v.memberId === me.id);
  if (vorhanden) {
    // erstmalsAm bleibt stehen — für den Abstimm-Bonus zählt die erste Stimme
    db.update(votes).set({ wert, updatedAt: nowIso() }).where(eq(votes.id, vorhanden.id)).run();
  } else {
    db.insert(votes)
      .values({ id: newId('v'), terminId, memberId: me.id, wert, updatedAt: nowIso(), erstmalsAm: nowIso() })
      .run();
  }
  revalidateAll();
}

export async function phaseSetzen(terminId: string, phase: 'planung' | 'reserviert' | 'heute') {
  const me = await getCurrentMember();
  if (!me) return;
  if (!['planung', 'reserviert', 'heute'].includes(phase)) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  if (me.role !== 'admin' && termin.planerId !== me.id) return;
  // „Anmeldung schließen" geht erst am Stammtisch-Tag selbst (Berlin-Zeit)
  if (phase === 'heute' && termin.datum !== berlinTag(nowIso())) return;
  db.update(termine).set({ phase }).where(eq(termine.id, terminId)).run();
  revalidateAll();
}

const STRAFE_GRUND_PREFIX = 'Zugesagt & nicht erschienen';

/**
 * Besuch abschließen — darf jeder Spezl (gibt +1 WP, meiste Abschlüsse = Schriftführer).
 * Pro Anwesendem Hoiben/🍖/🚕/⭐(Runde), Kaiserschmarrn wird geteilt (einer für alle),
 * Bewertungen (Wirtshaus/Kaisi/Brodn) mit Kommastelle, Bier + Weißbier am Wirtshaus.
 * Wer „abgsagt" markiert ist (zugesagt & nicht erschienen), kriegt automatisch eine
 * offene Forderung: Runde = Teilnehmer × Augustiner-Kellerpreis. Bis 7 Tage nach
 * Abschluss kann jeder nachtragen und ändern.
 */
export async function besuchAbschliessen(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  if (termin.phase !== 'heute' && termin.phase !== 'abgeschlossen') return;
  if (termin.phase === 'abgeschlossen' && !nachtragsfristOffen(termin.abgeschlossenAm)) return;

  const gelistet = formData.getAll('memberId').map(String);
  const kaisiBestellt = formData.get('kaisiBestellt') === 'on';
  const dabeiIds = gelistet.filter((id) => formData.get(`anwesend_${id}`) === 'on');
  const abgsagtIds = gelistet.filter((id) => formData.get(`abgsagt_${id}`) === 'on');
  const rundenIds: string[] = [];
  let brodnGegessen = false;

  // Für ALLE aktiven Mitglieder einen Besuchs-Eintrag schreiben (wichtig für die Serien):
  // gelistet-anwesend mit Werten, alle anderen als gefehlt.
  for (const m of getAktiveMitglieder()) {
    const anwesend = dabeiIds.includes(m.id);
    const hoiben = anwesend ? Math.max(0, Number(formData.get(`hoiben_${m.id}`) ?? 0) || 0) : 0;
    const brodn = anwesend && formData.get(`brodn_${m.id}`) === 'on';
    if (brodn) brodnGegessen = true;
    if (anwesend && formData.get(`runde_${m.id}`) === 'on') rundenIds.push(m.id);
    const werte = {
      anwesend,
      hoiben,
      kaiserschmarrn: anwesend && kaisiBestellt ? 1 : 0, // geteilt — jeder hat mitgegessen
      schweinsbraten: brodn ? 1 : 0,
      taxi: anwesend && formData.get(`taxi_${m.id}`) === 'on',
    };
    db.insert(besuche)
      .values({ id: newId('b'), terminId, memberId: m.id, ...werte })
      .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: werte })
      .run();
  }

  // Bewertungen (mit Kommastelle) landen am eigenen Besuchs-Eintrag
  const bewertung = (name: string) => {
    const v = Number(String(formData.get(name) ?? '').replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? Math.min(5, Math.round(v * 10) / 10) : null;
  };
  db.update(besuche)
    .set({
      sterne: bewertung('sterne'),
      kommentar: String(formData.get('kommentar') ?? '').trim() || null,
      kaiserSterne: kaisiBestellt ? bewertung('kaiserSterne') : null,
      kaiserNotiz: kaisiBestellt ? String(formData.get('kaiserNotiz') ?? '').trim() || null : null,
      brodnSterne: brodnGegessen ? bewertung('brodnSterne') : null,
      brodnNotiz: brodnGegessen ? String(formData.get('brodnNotiz') ?? '').trim() || null : null,
    })
    .where(and(eq(besuche.terminId, terminId), eq(besuche.memberId, me.id)))
    .run();

  // Bier & Weißbier am Wirtshaus festhalten
  if (termin.wirtshausId) {
    const biersorte = String(formData.get('biersorte') ?? '').trim();
    const weissbier = String(formData.get('weissbier') ?? '').trim() || null;
    if (biersorte) {
      db.update(wirtshaeuser).set({ biersorte, weissbier }).where(eq(wirtshaeuser.id, termin.wirtshausId)).run();
    }
  }

  const wirtshausName = termin.wirtshausId
    ? (db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, termin.wirtshausId)).get()?.name ?? 'Wirtshaus')
    : 'Wirtshaus';

  // ⭐ Geschmissene Runden → Kasse-Eintrag mit echtem Wert: Teilnehmer × Bräustüberl-Hoibe
  // (zählt für Großbauer + Runden-WP; zahlt sich am Tisch, fließt also NICHT in den Saldo)
  const rundenWert = dabeiIds.length * HOIBE_KELLERPREIS_CENTS;
  db.delete(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'runde'))).run();
  for (const memberId of rundenIds) {
    db.insert(kasse)
      .values({
        id: newId('k'), memberId, terminId,
        grund: `Runde gschmissen im ${wirtshausName} 🍻 (${dabeiIds.length} × ${(HOIBE_KELLERPREIS_CENTS / 100).toFixed(2).replace('.', ',')} €)`,
        betragCents: rundenWert, kind: 'runde', status: 'beglichen', createdAt: nowIso(),
      })
      .run();
  }

  // ❌ Zugesagt & nicht erschienen → offene Forderung: Runde = Teilnehmer × Kellerpreis.
  // Offene Auto-Strafen dieses Termins neu aufbauen (beglichene bleiben unangetastet);
  // die Zahlungsaufforderung mit PayPal-Link erscheint dem Spezl auf der Startseite.
  const betrag = dabeiIds.length * HOIBE_KELLERPREIS_CENTS;
  const alteStrafen = db.select().from(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'strafe'))).all();
  for (const s of alteStrafen) {
    if (s.status === 'offen' && s.grund.startsWith(STRAFE_GRUND_PREFIX)) {
      db.delete(kasse).where(eq(kasse.id, s.id)).run();
    }
  }
  for (const memberId of abgsagtIds) {
    const schonBeglichen = alteStrafen.some(
      (s) => s.memberId === memberId && s.status === 'beglichen' && s.grund.startsWith(STRAFE_GRUND_PREFIX),
    );
    if (schonBeglichen) continue;
    db.insert(kasse)
      .values({
        id: newId('k'), memberId, terminId,
        grund: `${STRAFE_GRUND_PREFIX} — Runde für die Spezln (${dabeiIds.length} × ${(HOIBE_KELLERPREIS_CENTS / 100).toFixed(2).replace('.', ',')} €) im ${wirtshausName}`,
        betragCents: -betrag, kind: 'strafe', status: 'offen', createdAt: nowIso(),
      })
      .run();
  }

  // Der erste Abschließer kriegt den Punkt — Nachträge ändern das nicht mehr.
  const erstAbschluss = !termin.abgeschlossenVon;
  db.update(termine)
    .set({
      phase: 'abgeschlossen',
      abgeschlossenVon: termin.abgeschlossenVon ?? me.id,
      abgeschlossenAm: termin.abgeschlossenAm ?? nowIso(),
    })
    .where(eq(termine.id, terminId))
    .run();

  // 🥶 Beim 3. unentschuldigten Fehlen in Folge: einmalig eine Strafrunde
  // (Teilnehmer × Bräustüberl-Hoibe). Nur beim ersten Abschluss, nicht bei Nachträgen.
  if (erstAbschluss) {
    for (const s of getStats()) {
      if (s.unentschuldigtStreak !== WACKELT_AB_UNENTSCHULDIGT) continue;
      // Nur wenn DIESER Abend das dritte unentschuldigte Fehlen war
      const heuteUnentschuldigt =
        !dabeiIds.includes(s.member.id) &&
        db.select().from(votes).where(eq(votes.terminId, terminId)).all().find((v) => v.memberId === s.member.id)?.wert !== 'ab';
      if (!heuteUnentschuldigt) continue;
      const schonVerhaengt = db
        .select()
        .from(kasse)
        .where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'strafe')))
        .all()
        .some((k) => k.memberId === s.member.id && k.grund.startsWith('Strafrunde'));
      if (schonVerhaengt) continue;
      db.insert(kasse)
        .values({
          id: newId('k'), memberId: s.member.id, terminId,
          grund: `Strafrunde — 3× unentschuldigt gfehlt (${dabeiIds.length} × ${(HOIBE_KELLERPREIS_CENTS / 100).toFixed(2).replace('.', ',')} €)`,
          betragCents: -betrag, kind: 'strafe', status: 'offen', createdAt: nowIso(),
        })
        .run();
    }
  }

  // Badge-/Amt-Wechsel melden (nur beim ersten Abschluss, ned bei jedem Nachtrag):
  // an alle „Resi is jetza Heiwong!", spöttisch an den Neuen, Gratulation an den Alten.
  if (erstAbschluss) {
    const vorher = getVergabeStand(terminId);
    const nachher = getVergabeStand();
    const mitglieder = getAktiveMitglieder();
    const nameVon = (id: string) => {
      const m = mitglieder.find((x) => x.id === id);
      return (m ? anzeigeName(m) : '—');
    };
    const mailVon = (id: string | null) => mitglieder.find((x) => x.id === id)?.email;
    const sendungen: Promise<void>[] = [];
    for (const w of vergabeWechsel(vorher, nachher)) {
      const neuName = nameVon(w.neuId);
      const texte = wechselTexte(w, neuName);
      const alleAnderen = mitglieder.filter((m) => m.id !== w.neuId && m.id !== w.altId).map((m) => m.id);
      sendungen.push(
        pushAn([w.neuId], `${w.icon} ${w.label}-Wechsel!`, texte.anNeuen, '/spezln'),
        pushAn(alleAnderen, `${w.icon} ${w.label}-Wechsel!`, texte.anAlle, '/spezln'),
      );
      if (w.altId) sendungen.push(pushAn([w.altId], `${w.icon} ${w.label}-Wechsel!`, texte.anAlten, '/spezln'));
      const neuMail = mailVon(w.neuId);
      const altMail = mailVon(w.altId);
      if (neuMail) sendungen.push(mailAn([neuMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${neuName}!\n\n${texte.anNeuen}\n\n→ https://wirtschaftln.de/spezln\n\nDei Wirtschaftln-App`));
      if (altMail && w.altId) sendungen.push(mailAn([altMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${nameVon(w.altId)}!\n\n${texte.anAlten}\n\n→ https://wirtschaftln.de/spezln\n\nDei Wirtschaftln-App`));
    }
    await Promise.allSettled(sendungen);
  }
  revalidateAll();
}

/**
 * Wirtshaus-Foto aus der Google-Places-Suche (läuft im Client über die Maps-JS-Library,
 * weil der API-Key referrer-beschränkt ist) in der DB hinterlegen. Nur einmal — wird
 * nicht überschrieben, wenn schon ein Foto da ist.
 */
/**
 * Die PhotoService-URLs aus der Maps-JS-Library sind session-gebunden und
 * laufen nach kurzer Zeit ab (403). Der Server folgt der URL deshalb einmal
 * bis zur stabilen lh3.googleusercontent.com-Adresse und speichert DIE.
 */
async function stabileFotoUrl(photoUrl: string): Promise<string | null> {
  try {
    const host = new URL(photoUrl).hostname;
    if (!/(^|\.)googleapis\.com$/.test(host)) return photoUrl; // schon stabil
    const res = await fetch(photoUrl, { redirect: 'follow', signal: AbortSignal.timeout(6000) });
    if (res.ok && erlaubteFotoUrl(res.url)) return res.url;
  } catch {
    /* Netz/Timeout — dann lieber gar koa Foto als a bald kaputtes */
  }
  return null;
}

export async function wirtshausFotoSetzen(wirtshausId: string, photoUrl: string) {
  const me = await getCurrentMember();
  if (!me) return;
  if (!erlaubteFotoUrl(photoUrl)) return;
  const w = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get();
  if (!w || w.photoUrl) return;
  const stabil = await stabileFotoUrl(photoUrl);
  if (!stabil) return;
  db.update(wirtshaeuser).set({ photoUrl: stabil }).where(eq(wirtshaeuser.id, wirtshausId)).run();
  revalidatePath('/karte');
}

/**
 * Orts-Backfill aus der Places-Textsuche im Client (wie das Foto): füllt NUR
 * fehlende Koordinaten/Adresse — v. a. für die Altbestand-Wirtshäuser, die
 * das Seed-Script ohne Ortsdaten anlegt.
 */
export async function wirtshausOrtSetzen(wirtshausId: string, daten: { lat: number; lng: number; adresse?: string | null }) {
  const me = await getCurrentMember();
  if (!me) return;
  const lat = Number(daten?.lat);
  const lng = Number(daten?.lng);
  // München & Umland — alles andere ist ein Fehlgriff der Suche
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 47.5 || lat > 48.8 || lng < 10.5 || lng > 12.5) return;
  const w = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get();
  if (!w || w.lat != null) return;
  const adresse = String(daten.adresse ?? '').trim().slice(0, 200) || null;
  db.update(wirtshaeuser)
    .set({ lat, lng, ...(w.adresse ? {} : { adresse }) })
    .where(eq(wirtshaeuser.id, wirtshausId))
    .run();
  revalidatePath('/karte');
}

/** Eigene Bewertung nachtragen (jedes Mitglied für sich). */
export async function bewerten(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const sterne = Math.min(5, Math.max(1, Number(formData.get('sterne') ?? 0) || 0));
  const kommentar = String(formData.get('kommentar') ?? '').trim() || null;
  if (!sterne) return;
  const eigener = db
    .select()
    .from(besuche)
    .where(eq(besuche.terminId, terminId))
    .all()
    .find((b) => b.memberId === me.id);
  if (eigener) {
    db.update(besuche).set({ sterne, kommentar }).where(eq(besuche.id, eigener.id)).run();
  } else {
    db.insert(besuche)
      .values({ id: newId('b'), terminId, memberId: me.id, anwesend: true, hoiben: 0, kaiserschmarrn: 0, sterne, kommentar })
      .run();
  }
  revalidateAll();
}
