'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, kasse } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

function revalidate() {
  revalidatePath('/kasse');
  revalidatePath('/');
}

/** Wirtschaftler melden: Forderung (negativ) mit Status offen. */
export async function melden(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const memberId = String(formData.get('memberId') ?? '');
  const grund = String(formData.get('grund') ?? '').trim();
  const betrag = Math.abs(Number(String(formData.get('betrag') ?? '0').replace(',', '.')) || 0);
  if (!memberId || !grund || !betrag) return;
  db.insert(kasse)
    .values({
      id: newId('k'),
      memberId,
      grund,
      betragCents: -Math.round(betrag * 100),
      kind: 'strafe',
      status: 'offen',
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

export async function forderungStatus(id: string, status: 'offen' | 'beglichen' | 'aufgehoben') {
  const me = await getCurrentMember();
  if (!me) return;
  db.update(kasse).set({ status }).where(eq(kasse.id, id)).run();
  revalidate();
}

/** Einzahlung oder geschmissene Runde (positiv, sofort wirksam). */
export async function einzahlung(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
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
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}

/** Club-Ausgabe (negativ, senkt den Saldo sofort). */
export async function ausgabe(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
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
      createdAt: nowIso(),
    })
    .run();
  revalidate();
}
