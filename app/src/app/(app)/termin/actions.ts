'use server';

import { revalidatePath } from 'next/cache';
import { anzeigeName } from '@/lib/namen';
import { and, eq } from 'drizzle-orm';
import { db, termine, votes, besuche, wirtshaeuser, kasse, pushSubscriptions, checkins } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { getAktiveMitglieder, nachtragsfristOffen, getVergabeStand, getStats, getPraesidentId, getBekannteWirtshaeuser, getLetzterAbgeschlossenerTermin, getAktuellerTermin } from '@/lib/queries';
import { findeBekanntes } from '@/lib/wirtshaus-abgleich';
import { vergabeWechsel, wechselTexte } from '@/lib/badges';
import { WACKELT_AB_UNENTSCHULDIGT, berlinTag, bierdeckelOffen, abschlussOffen, checkinOffen, CHECKIN_VORLAUF_STUNDEN } from '@/lib/punkte';
import { HELLE, ALKOHOLFREIE_HELLE } from '@/lib/biersorten';
import { hoibePreisCents, hoibePreisEuro } from '@/lib/preise';
import { appHost, appUrl, mailSignatur, tenantConfig } from '@/lib/tenant-config';
import { imUmkreis, mitOrt } from '@/lib/tenant-config-public';
import { fotoAlsDataUrl } from '@/lib/foto';
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

/**
 * Neuen Termin anlegen (typisch: der Abschließer, direkt am Tisch), OHNE
 * Organisator: den Posten schnappt sich danach jeder selber („I regle das!"),
 * nur wer den letzten Stammtisch organisiert hat, muss aussetzen.
 */
export async function neuerTermin(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const datum = String(formData.get('datum') ?? '');
  const zeit = String(formData.get('zeit') ?? '19:00');
  if (!datum) return;
  await terminAnlegen(datum, zeit, me.id);
  revalidateAll();
}

/**
 * Termin anlegen + Startschuss für d'Abstimmung (Push + Mail an alle außer dem
 * Anleger). Wird vom Formular UND vom Abschluss (nächster Termin) benutzt.
 */
async function terminAnlegen(datum: string, zeitRoh: string, vonMemberId: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return;
  const zeit = /^\d{2}:\d{2}$/.test(zeitRoh) ? zeitRoh : '19:00';
  // Stammhaus-Typ: das Stammhaus steht scho drin, der Organisator bestätigt
  // nur no („reserviert“) oder tauscht's für an Ausflug aus
  const config = tenantConfig();
  const stammhausId =
    config.typ === 'stammhaus' && config.stammhausWirtshausId && db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, config.stammhausWirtshausId)).get()
      ? config.stammhausWirtshausId
      : null;
  db.insert(termine)
    .values({ id: newId('t'), datum, zeit, phase: 'planung', planerId: null, wirtshausId: stammhausId, createdAt: nowIso() })
    .run();

  // 📣 Startschuss für d'Abstimmung, alle Spezln kriegen Push + Mail
  const wann = `${datumLang(datum)}, ${zeit} Uhr`;
  const titel = '🗳️ Neuer Stammtisch, jetzt abstimmen!';
  const text = `Da nächste Stammtisch steht: ${wann}. Sag zua oder ab, wer bis 3 Tag vorher abstimmt, kriagt an WP! Und: D'Orga is no frei, wer reglt's? 🍺`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== vonMemberId).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titel, text, '/termin'),
    mailAn(empfaenger, titel, `Servus!\n\n${text}\n\n→ ${appUrl('/termin')}\n\n${mailSignatur()}`),
  ]);
}

