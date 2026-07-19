// Prod-Reset auf den Launch-Zustand: löscht ALLE Test-Daten (Termine, Besuche,
// Stimmen, Kasse, Umfragen, Ämter, Push-Abos, Test-Mitglieder, Test-Wirtshäuser).
// BEHALTEN werden: der Gründungs-Admin und die 49 Altbestand-Wirtshäuser (Chronik).
//
// Sicherheit: läuft nur mit  --ja-wirklich  und zieht vorher automatisch ein Backup.
//   docker compose exec app node scripts/reset-prod.ts --ja-wirklich
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
const adminEmail = (process.env.WN_ADMIN_EMAIL ?? 'julius.klinzer@gmail.com').toLowerCase();

if (!process.argv.includes('--ja-wirklich')) {
  console.error('ABBRUCH: Das löscht alle Test-Daten. Nochmal mit  --ja-wirklich  aufrufen.');
  console.error(`Behalten werden nur: Admin (${adminEmail}) + Altbestand-Wirtshäuser.`);
  process.exit(1);
}

// 1) Backup vorher (Online-Backup-API, WAL-sicher)
const backupDir = path.join(path.dirname(dbPath), 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const backup = path.join(backupDir, `wirtschaftln-vor-reset-${stempel}.db`);
{
  const ro = new Database(dbPath, { readonly: true });
  await ro.backup(backup);
  ro.close();
  console.log(`Backup vor dem Reset: ${backup} (${Math.round(fs.statSync(backup).size / 1024)} KB)`);
}

// 2) Reset
const db = new Database(dbPath);
const admin = db.prepare('SELECT id, name FROM members WHERE lower(email) = ?').get(adminEmail) as
  | { id: string; name: string }
  | undefined;
if (!admin) {
  console.error(`ABBRUCH: Admin ${adminEmail} ned gfunden — nix gelöscht (Backup liegt trotzdem).`);
  process.exit(1);
}

const reset = db.transaction(() => {
  // Aktivitäts-Tabellen komplett leeren
  for (const t of [
    'kasse',
    'votes',
    'besuche',
    'wirtshaus_bewertungen',
    'umfrage_stimmen',
    'umfragen',
    'aemter',
    'push_subscriptions',
    'sessions',
    'termine',
  ]) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  // Test-Wirtshäuser raus, die 49 Altbestand bleiben
  db.prepare('DELETE FROM wirtshaeuser WHERE altbestand IS NOT 1').run();
  // Vorschlags-Verweise auf gelöschte Mitglieder kappen (Altbestand hat eh koane)
  db.prepare('UPDATE wirtshaeuser SET vorgeschlagen_von = NULL').run();
  // Alle Mitglieder außer dem Gründungs-Admin
  db.prepare('DELETE FROM members WHERE id != ?').run(admin.id);
});
reset();

const zahl = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as { n: number }).n;
console.log('Reset fertig. Verbleibend:');
console.log(`  Mitglieder: ${zahl('members')} (nur ${admin.name})`);
console.log(`  Wirtshäuser: ${zahl('wirtshaeuser')} (Altbestand)`);
console.log(`  Termine/Besuche/Votes/Kasse: ${zahl('termine')}/${zahl('besuche')}/${zahl('votes')}/${zahl('kasse')}`);
db.close();
console.log('→ Bereit für die echten Gründungsmitglieder. WhatsApp-Link kann raus.');
