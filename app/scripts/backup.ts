// SQLite-Backup über die Online-Backup-API (WAL-sicher — niemals die DB-Dateien
// im laufenden Betrieb roh kopieren!). Sichert die Verzeichnis-DB und JEDEN
// Stammtisch (oder nur einen: --tenant <slug>). Läuft im Container:
//   docker compose exec app node scripts/backup.ts
// Legt Stände unter <data>/backups/<name>-<stempel>.db ab und behält pro
// Name die letzten 14 (der Gründer heißt weiter „wirtschaftln-…“, alte
// Backups von vor dem Mandanten-Umbau rotieren also nahtlos mit).
import path from 'node:path';
import fs from 'node:fs';
import { dataDir, directoryDbPath, ensureGruender, openDirectorySqlite, openSqlite, tenantDbPath } from '../src/lib/db/core.ts';
import { alleGruppen, tenantArg } from './_tenant.ts';

const BEHALTEN = 14;

const backupDir = path.join(dataDir(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

const directory = openDirectorySqlite();
ensureGruender(directory);
const nur = tenantArg();
const gruppen = alleGruppen(directory).filter((g) => !nur || g.id === nur);
if (nur && gruppen.length === 0) {
  console.error(`Unbekannter Stammtisch „${nur}“.`);
  process.exit(1);
}
directory.close();

const quellen: Array<{ name: string; datei: string }> = [
  ...(nur ? [] : [{ name: 'directory', datei: directoryDbPath() }]),
  ...gruppen.map((g) => ({ name: g.id, datei: tenantDbPath(g.id) })),
];

for (const q of quellen) {
  if (!fs.existsSync(q.datei)) {
    console.log(`${q.name}: keine DB-Datei (${q.datei}), übersprungen`);
    continue;
  }
  const ziel = path.join(backupDir, `${q.name}-${stempel}.db`);
  const db = openSqlite(q.datei, { readonly: true });
  await db.backup(ziel);
  db.close();
  console.log(`Backup geschrieben: ${ziel} (${Math.round(fs.statSync(ziel).size / 1024)} KB)`);

  // Rotation pro Name: älteste raus
  const alle = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(`${q.name}-`) && f.endsWith('.db') && !f.includes('vor-reset'))
    .sort();
  for (const alt of alle.slice(0, Math.max(0, alle.length - BEHALTEN))) {
    fs.unlinkSync(path.join(backupDir, alt));
    console.log(`Rotation: ${alt} gelöscht`);
  }
}