/** Best-effort-Geocoding über Nominatim (OSM), scheitert leise. */
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': `${appHost()} (Stammtisch-App)` },
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
 * Nur Google-Hosts als Wirtshaus-Foto-URL, sonst könnte ein manipulierter
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
  // Google-Fotos nur beim Gründer (Feature wirtshausFotos) — sonst koa Foto in die DB
  const fotoRoh = tenantConfig().features.wirtshausFotos ? erlaubteFotoUrl(String(formData.get('w_photoUrl') ?? '').trim()) : null;
  // Foto sofort als Data-URL in die DB holen, Google-URLs laufen ab/zicken.
  // Klappt der Download grad ned, bleibt die stabile URL als Fallback.
  const fotoStabil = fotoRoh ? await stabileFotoUrl(fotoRoh) : null;
  const photoUrl = fotoStabil ? ((await fotoAlsDataUrl(fotoStabil)) ?? fotoStabil) : null;
  let lat = Number(formData.get('w_lat')) || null;
  let lng = Number(formData.get('w_lng')) || null;
  if (lat == null || lng == null) {
    const coords = await geocode(adresse ? `${adresse}` : mitOrt(name, tenantConfig().geo));
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
  }
  // Optional: das Helle vom Finder, nur echte Einträge von der Karte zulassen
  const biersorteRoh = String(formData.get('w_biersorte') ?? '').trim();
  const biersorte = [...HELLE, ...ALKOHOLFREIE_HELLE].some((b) => b.name === biersorteRoh) ? biersorteRoh : undefined;
  const wid = newId('w');
  db.insert(wirtshaeuser)
    .values({ id: wid, name, adresse, bezirk, telefon, photoUrl, lat, lng, vorgeschlagenVon, ...(biersorte ? { biersorte } : {}), createdAt: nowIso() })
    .run();
  return wid;
}

export type VorschlagErgebnis = { ok: true } | { ok: false; meldung: string };

/**
 * „Wirtshaus gfunden", darf jeder: landet als offener Pin auf der Karte
 * und steht dem nächsten Organisator zur Auswahl.
 *
 * Harte Regeln (serverseitig, unscharfer Namensabgleich wie in der Suche):
 * schon besuchte/Altbestand-Wirtshäuser, das eingeplante nächste und schon
 * vorgeschlagene dürfen NICHT nochmal vorgeschlagen werden, sonst gäb's
 * doppelte Pins und erschummelte Vorschlags-WP.
 */
export async function wirtshausVorschlagen(formData: FormData): Promise<VorschlagErgebnis> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  const name = String(formData.get('w_name') ?? '').trim() || String(formData.get('w_freitext') ?? '').trim();
  if (!name) return { ok: false, meldung: 'Koa Wirtshaus eingeben, such oans aus oder tipp an Namen.' };
  const bekannt = findeBekanntes(name, getBekannteWirtshaeuser());
  if (bekannt) {
    const meldung =
      bekannt.art === 'besucht'
        ? `„${bekannt.name}“ steht scho in eurer Chronik, a Wirtshaus wird nie zweimal bsucht.`
        : bekannt.art === 'eingeplant'
          ? `„${bekannt.name}“ steht scho als nächster Stammtisch fest.`
          : `„${bekannt.name}“ ${bekannt.von ? `hat ${bekannt.von} scho gfunden` : 'is scho vorgschlagen'}, steht als „Offen“ auf da Kartn.`;
    return { ok: false, meldung };
  }
  await wirtshausAusSuche(formData, me.id);
  revalidateAll();
  return { ok: true };
}

export async function wirtshausFestlegen(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  // Festlegen/Ändern darf der Organisator, der aktuelle Präsident oder der
  // Admin, und nur solange der Abend nicht läuft/abgeschlossen is (löst
  // Push + Mail an alle aus). Ohne Organisator wird zuerst gschnappt.
  const darf = me.role === 'admin' || termin.planerId === me.id || me.id === getPraesidentId();
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
  const titel = `📍 Steht fest: ${wirtshaus?.name ?? 'Wirtshaus'}`;
  const text = `Da gehts hin! ${wirtshaus?.name ?? '—'}${wirtshaus?.bezirk ? ` (${wirtshaus.bezirk})` : ''} am ${wann}. Wer no ned abgstimmt hat, letzte Chance, sag zua oder ab!`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== me.id).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titel, text, '/termin'),
    mailAn(empfaenger, titel, `Servus!\n\n${text}\n\n→ ${appUrl('/termin')}\n\n${mailSignatur()}`),
  ]);
  revalidateAll();
}

