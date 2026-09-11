import { createHash } from 'node:crypto';
import sharp from 'sharp';

/**
 * Stammtisch-Logo: kommt als Data-URL aus dem Logo-Wähler (eigenes Bild oder
 * Vorlage), wird hier auf 512×512 PNG normiert und als Data-URL in
 * gruppen.config.logo abgelegt. Ausgeliefert wird's über /logo/<slug>-<hash>.png
 * (Route-Handler, gecacht), damit AppBar, Manifest und App-Icon dieselbe
 * Datei nutzen.
 */
export const LOGO_GROESSE = 512;

export async function logoNormieren(dataUrl: string): Promise<string | null> {
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(dataUrl)) return null;
  if (dataUrl.length > 4 * 1024 * 1024) return null;
  try {
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    const png = await sharp(buf)
      .rotate()
      .resize(LOGO_GROESSE, LOGO_GROESSE, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Kurzer Hash fürs Cache-Busting in der Logo-URL. */
export function logoHash(dataUrl: string): string {
  return createHash('sha1').update(dataUrl).digest('hex').slice(0, 10);
}

export function logoUrlFuer(slug: string, dataUrl: string | null): string | null {
  return dataUrl ? `/logo/${slug}-${logoHash(dataUrl)}.png` : null;
}

/** Logo-Data-URL → PNG-Bytes in gewünschter Kantenlänge (für Manifest/App-Icon). */
export async function logoPng(dataUrl: string, groesse: number): Promise<Buffer> {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  const g = Math.max(32, Math.min(1024, Math.round(groesse)));
  return sharp(buf).resize(g, g, { fit: 'cover' }).png().toBuffer();
}
