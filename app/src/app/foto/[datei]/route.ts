import { eq } from 'drizzle-orm';
import { db, fotos } from '@/lib/db';
import { getCurrentMember, withSessionTenant } from '@/lib/session';

/**
 * Foto-Auslieferung: /foto/<id>-<hash>.jpg (Mitglied oder Wirtshaus, Daten in
 * der Tabelle `fotos`). Nur mit gültiger Session (die <img>-Anfragen der App
 * bringen den Cookie mit), dafür a Jahr lang privat cachebar: der Hash im
 * Namen wechselt, sobald a neues Bild hochgeladen wird.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ datei: string }> }) {
  const { datei } = await ctx.params;
  const m = /^([a-z]_[0-9a-f]{16})-[0-9a-f]{6,16}\.jpg$/.exec(datei);
  if (!m) return new Response('Not found', { status: 404 });
  return withSessionTenant(async () => {
    const me = await getCurrentMember();
    if (!me) return new Response('Unauthorized', { status: 401 });
    const row = db.select().from(fotos).where(eq(fotos.id, m[1])).get();
    if (!row) return new Response('Not found', { status: 404 });
    const kopf = /^data:([a-z]+\/[a-z0-9.+-]+);base64,/i.exec(row.data);
    if (!kopf) return new Response('Not found', { status: 404 });
    const bild = Buffer.from(row.data.slice(kopf[0].length), 'base64');
    return new Response(new Uint8Array(bild), {
      headers: {
        'Content-Type': kopf[1],
        'Content-Length': String(bild.length),
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  });
}