// Nur echte Push-Dienste als Ziel, sonst könnte ein Abo den Server beliebige
// (auch interne) URLs anfragen lassen (SSRF).
function istPushDienst(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname;
    return (
      host === 'fcm.googleapis.com' ||
      host === 'updates.push.services.mozilla.com' ||
      host.endsWith('.push.services.mozilla.com') ||
      host.endsWith('.notify.windows.com') ||
      host.endsWith('.push.apple.com')
    );
  } catch {
    return false;
  }
}

/** Push-Abo eines Geräts speichern (kommt aus dem Service-Worker-Subscribe im Client). */
export async function pushAbonnieren(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const me = await getCurrentMember();
  if (!me || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;
  if (!istPushDienst(sub.endpoint)) return;
  db.insert(pushSubscriptions)
    .values({ id: newId('p'), memberId: me.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, createdAt: nowIso() })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { memberId: me.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    })
    .run();
}

/** Push für dieses Gerät abbestellen (Profil-Schalter): nur die eigene Subscription. */
export async function pushAbbestellen(endpoint: string) {
  const me = await getCurrentMember();
  if (!me || !endpoint) return;
  db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.memberId, me.id))).run();
}

export async function abstimmen(terminId: string, wert: 'zu' | 'ab') {
  // „Vielleicht" is abgschafft, alte Stimmen bleiben in der DB, neue gibt's nur no zu/ab
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
    // erstmalsAm bleibt stehen, für den Abstimm-Bonus zählt die erste Stimme
    db.update(votes).set({ wert, updatedAt: nowIso() }).where(eq(votes.id, vorhanden.id)).run();
  } else {
    db.insert(votes)
      .values({ id: newId('v'), terminId, memberId: me.id, wert, updatedAt: nowIso(), erstmalsAm: nowIso() })
      .run();
  }
  revalidateAll();
}

export type OrgaErgebnis = { ok: true } | { ok: false; meldung: string };

/**
 * „I regle das!", sobald der Termin steht, derf sich JEDER den Organisator-
 * Posten schnappen (wer zuerst kommt, reglt's). Einzige Sperre: wer den
 * letzten Stammtisch organisiert hat, muss aussetzen, koa Doppel-Orga
 * hintereinander (von Julius am 29.08.2026 so festgelegt).
 */
export async function orgaSchnappen(terminId: string): Promise<OrgaErgebnis> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return { ok: false, meldung: 'Der Termin is nimmer da.' };
  if (termin.phase !== 'planung') return { ok: false, meldung: 'Der Termin is scho in der Reservierung, z’spät.' };
  if (termin.planerId) return { ok: false, meldung: 'Zu langsam, d’Orga hat sich scho wer gschnappt.' };
  const letzter = getLetzterAbgeschlossenerTermin();
  if (letzter?.planerId === me.id) {
    return { ok: false, meldung: 'Du hast grad erst organisiert, der Nächste is dran. Zwoamoi hintereinander gibt’s ned.' };
  }
  db.update(termine).set({ planerId: me.id }).where(eq(termine.id, terminId)).run();

  // 📣 Alle wissen lassen, dass d'Orga vergeben is, sonst rennen zwoa los
  const titel = '🙋 D’Orga is vergeben!';
  const text = `${anzeigeName(me)} reglt’s, organisiert den Stammtisch am ${datumLang(termin.datum)} und suacht a Wirtshaus aus.`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== me.id).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titel, text, '/termin'),
    mailAn(empfaenger, titel, `Servus!\n\n${text}\n\n→ ${appUrl('/termin')}\n\n${mailSignatur()}`),
  ]);
  revalidateAll();
  return { ok: true };
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

export type BierdeckelErgebnis = { ok: true; hoiben: number } | { ok: false; meldung: string };

/**
 * Bierdeckel: eigene Hoiben LIVE am Stammtisch-Abend stricheln (ab der
 * Termin-Uhrzeit bis zum Abschluss). Schreibt den absoluten Stand in den
 * eigenen Besuchs-Eintrag, der Abschluss-Zettel übernimmt die Striche
 * dann als Vorbelegung. Jeder derf NUR für sich selber stricheln.
 */
