'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, kasse, strafenRegeln } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { getKassenwartId, getPraesidentId } from '@/lib/queries';
import { newId, nowIso } from '@/lib/ids';
import { katalog } from '@/lib/strafen-regeln';
import { strafeBuchen, strafeZuruecknehmen, strafeErlassen, buchungZurKasse, buchungStatusAusKasse } from '@/lib/strafen';

function revalidate() {
  revalidatePath('/kasse');
  revalidatePath('/termin');
  revalidatePath('/termin/abschluss');
  revalidatePath('/');
}

/** Euro-Betrag aus dem Formular in Cent (0 bei Murks), höchstens 10.000 €. */
function centsAus(formData: FormData, feld: string): number {
  const n = Math.round(Math.abs(Number(String(formData.get(feld) ?? '').replace(',', '.')) || 0) * 100);
  return Number.isFinite(n) && n <= 1_000_000 ? n : 0;
}

export type StrafAntwort = { ok: boolean; meldung: string };

/** Strafe aus dem Katalog buchen (Kasse oder Zettel), darf jeder. */
export async function strafeBuchenAction(formData: FormData): Promise<StrafAntwort> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Nicht angemeldet.' };
  const memberId = String(formData.get('memberId') ?? '');
  const regelId = String(formData.get('regelId') ?? '');
  const terminId = String(formData.get('terminId') ?? '') || null;
  const r = await strafeBuchen(me, memberId, regelId, terminId);
  if (r.ok) revalidate();
  return r;
}

export async function strafeZuruecknehmenAction(strafeId: string): Promise<boolean> {
  const me = await getCurrentMember();
  if (!me) return false;
  const ok = await strafeZuruecknehmen(me, strafeId);
  if (ok) revalidate();
  return ok;
}

export async function strafeErlassenAction(strafeId: string): Promise<boolean> {
  const me = await getCurrentMember();
  if (!me) return false;
  const ok = await strafeErlassen(me, strafeId);
  if (ok) revalidate();
  return ok;
}

/**
 * Status einer Forderung ändern, Rollen wie am Stammtisch:
 * beglichen/offen setzt der Kassenwart (er treibt ein), erlassen (aufgehoben)
 * darf nur der Präsident. Der Admin kann beides.
 */
export async function forderungStatus(id: string, status: 'offen' | 'beglichen' | 'aufgehoben') {
  const me = await getCurrentMember();
  if (!me) return;
  // Server Actions sind direkt per POST aufrufbar, Status zur Laufzeit prüfen
  if (!['offen', 'beglichen', 'aufgehoben'].includes(status)) return;
  const istAdmin = me.role === 'admin';
  if (status === 'aufgehoben') {
    if (!istAdmin && me.id !== getPraesidentId()) return;
  } else {
    if (!istAdmin && me.id !== getKassenwartId()) return;
  }
  const eintrag = db.select().from(kasse).where(eq(kasse.id, id)).get();
  if (!eintrag) return;
  // Strafe aus dem Katalog: Erlassen nach dessen Regeln (erlassbar, ned die eigene)
  const buchung = buchungZurKasse(id);
  if (buchung && status === 'aufgehoben') {
    await strafeErlassen(me, buchung.id);
    revalidate();
    return;
  }
  db.update(kasse).set({ status }).where(eq(kasse.id, id)).run();
  buchungStatusAusKasse(id, status);
  revalidate();
}

/** Katalog pflegen dürfen Admin und Präsident. */
function darfKatalog(me: { id: string; role: string }): boolean {
  return me.role === 'admin' || me.id === getPraesidentId();
}

/** WP-Abzüge aus dem Formular („5“ heißt −5 WP), höchstens 99. */
function abzug(roh: FormDataEntryValue | null): number {
  const n = Math.round(Math.abs(Number(String(roh ?? '').replace(',', '.')) || 0));
  return -Math.min(99, n);
}

/**
 * Strafe anlegen oder ändern. Bei festen Strafen bleibt die Art, Name und
 * Staffel/Frist san einstellbar. Eigene Strafen haben einen WP-Wert.
 */
