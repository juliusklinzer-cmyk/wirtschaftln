import { currentTenant } from '@/lib/db';
import type { members } from '@/lib/db';
import { feedbackAnlegen } from '@/lib/db/directory';
import { gruenderAdminsBenachrichtigen } from '@/lib/gruendung';
import { newId } from '@/lib/ids';
import { anzeigeName } from '@/lib/namen';
import { feedbackAdresse, mailAn } from '@/lib/mail';
import { mailFeedback } from '@/lib/mail-vorlagen';
import { appUrl } from '@/lib/tenant-config';

/**
 * Feedback zur App aus einem neuen Stammtisch: landet im Verzeichnis, die
 * Wirtschaftln-Admins kriegen an Push, die Mail geht an feedbackAdresse(). Liefert eine Fehlermeldung oder null.
 */
export async function feedbackSchicken(me: typeof members.$inferSelect, roh: string): Promise<string | null> {
  const text = roh.trim().slice(0, 2000);
  if (text.length < 3) return 'Schreib bitte a bissl was rein.';
  const gruppe = currentTenant().gruppe;
  if (gruppe.istGruender) return 'Des Feedback is für die anderen Stammtische.';
  const name = anzeigeName(me);
  feedbackAnlegen({ id: newId('f'), gruppeId: gruppe.id, memberId: me.id, name, text });
  const kurz = text.length > 160 ? `${text.slice(0, 157)}…` : text;
  // Push an die Admins, die Mail geht an Julius persönlich (julius@wirtschaftln.de)
  const mail = mailFeedback({ stammtisch: 'Wirtschaftln', basisUrl: appUrl('/') }, { name, gruppe: gruppe.name, text });
  await Promise.allSettled([
    gruenderAdminsBenachrichtigen('💬 Neues Feedback', `${name} vom ${gruppe.name}: „${kurz}“`, `Feedback: ${gruppe.name}`, 'Alles im Verzeichnis', false),
    mailAn([feedbackAdresse()], mail.betreff, mail.inhalt),
  ]);
  return null;
}