export async function hoibenStricheln(terminId: string, hoiben: number): Promise<BierdeckelErgebnis> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return { ok: false, meldung: 'Der Termin is nimmer da.' };
  if (!bierdeckelOffen(termin, nowIso())) {
    return { ok: false, meldung: `Da Bierdeckel is zua, gstrichelt wird erst am Stammtisch-Abend ab ${termin.zeit || '19:00'} Uhr.` };
  }
  const wert = Math.max(0, Math.min(30, Math.round(Number(hoiben) || 0)));
  const werte = { anwesend: true, hoiben: wert };
  db.insert(besuche)
    .values({ id: newId('b'), terminId, memberId: me.id, ...werte })
    .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: werte })
    .run();
  revalidatePath('/termin');
  revalidatePath('/');
  return { ok: true, hoiben: wert };
}

/** 🥃 Schnaps stricheln (nur Stammtische mit Feature schnaps), gleiche Regeln wie die Hoibe. */
export async function schnapsStricheln(terminId: string, schnaps: number): Promise<{ ok: true; schnaps: number } | { ok: false; meldung: string }> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  if (!tenantConfig().features.schnaps) return { ok: false, meldung: 'Bei euch wird ned gschnapselt.' };
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return { ok: false, meldung: 'Der Termin is nimmer da.' };
  if (!bierdeckelOffen(termin, nowIso())) {
    return { ok: false, meldung: `Da Bierdeckel is zua, gstrichelt wird erst am Stammtisch-Abend ab ${termin.zeit || '19:00'} Uhr.` };
  }
  const wert = Math.max(0, Math.min(30, Math.round(Number(schnaps) || 0)));
  const werte = { anwesend: true, schnaps: wert };
  db.insert(besuche)
    .values({ id: newId('b'), terminId, memberId: me.id, ...werte })
    .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: werte })
    .run();
  revalidatePath('/termin');
  revalidatePath('/');
  return { ok: true, schnaps: wert };
}

const STRAFE_GRUND_PREFIX = 'Zugesagt & nicht erschienen';

