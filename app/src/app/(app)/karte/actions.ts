'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, wirtshaeuser, wirtshausBewertungen } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

/**
 * Freiwillige Nachbewertung — für Altbestand-Wirtshäuser oder wenn wer ohne
 * Stammtisch nochmal dort war. Eine pro Spezl & Wirtshaus, jederzeit änderbar.
 * Bringt bewusst KEINE WP (sonst trägt wer Schmarrn ein und sammelt Punkte);
 * sie fließt nur in die Sterne-Statistik ein — nicht in Meister Eder.
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
  const kaiserSterne = wert('kaiserSterne'); // optional — leer/0 = ned bewertet
  const brodnSterne = wert('brodnSterne');
  const kommentar = notiz('kommentar');
  // Notizen gehören zur jeweiligen Wertung — ohne Sterne koa Notiz
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
