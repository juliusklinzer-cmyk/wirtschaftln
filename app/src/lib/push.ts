import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db, pushSubscriptions } from '@/lib/db';
import { tenantConfig } from '@/lib/tenant-config';

/**
 * Web-Push über VAPID (Schlüssel in .env.local / Server-Env).
 * Abgelaufene Subscriptions (410/404) werden beim Senden aufgeräumt.
 */
function konfiguriert(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:servus@wirtschaftln.de', pub, priv);
  return true;
}

async function senden(subs: Array<typeof pushSubscriptions.$inferSelect>, titel: string, text: string, url: string) {
  // Icon pro Stammtisch: Münchner Kindl nur mit München-Branding (Gründer)
  const icon = tenantConfig().features.muenchenBranding ? '/brand/kindl-256.png' : '/brand/shield-256.png';
  const payload = JSON.stringify({ title: titel, body: text, url, icon });
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint)).run();
        }
      }
    }),
  );
}

export async function pushAnAlle(titel: string, text: string, url = '/'): Promise<void> {
  if (!konfiguriert()) {
    console.log(`[push übersprungen, keine VAPID-Keys] ${titel}`);
    return;
  }
  await senden(db.select().from(pushSubscriptions).all(), titel, text, url);
}

/** Push nur an bestimmte Spezln (alle Geräte des Mitglieds). */
export async function pushAn(memberIds: string[], titel: string, text: string, url = '/'): Promise<void> {
  if (memberIds.length === 0 || !konfiguriert()) return;
  const subs = db.select().from(pushSubscriptions).all().filter((s) => memberIds.includes(s.memberId));
  await senden(subs, titel, text, url);
}
