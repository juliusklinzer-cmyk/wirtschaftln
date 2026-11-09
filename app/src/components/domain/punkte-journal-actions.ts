'use server';

import { getCurrentMember } from '@/lib/session';
import { getPunkteJournal, type JournalPosten } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';

/** Eigenes Punkte-Journal der laufenden Saison, fürs Fenster „Meine WP“. */
export async function ladePunkteJournal(): Promise<{ saison: string; posten: JournalPosten[] } | null> {
  const me = await getCurrentMember();
  if (!me) return null;
  const saison = aktuelleSaison();
  return { saison: saison.label, posten: getPunkteJournal(me.id, { abDatum: saison.start }) };
}
