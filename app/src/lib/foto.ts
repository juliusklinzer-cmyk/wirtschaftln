import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { db, fotos } from '@/lib/db';

/**
 * Wirtshaus-Foto von einer (Google-)URL holen und als kleine Data-URL
 * zurückgeben, einmal gespeichert, lädt's für immer zuverlässig aus der DB,
 * statt bei jedem Seitenaufruf von Google-Servern abzuhängen (deren
 * PhotoService-URLs gern ablaufen oder zicken). Gleiche Idee wie bei den
 * Profilbildern. Scheitert leise mit null, dann bleibt die URL wie sie is.
 */
export async function fotoAlsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const roh = Buffer.from(await res.arrayBuffer());
    if (roh.length === 0 || roh.length > 15 * 1024 * 1024) return null;
    const klein = await sharp(roh)
      .rotate() // EXIF-Orientierung anwenden
      .resize({ width: 900, withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    return `data:image/jpeg;base64,${klein.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Data-URL in der Tabelle `fotos` ablegen (Schlüssel = Mitglieds-/Wirtshaus-ID)
 * und die URL zurückgeben, die in members/wirtshaeuser.photoUrl kommt. Der
 * Hash im Namen macht die Antwort dauerhaft cachebar, a neues Bild = neue URL.
 * Vorher lagen die Data-URLs direkt in den Zeilen, das hat jede Seite um
 * hunderte KB aufgeblasen (Rang, Karte), Julius 14.10.2026.
 */
export function fotoAblegen(id: string, dataUrl: string): string {
  const hash = createHash('sha1').update(dataUrl).digest('hex').slice(0, 10);
  db.insert(fotos).values({ id, data: dataUrl }).onConflictDoUpdate({ target: fotos.id, set: { data: dataUrl } }).run();
  return `/foto/${id}-${hash}.jpg`;
}