/**
 * Besuch abschließen, NUR die Logistik des Abends: wer da war, Hoiben/🍖/🚕/
 * ⭐(Runde) pro Anwesendem, Kaiserschmarrn bestellt (einer für alle, jeder isst
 * mit), Bier + Weißbier am Wirtshaus. Die BEWERTUNG läuft getrennt, jeder für
 * sich über meineBewertung(), der Abend-Schnitt entsteht aus allen Einzelnen.
 * Abschließen darf jeder (der Erste kriegt PTS.abschluss WP, meiste Abschlüsse
 * = Schriftführer), aber erst, wenn der Abend rum is (abschlussOffen, 2 Std.
 * nach Beginn), damit koaner mittendrin zuamacht.
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
  if (termin.phase === 'heute' && !abschlussOffen(termin, nowIso())) return;

  const gelistet = formData.getAll('memberId').map(String);
  const kaisiBestellt = formData.get('kaisiBestellt') === 'on';
  const dabeiIds = gelistet.filter((id) => formData.get(`anwesend_${id}`) === 'on');
  const abgsagtIds = gelistet.filter((id) => formData.get(`abgsagt_${id}`) === 'on');
  const rundenIds: string[] = [];

  // Für ALLE aktiven Mitglieder einen Besuchs-Eintrag schreiben (wichtig für die Serien):
  // gelistet-anwesend mit Werten, alle anderen als gefehlt. Die Bewertungs-Spalten
  // (sterne/kommentar/…) bleiben unangetastet, die gehören jedem selber.
  for (const m of getAktiveMitglieder()) {
    const anwesend = dabeiIds.includes(m.id);
    const hoiben = anwesend ? Math.max(0, Number(formData.get(`hoiben_${m.id}`) ?? 0) || 0) : 0;
    const schnaps = anwesend && tenantConfig().features.schnaps ? Math.max(0, Number(formData.get(`schnaps_${m.id}`) ?? 0) || 0) : 0;
    const brodn = anwesend && formData.get(`brodn_${m.id}`) === 'on';
    if (anwesend && formData.get(`runde_${m.id}`) === 'on') rundenIds.push(m.id);
    const werte = {
      anwesend,
      hoiben,
      schnaps,
      kaiserschmarrn: anwesend && kaisiBestellt ? 1 : 0, // geteilt, jeder hat mitgegessen
      schweinsbraten: brodn ? 1 : 0,
      taxi: anwesend && formData.get(`taxi_${m.id}`) === 'on',
    };
    db.insert(besuche)
      .values({ id: newId('b'), terminId, memberId: m.id, ...werte })
      .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: werte })
      .run();
  }

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
  const rundenWert = dabeiIds.length * hoibePreisCents();
  db.delete(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'runde'))).run();
  for (const memberId of rundenIds) {
    db.insert(kasse)
      .values({
        id: newId('k'), memberId, terminId,
        grund: `Runde gschmissen im ${wirtshausName} 🍻 (${dabeiIds.length} × ${hoibePreisEuro()} €)`,
        betragCents: rundenWert, kind: 'runde', status: 'beglichen', createdAt: nowIso(),
      })
      .run();
  }

  // ❌ Zugesagt & nicht erschienen → offene Forderung: Runde = Teilnehmer × Kellerpreis.
  // Offene Auto-Strafen dieses Termins neu aufbauen (beglichene bleiben unangetastet);
  // die Zahlungsaufforderung mit PayPal-Link erscheint dem Spezl auf der Startseite.
  const betrag = dabeiIds.length * hoibePreisCents();
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
        grund: `${STRAFE_GRUND_PREFIX}: Runde für die Spezln (${dabeiIds.length} × ${hoibePreisEuro()} €) im ${wirtshausName}`,
        betragCents: -betrag, kind: 'strafe', status: 'offen', createdAt: nowIso(),
      })
      .run();
  }

  // Der erste Abschließer kriegt den Punkt, Nachträge ändern das nicht mehr.
  const erstAbschluss = !termin.abgeschlossenVon;
  db.update(termine)
    .set({
      phase: 'abgeschlossen',
      abgeschlossenVon: termin.abgeschlossenVon ?? me.id,
      abgeschlossenAm: termin.abgeschlossenAm ?? nowIso(),
    })
    .where(eq(termine.id, terminId))
    .run();

  // 📅 Wer abschließt, macht den nächsten Stammtisch aus (nur beim ersten
  // Abschluss, und nur wenn no koa neuer Termin steht) — d'Abstimmung startet dann für alle.
  const naechstesDatum = String(formData.get('naechstesDatum') ?? '').trim();
  if (erstAbschluss && naechstesDatum && !getAktuellerTermin()) {
    await terminAnlegen(naechstesDatum, String(formData.get('naechsteZeit') ?? '19:00').trim(), me.id);
  }

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
          grund: `Strafrunde: 3× unentschuldigt gfehlt (${dabeiIds.length} × ${hoibePreisEuro()} €)`,
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
      if (neuMail) sendungen.push(mailAn([neuMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${neuName}!\n\n${texte.anNeuen}\n\n→ ${appUrl('/spezln')}\n\n${mailSignatur()}`));
      if (altMail && w.altId) sendungen.push(mailAn([altMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${nameVon(w.altId)}!\n\n${texte.anAlten}\n\n→ ${appUrl('/spezln')}\n\n${mailSignatur()}`));
    }
    await Promise.allSettled(sendungen);
  }
  revalidateAll();
}

/**
 * Wirtshaus-Foto aus der Google-Places-Suche (läuft im Client über die Maps-JS-Library,
 * weil der API-Key referrer-beschränkt ist) in der DB hinterlegen. Nur einmal, wird
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
    /* Netz/Timeout, dann lieber gar koa Foto als a bald kaputtes */
  }
  return null;
}

