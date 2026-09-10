import { eq } from 'drizzle-orm';
import { db, termine, wirtshaeuser } from '@/lib/db';
import { getCurrentMember, withSessionTenant } from '@/lib/session';

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

  const [h, m] = termin.zeit.split(':').map(Number);
  const start = `${termin.datum.replaceAll('-', '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const endeStunde = Math.min(23, h + 4);
  const end = `${termin.datum.replaceAll('-', '')}T${String(endeStunde).padStart(2, '0')}${String(m).padStart(2, '0')}00`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wirtschaftln//Stammtisch//DE',
    'BEGIN:VEVENT',
    `UID:${termin.id}@wirtschaftln.de`,
    `DTSTART;TZID=Europe/Berlin:${start}`,
    `DTEND;TZID=Europe/Berlin:${end}`,
    `SUMMARY:Stammtisch · ${wirtshaus?.name ?? 'Wirtschaftln'}`,
    wirtshaus?.adresse ? `LOCATION:${wirtshaus.adresse.replaceAll(',', '\\,')}` : null,
    'DESCRIPTION:Oiwei anders. Oiwei dahoam. 🍺',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="stammtisch-${termin.datum}.ics"`,
    },
  });
}
