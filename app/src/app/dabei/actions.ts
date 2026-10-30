'use server';

import { wackelAntwort } from '@/lib/wackler';

export type DabeiState = { fertig?: 'dabei' | 'abschied'; error?: string };

/** Antwort von der Seite aus der Wackler-Mail (ohne Login, der Token is der Ausweis). */
export async function dabeiAntworten(_prev: DabeiState, formData: FormData): Promise<DabeiState> {
  const token = String(formData.get('token') ?? '');
  const antwort = formData.get('antwort') === 'abschied' ? 'abschied' : 'dabei';
  const r = await wackelAntwort(token, antwort);
  if (r === 'ungueltig') return { error: 'Dieser Link ist nicht mehr gültig.' };
  if (r === 'schon') return { error: 'Das ist schon erledigt.' };
  return { fertig: antwort };
}
