// SQLite-Backup über die Online-Backup-API (WAL-sicher — niemals die DB-Datei
// im laufenden Betrieb roh kopieren!). Läuft im Container:
//   docker compose exec app node scripts/backup.ts
// Legt Stände unter <data>/backups/ ab und behält die letzten 14.
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const BEHALTEN = 14;

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
const backupDir = path.join(path.dirname(dbPath), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const ziel = path.join(backupDir, `wirtschaftln-${stempel}.db`);

const db = new Database(dbPath, { readonly: true });
await db.backup(ziel);
db.close();
console.log(`Backup geschrieben: ${ziel} (${Math.round(fs.statSync(ziel).size / 1024)} KB)`);

// Rotation: älteste raus
const alle = fs
  .readdirSync(backupDir)
  .filter((f) => f.startsWith('wirtschaftln-') && f.endsWith('.db'))
  .sort();
for (const alt of alle.slice(0, Math.max(0, alle.length - BEHALTEN))) {
  fs.unlinkSync(path.join(backupDir, alt));
  console.log(`Rotation: ${alt} gelöscht`);
}
