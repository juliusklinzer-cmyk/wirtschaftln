// Erst-Setup: legt den Admin an (idempotent).
// Aufruf:  npm run db:seed  (Passwort via WN_ADMIN_PASSWORD, sonst generiert)
//          node scripts/seed.ts --tenant <slug>  für einen anderen Stammtisch
import { randomBytes, scryptSync } from 'node:crypto';
import { syncKonten } from '../src/lib/db/core.ts';
import { oeffneMandant } from './_tenant.ts';

// Mandant wählen (--tenant <slug>, Default: der eigene Stammtisch); Schema is
// nach oeffneMandant garantiert aktuell (Migrations-Runner im Kern).
const { sqlite, id: gruppeId, directory } = oeffneMandant();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384 }).toString('hex');
  return `scrypt$16384$${salt}$${hash}`;
}

const email = process.env.WN_ADMIN_EMAIL ?? 'julius.klinzer@gmail.com';
const name = process.env.WN_ADMIN_NAME ?? 'Julius Klinzer';
// Anzeige läuft über „Da <Nachname> <Vorname>" — Name am ersten Leerzeichen teilen
const [vorname, ...rest] = name.split(' ');
const nachname = rest.join(' ') || null;

const existing = sqlite.prepare('SELECT id FROM members WHERE email = ?').get(email);
if (existing) {
  console.log(`Admin ${email} existiert bereits — nichts zu tun.`);
} else {
  const password = process.env.WN_ADMIN_PASSWORD ?? randomBytes(6).toString('base64url');
  sqlite
    .prepare(
      `INSERT INTO members (id, name, vorname, nachname, spitzname, email, password_hash, photo_url, role, status, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'admin', 'aktiv', ?)`
    )
    .run(`m_${randomBytes(8).toString('hex')}`, name, vorname, nachname, email, hashPassword(password), new Date().toISOString());
  syncKonten(directory, sqlite, gruppeId);
  console.log(`Admin angelegt: ${email}`);
  if (!process.env.WN_ADMIN_PASSWORD) {
    console.log(`Generiertes Passwort: ${password}`);
    console.log('→ Bitte nach dem ersten Login ändern.');
  }
}
