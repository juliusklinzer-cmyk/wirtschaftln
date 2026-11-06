'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentMember } from '@/lib/session';
import { getAktiveMitglieder } from '@/lib/queries';
import { praesidentGewaehlt } from '@/lib/praesident';
import { offeneWahl, praesidentEintragen, stimmeAbgeben, wahlAuswerten, wahlStarten } from '@/lib/praesident-wahl';
import { pushAnAlle } from '@/lib/push';
import { anzeigeName } from '@/lib/namen';

export type WahlAntwort = { ok: boolean; meldung: string };

const neuLaden = () => {
  revalidatePath('/');
  revalidatePath('/stammtisch');
  revalidatePath('/spezln');
};

/** Stimme bei der Präsidentenwahl abgeben oder ändern (jeder Spezl, oa Stimme). */
export async function praesidentWaehlen(wahlId: string, kandidatId: string): Promise<WahlAntwort> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt, bitte neu einloggen.' };
  if (!stimmeAbgeben(String(wahlId), me.id, String(kandidatId))) return { ok: false, meldung: 'Die Wahl is scho vorbei.' };
  revalidatePath('/');
  return { ok: true, meldung: '✓ Dei Stimme is drin. Ändern geht, solang die Wahl offen is.' };
}

/** Admin: Wahl jetzt aufmachen (z. B. nach dem Umstellen mitten im Jahr). */
export async function praesidentWahlStarten(): Promise<WahlAntwort> {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return { ok: false, meldung: 'Das darf nur der Admin.' };
  if (!praesidentGewaehlt()) return { ok: false, meldung: 'Bei euch wird der Präsident nach WP bestimmt.' };
  if (offeneWahl()) return { ok: false, meldung: 'Es läuft scho a Wahl.' };
  await wahlStarten({ vonId: me.id });
  neuLaden();
  return { ok: true, meldung: '✓ Die Wahl is offen, alle san per Push informiert.' };
}

/** Admin: laufende Wahl vorzeitig auszählen. */
export async function praesidentWahlBeenden(): Promise<WahlAntwort> {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return { ok: false, meldung: 'Das darf nur der Admin.' };
  const wahl = offeneWahl();
  if (!wahl) return { ok: false, meldung: 'Es läuft koa Wahl.' };
  const gewinner = await wahlAuswerten(wahl.id);
  neuLaden();
  const m = getAktiveMitglieder().find((x) => x.id === gewinner);
  return { ok: true, meldung: m ? `✓ Ausgezählt: ${anzeigeName(m)} is Präsident.` : '✓ Ausgezählt, aber koaner hat abgstimmt. Der bisherige bleibt.' };
}

/** Admin: Präsident im laufenden Jahr selber eintragen. */
export async function praesidentSetzen(memberId: string): Promise<WahlAntwort> {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return { ok: false, meldung: 'Das darf nur der Admin.' };
  if (!praesidentGewaehlt()) return { ok: false, meldung: 'Bei euch wird der Präsident nach WP bestimmt.' };
  const m = getAktiveMitglieder().find((x) => x.id === memberId);
  if (!m) return { ok: false, meldung: 'Den Spezl gibt’s ned.' };
  praesidentEintragen(m.id);
  await pushAnAlle('👑 Neuer Präsident', `${anzeigeName(m)} is jetza Präsident.`, '/stammtisch');
  neuLaden();
  return { ok: true, meldung: `✓ ${anzeigeName(m)} is jetzt Präsident.` };
}