export async function wirtshausFotoSetzen(wirtshausId: string, photoUrl: string) {
  const me = await getCurrentMember();
  if (!me) return;
  if (!tenantConfig().features.wirtshausFotos) return;
  if (!erlaubteFotoUrl(photoUrl)) return;
  const w = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get();
  if (!w || w.photoUrl) return;
  const stabil = await stabileFotoUrl(photoUrl);
  if (!stabil) return;
  // Als Data-URL speichern (lädt für immer zuverlässig); Fallback: stabile URL
  db.update(wirtshaeuser).set({ photoUrl: (await fotoAlsDataUrl(stabil)) ?? stabil }).where(eq(wirtshaeuser.id, wirtshausId)).run();
  revalidatePath('/karte');
}

/**
 * Orts-Backfill aus der Places-Textsuche im Client (wie das Foto): füllt NUR
 * fehlende Koordinaten/Adresse, v. a. für die Altbestand-Wirtshäuser, die
 * das Seed-Script ohne Ortsdaten anlegt.
 */
export async function wirtshausOrtSetzen(wirtshausId: string, daten: { lat: number; lng: number; adresse?: string | null }) {
  const me = await getCurrentMember();
  if (!me) return;
  const lat = Number(daten?.lat);
  const lng = Number(daten?.lng);
  // Stadt & Umland (config.geo), alles andere ist ein Fehlgriff der Suche; ohne Geo-Config koa Grenze
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !imUmkreis(tenantConfig().geo, lat, lng)) return;
  const w = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get();
  if (!w || w.lat != null) return;
  const adresse = String(daten.adresse ?? '').trim().slice(0, 200) || null;
  db.update(wirtshaeuser)
    .set({ lat, lng, ...(w.adresse ? {} : { adresse }) })
    .where(eq(wirtshaeuser.id, wirtshausId))
    .run();
  revalidatePath('/karte');
}

export type BewertungErgebnis =
  | { ok: true; neuBewertet: boolean; neuerText: boolean }
  | { ok: false; meldung: string };

/**
 * „Mei Bewertung", jeder Spezl bewertet den Abend für sich: Sterne + Freitext
 * zum Wirtshaus, dazu Kaisi/Brodn NUR wenn er selber probiert hat. Der Abend-
 * Schnitt (und die Orga-WP) entsteht aus allen Einzel-Bewertungen; die Frei-
 * texte landen alle im Archiv. Offen ab dem Stammtisch-Abend (wie der Bier-
 * deckel) bis 7 Tage nach dem Abschluss, jederzeit änderbar, die WP
 * (+PTS.bewertung, +PTS.bewertungsText mit Text) gibt's natürlich nur einmal.
 */
export async function meineBewertung(terminId: string, formData: FormData): Promise<BewertungErgebnis> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return { ok: false, meldung: 'Der Termin is nimmer da.' };
  const offen =
    bierdeckelOffen(termin, nowIso()) ||
    (termin.phase === 'abgeschlossen' && nachtragsfristOffen(termin.abgeschlossenAm));
  if (!offen) {
    return { ok: false, meldung: 'D’Bewertung is zua, bewertet wird ab dem Stammtisch-Abend bis 7 Tag nach’m Abschluss.' };
  }
  const eigener = db
    .select()
    .from(besuche)
    .where(and(eq(besuche.terminId, terminId), eq(besuche.memberId, me.id)))
    .get();
  // Nach dem Abschluss steht fest, wer dabei war, bewerten derfen nur die.
  if (termin.phase === 'abgeschlossen' && !eigener?.anwesend) {
    return { ok: false, meldung: 'Du warst ned dabei, bewerten derfen nur d’Spezln vom Abend.' };
  }

  const zehntel = (name: string) => {
    const v = Number(String(formData.get(name) ?? '').replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? Math.min(5, Math.round(v * 10) / 10) : null;
  };
  const text = (name: string) => String(formData.get(name) ?? '').trim().slice(0, 500) || null;
  const sterne = zehntel('sterne');
  if (sterne == null) return { ok: false, meldung: 'Ohne Sterne koa Bewertung, dreh am Stepper.' };
  const kaisi = formData.get('kaisiProbiert') === 'on';
  const brodn = formData.get('brodnGessen') === 'on';
  const werte = {
    anwesend: true,
    sterne,
    kommentar: text('kommentar'),
    // Kaisi/Brodn probiert → zählt auch als gegessen (belegt den Abschluss-Zettel vor)
    kaiserschmarrn: kaisi ? 1 : 0,
    kaiserSterne: kaisi ? zehntel('kaiserSterne') : null,
    kaiserNotiz: kaisi ? text('kaiserNotiz') : null,
    schweinsbraten: brodn ? 1 : 0,
    brodnSterne: brodn ? zehntel('brodnSterne') : null,
    brodnNotiz: brodn ? text('brodnNotiz') : null,
  };
  db.insert(besuche)
    .values({ id: newId('b'), terminId, memberId: me.id, ...werte })
    .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: werte })
    .run();
  revalidateAll();
  return {
    ok: true,
    neuBewertet: eigener?.sterne == null,
    neuerText: !eigener?.kommentar?.trim() && !!werte.kommentar,
  };
}