export async function regelSpeichern(formData: FormData): Promise<StrafAntwort> {
  const me = await getCurrentMember();
  if (!me || !darfKatalog(me)) return { ok: false, meldung: 'Den Katalog pflegen nur Präsident und Admin.' };
  const id = String(formData.get('id') ?? '');
  const alt = id ? katalog().find((r) => r.id === id) : undefined;
  if (id && !alt) return { ok: false, meldung: 'Die Strafe gibt’s nicht.' };
  const art = alt?.art ?? 'eigene';
  const name = String(formData.get('name') ?? '').trim().slice(0, 80);
  if (!name) return { ok: false, meldung: 'Die Strafe braucht einen Namen.' };
  const detail = String(formData.get('detail') ?? '').trim().slice(0, 500) || null;
  const betragCents = centsAus(formData, 'betrag');
  const wpStaffel = art === 'eigene' || art === 'serie' ? [abzug(formData.get('wp'))] : formData.getAll('staffel').map(abzug).slice(0, 6);
  if (wpStaffel.length === 0) wpStaffel.push(0);
  const fristArtRoh = String(formData.get('fristArt') ?? 'beginn');
  const fristArt = fristArtRoh === 'tage' || fristArtRoh === 'stunden' ? fristArtRoh : 'beginn';
  const fristWert = Math.min(fristArt === 'tage' ? 14 : 72, Math.max(1, Math.round(Number(formData.get('fristWert')) || 1)));
  const werte = {
    name,
    detail,
    wpStaffel,
    betragCents,
    erlassbar: formData.get('erlassbar') === 'on',
    aktiv: formData.get('aktiv') !== 'aus',
    ...(art === 'unentschuldigt'
      ? { fristArt: fristArt as 'beginn' | 'tage' | 'stunden', fristWert: fristArt === 'beginn' ? 0 : fristWert, nichtEingetragenZusage: formData.get('nichtEingetragenZusage') === 'on' }
      : {}),
    geaendertAm: nowIso(),
    geaendertVon: me.id,
  };
  if (alt) {
    db.update(strafenRegeln).set(werte).where(eq(strafenRegeln.id, alt.id)).run();
  } else {
    db.insert(strafenRegeln).values({ id: newId('sr'), art: 'eigene', sort: 100, erstelltAm: nowIso(), erstelltVon: me.id, ...werte, geaendertAm: null, geaendertVon: null }).run();
  }
  revalidate();
  return { ok: true, meldung: alt ? 'Gespeichert, gilt ab jetzt.' : `„${name}“ steht im Katalog.` };
}

/** Einzahlung oder geschmissene Runde (positiv, sofort wirksam). */
export async function einzahlung(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  // Bares nimmt der Kassenwart entgegen und digitalisiert's, nur er (und der Admin) bucht ein
  if (me.role !== 'admin' && me.id !== getKassenwartId()) return;
  const memberId = String(formData.get('memberId') ?? me.id);
  const grund = String(formData.get('grund') ?? '').trim() || 'Einzahlung';
  const betrag = Math.abs(Number(String(formData.get('betrag') ?? '0').replace(',', '.')) || 0);
  const kind = formData.get('kind') === 'runde' ? 'runde' : 'einzahlung';
  if (!betrag) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId,
      grund,
      betragCents: Math.round(betrag * 100),
      kind,
      status: 'beglichen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

/** Freiwillige Spende in €, darf jeder, zählt für einen selbst. */
export async function spenden(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const cents = centsAus(formData, 'betrag');
  const anlass = String(formData.get('grund') ?? '').trim().slice(0, 200);
  if (!cents) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId: me.id,
      grund: anlass ? `Spende, ${anlass}` : 'Spende',
      betragCents: cents,
      kind: 'einzahlung',
      status: 'beglichen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

/**
 * 💶 Auslage für'n Verein: wer privat was zahlt hat (Hosting, Domain, …),
 * trägt's hier ein, darf jeder, steht als Minus mit seinem Namen im Buch.
 */
export async function auslage(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const grund = String(formData.get('grund') ?? '').trim().slice(0, 200);
  const betrag = Math.abs(Number(String(formData.get('betrag') ?? '0').replace(',', '.')) || 0);
  if (!grund || !betrag) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId: me.id,
      grund,
      betragCents: -Math.round(betrag * 100),
      kind: 'ausgabe',
      status: 'beglichen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

/** Club-Ausgabe (negativ, senkt den Saldo sofort), bucht nur der Kassenwart oder der Admin. */
export async function ausgabe(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  if (me.role !== 'admin' && me.id !== getKassenwartId()) return;
  const grund = String(formData.get('grund') ?? '').trim();
  const betrag = Math.abs(Number(String(formData.get('betrag') ?? '0').replace(',', '.')) || 0);
  if (!grund || !betrag) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      grund,
      betragCents: -Math.round(betrag * 100),
      kind: 'ausgabe',
      status: 'beglichen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}
