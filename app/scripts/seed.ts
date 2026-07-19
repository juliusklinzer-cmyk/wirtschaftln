// Erst-Setup: legt den Admin an (idempotent).
// Aufruf:  npm run db:seed  (Passwort via WN_ADMIN_PASSWORD, sonst generiert)
import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Schema sicherstellen (gleiche Logik wie src/lib/db: wn_migrations-Bookkeeping).
sqlite.exec("CREATE TABLE IF NOT EXISTS wn_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
{
  const folder = path.join(process.cwd(), 'drizzle');
  const applied = new Set((sqlite.prepare('SELECT name FROM wn_migrations').all() as Array<{ name: string }>).map((r) => r.name));
  for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(folder, file), 'utf8');
    for (const stmt of sql.split('--> statement-breakpoint')) {
      if (stmt.trim()) sqlite.exec(stmt);
    }
    sqlite.prepare('INSERT INTO wn_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
  }
}

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
  console.log(`Admin angelegt: ${email}`);
  if (!process.env.WN_ADMIN_PASSWORD) {
    console.log(`Generiertes Passwort: ${password}`);
    console.log('→ Bitte nach dem ersten Login ändern.');
  }
}