export type CheckinErgebnis = { ok: true; erster: boolean } | { ok: false; meldung: string };

/**
 * Einchecken: wer scho im Wirtshaus sitzt, meldet sich, der Erste kriegt
 * PTS.checkin WP, sagt im Freitext wo ihr hockts („hinten rechts, bei der
 * Band") und alle Spezln kriegen an Push. Geht am Stammtisch-Tag ab
 * CHECKIN_VORLAUF_STUNDEN vor Beginn; markiert nebenbei die Anwesenheit
 * (belegt Bierdeckel & Abschluss-Zettel vor).
 */
export async function einchecken(terminId: string, formData: FormData): Promise<CheckinErgebnis> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return { ok: false, meldung: 'Der Termin is nimmer da.' };
  if (!checkinOffen(termin, nowIso())) {
    return { ok: false, meldung: `Eingecheckt wird am Stammtisch-Tag ab ${CHECKIN_VORLAUF_STUNDEN} Stund’ vor Beginn.` };
  }
  const platz = String(formData.get('platz') ?? '').trim().slice(0, 120) || null;
  const vorhandene = db.select().from(checkins).where(eq(checkins.terminId, terminId)).all();
  const meiner = vorhandene.find((c) => c.memberId === me.id);
  // Der ERSTE muss sagen, wo ihr hockts, Pflichtfeld (von Julius, 29.08.2026);
  // wer nachkommt, checkt mit oam Tipper ein.
  if (!meiner && vorhandene.length === 0 && !platz) {
    return { ok: false, meldung: 'Sag no dazua, wo ihr hockts, „hinten rechts", „bei der Band"… dann finden di d’Spezln.' };
  }
  if (meiner) {
    if (platz) db.update(checkins).set({ platz }).where(eq(checkins.id, meiner.id)).run();
  } else {
    db.insert(checkins)
      .values({ id: newId('c'), terminId, memberId: me.id, platz, createdAt: nowIso() })
      .run();
  }
  // Wer eingecheckt is, is da, Besuchs-Eintrag anlegen/markieren
  db.insert(besuche)
    .values({ id: newId('b'), terminId, memberId: me.id, anwesend: true })
    .onConflictDoUpdate({ target: [besuche.terminId, besuche.memberId], set: { anwesend: true } })
    .run();

  const erster = !meiner && vorhandene.length === 0;
  if (erster) {
    const wirtshaus = termin.wirtshausId
      ? db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, termin.wirtshausId)).get()
      : null;
    const titel = `🍺 ${anzeigeName(me)} is scho da!`;
    const text = `${anzeigeName(me)} sitzt scho im ${wirtshaus?.name ?? 'Wirtshaus'}${platz ? `, „${platz}“` : ''}. Nachkemma!`;
    await pushAnAlle(titel, text, '/');
  }
  revalidateAll();
  return { ok: true, erster };
}
