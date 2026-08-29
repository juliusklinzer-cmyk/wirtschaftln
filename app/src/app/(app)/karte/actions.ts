'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, termine, wirtshaeuser, wirtshausBewertungen } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { getPraesidentId } from '@/lib/queries';
import { newId, nowIso } from '@/lib/ids';

/**
 * Offenen Vorschlag von der Karte nehmen, dürfen Admin, der aktuelle
 * Präsident und der Finder selbst. Nur solange das Wirtshaus wirklich offen
 * is (koa Termin, koa Altbestand). Mit der Zeile verschwindet auch der
 * Vorschlags-WP automatisch, weil der live aus `vorgeschlagenVon` grechnet wird.
 */
export async function wirtshausEntfernen(wirtshausId: string): Promise<{ ok: boolean; meldung?: string }> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, meldung: 'Ned angmeldt.' };
  const w = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get();
  if (!w) return { ok: false, meldung: 'Wirtshaus gibt’s nimmer.' };
  const darf = me.role === 'admin' || me.id === getPraesidentId() || (w.vorgeschlagenVon != null && w.vorgeschlagenVon === me.id);
  if (!darf) return { ok: false, meldung: 'Entfernen derf nur Admin, Präsident oder der Finder selbst.' };
  if (w.altbestand) return { ok: false, meldung: 'Chronik-Wirtshäuser bleiben stehen.' };
  const belegt = db.select().from(termine).where(eq(termine.wirtshausId, wirtshausId)).get();
  if (belegt) return { ok: false, meldung: 'Des Wirtshaus hängt scho an am Termin, do werd nix glöscht.' };
  db.delete(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).run();
  revalidatePath('/');
  revalidatePath('/termin');
  revalidatePath('/karte');
  revalidatePath('/spezln'); // WP des Finders ändert sich
  return { ok: true };
}

/**
 * Freiwillige Nachbewertung, für Altbestand-Wirtshäuser oder wenn wer ohne
 * Stammtisch nochmal dort war. Eine pro Spezl & Wirtshaus, jederzeit änderbar.
 * Bringt bewusst KEINE WP (sonst trägt wer Schmarrn ein und sammelt Punkte);
 * sie fließt nur in die Sterne-Statistik ein, nicht in Meister Eder.
 */
export async function nachbewerten(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const wirtshausId = String(formData.get('wirtshausId') ?? '');
  // Bewertungen mit einer Kommastelle (±-Stepper), gültig 1,0–5,0
  const wert = (feld: string) => {
    const v = Number(formData.get(feld));
    return Number.isFinite(v) && v >= 1 && v <= 5 ? Math.round(v * 10) / 10 : null;
  };
  const notiz = (feld: string) => String(formData.get(feld) ?? '').trim().slice(0, 500) || null;
  const sterne = wert('sterne');
  const kaiserSterne = wert('kaiserSterne'); // optional, leer/0 = ned bewertet
  const brodnSterne = wert('brodnSterne');
  const kommentar = notiz('kommentar');
  // Notizen gehören zur jeweiligen Wertung, ohne Sterne koa Notiz
  const kaiserNotiz = kaiserSterne != null ? notiz('kaiserNotiz') : null;
  const brodnNotiz = brodnSterne != null ? notiz('brodnNotiz') : null;
  if (sterne == null) return;
  if (!db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get()) return;
  db.insert(wirtshausBewertungen)
    .values({ id: newId('wb'), wirtshausId, memberId: me.id, sterne, kaiserSterne, brodnSterne, kommentar, kaiserNotiz, brodnNotiz, updatedAt: nowIso() })
    .onConflictDoUpdate({
      target: [wirtshausBewertungen.wirtshausId, wirtshausBewertungen.memberId],
      set: { sterne, kaiserSterne, brodnSterne, kommentar, kaiserNotiz, brodnNotiz, updatedAt: nowIso() },
    })
    .run();
  revalidatePath('/karte');
}
