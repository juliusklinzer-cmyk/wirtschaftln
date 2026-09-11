import { findGruppe } from '@/lib/db/directory';
import { istGueltigerSlug } from '@/lib/db/core';
import { logoHash, logoPng } from '@/lib/logo';

/**
 * Stammtisch-Logo als PNG: /logo/<slug>-<hash>.png?s=192
 * Öffentlich (Manifest/App-Icon brauchen's ohne Login), der Hash im Namen
 * macht die Antwort dauerhaft cachebar — a neues Logo kriegt a neue URL.
 */
export async function GET(req: Request, ctx: { params: Promise<{ datei: string }> }) {
  const { datei } = await ctx.params;
  const m = /^([a-z0-9][a-z0-9-]{1,39})-([0-9a-f]{10})\.png$/.exec(datei);
  if (!m || !istGueltigerSlug(m[1])) return new Response('Not found', { status: 404 });
  const gruppe = findGruppe(m[1]);
  if (!gruppe) return new Response('Not found', { status: 404 });
  let logo: string | null = null;
  try {
    const c = JSON.parse(gruppe.config) as { logo?: unknown };
    logo = typeof c.logo === 'string' ? c.logo : null;
  } catch {
    logo = null;
  }
  if (!logo || logoHash(logo) !== m[2]) return new Response('Not found', { status: 404 });
  const s = Number(new URL(req.url).searchParams.get('s') ?? 512);
  const png = await logoPng(logo, Number.isFinite(s) ? s : 512);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
