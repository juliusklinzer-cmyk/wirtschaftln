import { eq } from 'drizzle-orm';
import { db, termine, wirtshaeuser } from '@/lib/db';
import { getCurrentMember, withSessionTenant } from '@/lib/session';
import { appHost, tenantConfig } from '@/lib/tenant-config';
import { icsTermin } from '@/lib/mail-vorlagen';

/**
 * Kalender-Export: lädt den Stammtisch als .ics herunter.
 * Route-Handler: der Mandant kommt per withSessionTenant (AsyncLocalStorage)
 * aus dem Cookie — React-cache greift hier ned.
 */
export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withSessionTenant(() => ics(ctx.params));
}

async function ics(params: Promise<{ id: string }>) {
  const me = await getCurrentMember();
  if (!me) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const termin = db.select().from(termine).where(eq(termine.id, id)).get();
  if (!termin) return new Response('Not found', { status: 404 });

  const wirtshaus = termin.wirtshausId
    ? db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, termin.wirtshausId)).get()
    : null;

  const config = tenantConfig();
  const ics = icsTermin({
    uid: `${termin.id}@${appHost()}`,
    datum: termin.datum,
    zeit: termin.zeit,
    titel: `Stammtisch · ${wirtshaus?.name ?? config.name}`,
    ort: wirtshaus?.adresse ?? null,
    beschreibung: `${config.motto ? `${config.motto} ` : ''}🍺`,
  });

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="stammtisch-${termin.datum}.ics"`,
    },
  });
}
