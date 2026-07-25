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
// Behalten: Admin + jede weitere E-Mail, die als Argument mitgegeben wird (z. B. Moritz).
const behaltenEmails = new Set<string>([adminEmail, ...process.argv.filter((a) => a.includes('@')).map((a) => a.toLowerCase())]);

if (!process.argv.includes('--ja-wirklich')) {
  console.error('ABBRUCH: Das löscht alle Test-Daten. Nochmal mit  --ja-wirklich  aufrufen.');
  console.error(`Behalten werden: ${[...behaltenEmails].join(', ')} + Altbestand-Wirtshäuser.`);
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
const alleMitglieder = db.prepare('SELECT id, name, email FROM members').all() as Array<{ id: string; name: string; email: string }>;
const behalten = alleMitglieder.filter((m) => behaltenEmails.has(m.email.toLowerCase()));
const behaltenIds = new Set(behalten.map((m) => m.id));
if (!behalten.some((m) => m.email.toLowerCase() === adminEmail)) {
  console.error(`ABBRUCH: Admin ${adminEmail} ned gfunden — nix gelöscht (Backup liegt trotzdem).`);
  process.exit(1);
}
const platzhalter = [...behaltenIds].map(() => '?').join(',');

const reset = db.transaction(() => {
  // Aktivität komplett leeren (koa Termine, koa Punkte, koa Kasse)
  for (const t of ['kasse', 'votes', 'besuche', 'wirtshaus_bewertungen', 'umfrage_stimmen', 'umfragen', 'aemter', 'termine']) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  // Sessions + Push-Abos nur von gelöschten Mitgliedern raus — die Behaltenen
  // bleiben eingeloggt und behalten ihr Push-Abo
  db.prepare(`DELETE FROM sessions WHERE member_id NOT IN (${platzhalter})`).run(...behaltenIds);
  db.prepare(`DELETE FROM push_subscriptions WHERE member_id NOT IN (${platzhalter})`).run(...behaltenIds);
  // Test-Wirtshäuser raus, die 49 Altbestand bleiben
  db.prepare('DELETE FROM wirtshaeuser WHERE altbestand IS NOT 1').run();
  db.prepare('UPDATE wirtshaeuser SET vorgeschlagen_von = NULL').run();
  // Alle Mitglieder außer den Behaltenen
  db.prepare(`DELETE FROM members WHERE id NOT IN (${platzhalter})`).run(...behaltenIds);
});
reset();

const zahl = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as { n: number }).n;
console.log('Reset fertig. Verbleibend:');
console.log(`  Mitglieder: ${zahl('members')} (${behalten.map((m) => m.name).join(', ')})`);
console.log(`  Wirtshäuser: ${zahl('wirtshaeuser')} (Altbestand)`);
console.log(`  Termine/Besuche/Votes/Kasse: ${zahl('termine')}/${zahl('besuche')}/${zahl('votes')}/${zahl('kasse')}`);
db.close();
console.log('→ Bereit für die echten Gründungsmitglieder. WhatsApp-Link kann raus.');
