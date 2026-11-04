import { eq } from 'drizzle-orm';
import { db, termine, besuche, wirtshaeuser, members } from '@/lib/db';
import { anzeigeName } from '@/lib/namen';
import { datumMitJahr } from '@/lib/format';
import { getStats } from '@/lib/queries';

/** Ein Rekord für „Unser Stammtisch“: Wert groß, darunter wer/wann. */
export type Rekord = { titel: string; wert: string; wer: string | null };

/**
 * Stammtisch-Rekorde (Julius, 04.11.2026) aus der Chronik: Abende,
 * Wirtshäuser, voller Tisch, durstigster Abend, Einzel-Rekord, längste
 * Serie, bester Abend. Nur abgeschlossene Abende zählen.
 */
export function stammtischRekorde(): Rekord[] {
  const abende = db.select().from(termine).where(eq(termine.phase, 'abgeschlossen')).all();
  if (abende.length === 0) return [];
  const alleBesuche = db.select().from(besuche).where(eq(besuche.anwesend, true)).all();
  const wirtshausName = new Map(db.select().from(wirtshaeuser).all().map((w) => [w.id, w.name]));
  const name = new Map(db.select().from(members).all().map((m) => [m.id, anzeigeName(m)]));
  const abendVon = new Map(abende.map((t) => [t.id, t]));
  const wo = (terminId: string) => {
    const t = abendVon.get(terminId);
    if (!t) return null;
    const w = t.wirtshausId ? wirtshausName.get(t.wirtshausId) : null;
    return [w, datumMitJahr(t.datum)].filter(Boolean).join(', ');
  };

  const proAbend = new Map<string, { leute: number; hoibe: number; sterne: number[] }>();
  for (const b of alleBesuche) {
    if (!abendVon.has(b.terminId)) continue;
    const a = proAbend.get(b.terminId) ?? { leute: 0, hoibe: 0, sterne: [] };
    a.leute += 1;
    a.hoibe += b.hoiben;
    if (b.sterne != null) a.sterne.push(b.sterne);
    proAbend.set(b.terminId, a);
  }
  const max = <T,>(liste: T[], wert: (x: T) => number) => liste.reduce<T | null>((best, x) => (best == null || wert(x) > wert(best) ? x : best), null);
  const eintraege = [...proAbend.entries()];
  const rekorde: Rekord[] = [
    { titel: 'Abende', wert: String(abende.length), wer: `seit ${datumMitJahr(abende.map((t) => t.datum).sort()[0])}` },
    { titel: 'Wirtshäuser', wert: String(new Set(abende.map((t) => t.wirtshausId).filter(Boolean)).size), wer: 'verschiedene besucht' },
  ];
  const voll = max(eintraege, ([, a]) => a.leute);
  if (voll && voll[1].leute > 0) rekorde.push({ titel: 'Vollster Tisch', wert: `${voll[1].leute} Spezln`, wer: wo(voll[0]) });
  const durst = max(eintraege, ([, a]) => a.hoibe);
  if (durst && durst[1].hoibe > 0) rekorde.push({ titel: 'Durstigster Abend', wert: `${durst[1].hoibe} Hoibe`, wer: wo(durst[0]) });
  const einzel = max(alleBesuche.filter((b) => abendVon.has(b.terminId)), (b) => b.hoiben);
  if (einzel && einzel.hoiben > 0) rekorde.push({ titel: 'Meiste Hoibe an einem Abend', wert: `${einzel.hoiben} Hoibe`, wer: `${name.get(einzel.memberId) ?? '?'} · ${wo(einzel.terminId) ?? ''}` });
  const serie = max(getStats(), (s) => s.bestStreak);
  if (serie && serie.bestStreak > 1) rekorde.push({ titel: 'Längste Serie', wert: `${serie.bestStreak} Abende`, wer: anzeigeName(serie.member) });
  const bester = max(eintraege.filter(([, a]) => a.sterne.length >= 2), ([, a]) => a.sterne.reduce((x, y) => x + y, 0) / a.sterne.length);
  if (bester) {
    const schnitt = bester[1].sterne.reduce((x, y) => x + y, 0) / bester[1].sterne.length;
    rekorde.push({ titel: 'Bester Abend', wert: `${schnitt.toFixed(1).replace('.', ',')} ★`, wer: wo(bester[0]) });
  }
  return rekorde;
}
