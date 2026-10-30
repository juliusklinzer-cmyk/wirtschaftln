import type { members } from '@/lib/db';
import type { MailRahmen } from '@/lib/mail-vorlagen';
import { appUrl, tenantConfig } from '@/lib/tenant-config';

/** Rahmen für die Mail-Vorlagen aus dem gebundenen Stammtisch. */
export function mailRahmen(): MailRahmen {
  return { stammtisch: tenantConfig().name, basisUrl: appUrl('/') };
}

/** Die drei Schalter im Profil („Mails“). */
export type MailArt = 'termin' | 'erinnerung' | 'kasse';

type Mitglied = typeof members.$inferSelect;

/** Will der Spezl Mails dieser Art? */
export function willMail(m: Mitglied, art: MailArt): boolean {
  return art === 'termin' ? m.mailTermin : art === 'erinnerung' ? m.mailErinnerung : m.mailKasse;
}

/** Adressen aller, die Mails dieser Art wollen. */
export function mailAdressen(mitglieder: Mitglied[], art: MailArt): string[] {
  return mitglieder.filter((m) => willMail(m, art)).map((m) => m.email);
}
