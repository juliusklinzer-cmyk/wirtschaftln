'use server';

import { revalidatePath } from 'next/cache';
import { db, members } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { newId, nowIso } from '@/lib/ids';

/** Admin legt ein neues Mitglied an (geschlossener Kreis — keine Selbstregistrierung). */
export async function mitgliedAnlegen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return;
  const name = String(formData.get('name') ?? '').trim();
  const spitzname = String(formData.get('spitzname') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!name || !email || password.length < 6) return;
  db.insert(members)
    .values({
      id: newId('m'),
      name,
      spitzname,
      email,
      passwordHash: hashPassword(password),
      role: 'mitglied',
      status: 'aktiv',
      createdAt: nowIso(),
    })
    .run();
  revalidatePath('/spezln');
}
