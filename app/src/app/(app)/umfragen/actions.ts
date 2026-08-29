'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, umfragen, umfrageStimmen } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

const MAX_ANTWORTEN = 6;

/** Jeder Spezl darf auf Hoam eine Umfrage starten (Frage + mind. 2 Antworten). */
export async function umfrageStarten(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const frage = String(formData.get('frage') ?? '').trim().slice(0, 200);
  const antworten = formData
    .getAll('antwort')
    .map((a) => String(a).trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, MAX_ANTWORTEN);
  if (!frage || antworten.length < 2) return;
  db.insert(umfragen)
    .values({ id: newId('u'), frage, antworten, erstelltVon: me.id, createdAt: nowIso() })
    .run();
  revalidatePath('/');
}

/** Abstimmen bzw. Stimme ändern, eine Stimme pro Spezl und Umfrage. */
export async function umfrageAbstimmen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const umfrageId = String(formData.get('umfrageId') ?? '');
  const antwortIndex = Number(formData.get('antwortIndex'));
  const umfrage = db.select().from(umfragen).where(eq(umfragen.id, umfrageId)).get();
  if (!umfrage || !Number.isInteger(antwortIndex) || antwortIndex < 0 || antwortIndex >= umfrage.antworten.length) return;
  db.insert(umfrageStimmen)
    .values({ id: newId('us'), umfrageId, memberId: me.id, antwortIndex, updatedAt: nowIso() })
    .onConflictDoUpdate({
      target: [umfrageStimmen.umfrageId, umfrageStimmen.memberId],
      set: { antwortIndex, updatedAt: nowIso() },
    })
    .run();
  revalidatePath('/');
}

/** Löschen darf nur, wer die Umfrage gestartet hat, oder der Admin. */
export async function umfrageLoeschen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const umfrageId = String(formData.get('umfrageId') ?? '');
  const umfrage = db.select().from(umfragen).where(eq(umfragen.id, umfrageId)).get();
  if (!umfrage) return;
  if (umfrage.erstelltVon !== me.id && me.role !== 'admin') return;
  db.delete(umfragen).where(eq(umfragen.id, umfrageId)).run();
  revalidatePath('/');
}
