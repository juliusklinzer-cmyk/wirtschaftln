'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, kasse } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { getKassenwartId, getPraesidentId, getAktiveMitglieder } from '@/lib/queries';
import { HOIBE_KELLERPREIS_CENTS } from '@/lib/preise';
import { newId, nowIso } from '@/lib/ids';
import { anzeigeName } from '@/lib/namen';
import { pushAn } from '@/lib/push';
import { mailAn } from '@/lib/mail';

/** Anzahl Hoibe aus dem Formular (1–99) — gezahlt wird beim Wirtschaftln in Hoibe, ned in Euro. */
function hoibeAnzahl(formData: FormData): number {
  const n = Math.round(Number(formData.get('hoibe')));
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : 0;
}

function revalidate() {
  revalidatePath('/kasse');
  revalidatePath('/');
}

/**
 * Wirtschaftler melden: „Na, also des kost a Runde!" — Grund frei formuliert,
 * gezahlt wird in Hoibe (n × Bräustüberl-Preis). Eher Gaudi als Bußgeld.
 */
export async function melden(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const memberId = String(formData.get('memberId') ?? '');
  const grund = String(formData.get('grund') ?? '').trim().slice(0, 200);
  const hoibe = hoibeAnzahl(formData);
  if (!memberId || !grund || !hoibe) return;
  const opfer = getAktiveMitglieder().find((m) => m.id === memberId);
  if (!opfer) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId,
      grund: `${grund} — des kost ${hoibe === 1 ? 'a Hoibe' : `${hoibe} Hoibe`} 🍺`,
      betragCents: -(hoibe * HOIBE_KELLERPREIS_CENTS),
      kind: 'strafe',
      status: 'offen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();

  // ⚖️ Der Gmeldte kriagt Bescheid (Push + Mail)
  const titel = '⚖️ Du wurdst gmeldt!';
  const text = `${anzeigeName(me)} hat di gmeldt: „${grund}" — des kost ${hoibe === 1 ? 'a Hoibe' : `${hoibe} Hoibe`}. Zohl beim Kassenwart oder per PayPal. 🍺`;
  await Promise.allSettled([
    pushAn([memberId], titel, text, '/kasse'),
    mailAn([opfer.email], titel, `Servus ${anzeigeName(opfer)}!\n\n${text}\n\n→ https://wirtschaftln.de/kasse\n\nDei Wirtschaftln-App`),
  ]);
  revalidate();
}

/**
 * Status einer Forderung ändern — Rollen wie am Stammtisch:
 * beglichen/offen setzt der Kassenwart (er treibt ein), erlassen (aufgehoben)
 * darf nur der Präsident. Der Admin kann beides.
 */
export async function forderungStatus(id: string, status: 'offen' | 'beglichen' | 'aufgehoben') {
  const me = await getCurrentMember();
  if (!me) return;
  // Server Actions sind direkt per POST aufrufbar — Status zur Laufzeit prüfen
  if (!['offen', 'beglichen', 'aufgehoben'].includes(status)) return;
  const istAdmin = me.role === 'admin';
  if (status === 'aufgehoben') {
    if (!istAdmin && me.id !== getPraesidentId()) return;
  } else {
    if (!istAdmin && me.id !== getKassenwartId()) return;
  }
  const eintrag = db.select().from(kasse).where(eq(kasse.id, id)).get();
  if (!eintrag) return;
  db.update(kasse).set({ status }).where(eq(kasse.id, id)).run();
  revalidate();
}

/** Einzahlung oder geschmissene Runde (positiv, sofort wirksam). */
export async function einzahlung(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  // Bares nimmt der Kassenwart entgegen und digitalisiert's — nur er (und der Admin) bucht ein
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

/** 🍺 Hoibe eini schmeißen: freiwillige Spende in Hoibe — darf jeder, zählt für einen selbst. */
export async function spenden(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const hoibe = hoibeAnzahl(formData);
  const anlass = String(formData.get('grund') ?? '').trim().slice(0, 200);
  if (!hoibe) return;
  const hoibeText = hoibe === 1 ? 'a Hoibe' : `${hoibe} Hoibe`;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId: me.id,
      grund: anlass ? `💝 ${hoibeText} gspendt — ${anlass}` : `💝 ${hoibeText} gspendt`,
      betragCents: hoibe * HOIBE_KELLERPREIS_CENTS,
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
 * trägt's hier ein — darf jeder, steht als Minus mit seinem Namen im Buch.
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
      grund: `Auslage — ${grund}`,
      betragCents: -Math.round(betrag * 100),
      kind: 'ausgabe',
      status: 'beglichen',
      gemeldetVon: me.id,
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

/** Club-Ausgabe (negativ, senkt den Saldo sofort) — bucht nur der Kassenwart oder der Admin. */
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
