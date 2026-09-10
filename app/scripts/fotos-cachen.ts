// Bestehende Wirtshaus-Fotos (Google-URLs) einmalig herunterladen, verkleinern
// und als Data-URL in die DB legen — danach laden die Bilder zuverlässig,
// egal was Google mit seinen PhotoService-URLs treibt.
// Aufruf lokal:  node scripts/fotos-cachen.ts
// Aufruf Prod:   docker compose exec app node scripts/fotos-cachen.ts
import sharp from 'sharp';
import { oeffneMandant } from './_tenant.ts';

const { sqlite: db } = oeffneMandant();

async function alsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const roh = Buffer.from(await res.arrayBuffer());
    if (roh.length === 0 || roh.length > 15 * 1024 * 1024) return null;
    const klein = await sharp(roh).rotate().resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
    return `data:image/jpeg;base64,${klein.toString('base64')}`;
  } catch {
    return null;
  }
}

const rows = db
  .prepare("SELECT id, name, photo_url FROM wirtshaeuser WHERE photo_url LIKE 'http%'")
  .all() as Array<{ id: string; name: string; photo_url: string }>;

if (rows.length === 0) {
  console.log('Nix zu tun — alle Fotos liegen scho als Data-URL in der DB.');
  process.exit(0);
}

console.log(`${rows.length} Wirtshaus-Foto(s) mit http-URL gfunden — hole & cache…`);
let ok = 0;
for (const r of rows) {
  const dataUrl = await alsDataUrl(r.photo_url);
  if (dataUrl) {
    db.prepare('UPDATE wirtshaeuser SET photo_url = ? WHERE id = ?').run(dataUrl, r.id);
    ok += 1;
    console.log(`  ✓ ${r.name}`);
  } else {
    // URL is scho tot (typisch: abgelaufene googleapis-Links) → raus damit,
    // die Karte holt sich beim nächsten Öffnen über Places a frisches Foto.
    db.prepare('UPDATE wirtshaeuser SET photo_url = NULL WHERE id = ?').run(r.id);
    console.log(`  ✗ ${r.name} — URL lädt nimmer, gelöscht (Karte holt a neues)`);
  }
}
console.log(`Fertig: ${ok}/${rows.length} gecacht.`);
