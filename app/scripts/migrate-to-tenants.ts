// Umstieg auf „eine DB pro Stammtisch“ (idempotent, beliebig oft aufrufbar):
//  1. Verzeichnis-DB data/directory.db anlegen + migrieren
//  2. Gründer-Zeile (der eigene Stammtisch) eintragen, falls sie fehlt
//  3. alte data/wirtschaftln.db → data/tenants/wirtschaftln.db KOPIEREN
//     (WAL-Checkpoint + VACUUM INTO; das Original bleibt als Backup liegen)
//  4. konten (E-Mail → Stammtisch) aus den Mitgliedern ALLER Mandanten füllen
// Die App macht dasselbe beim ersten Öffnen automatisch — das Skript is für
// den bewussten Lauf mit Protokoll (lokal: npm run db:migrate,
// Prod: docker compose exec app node scripts/migrate-to-tenants.ts).
import fs from 'node:fs';
import {
  dataDir,
  directoryDbPath,
  ensureGruender,
  legacyDbPath,
  openDirectorySqlite,
  openTenantSqlite,
  syncKonten,
  tenantDbPath,
} from '../src/lib/db/core.ts';
import { alleGruppen } from './_tenant.ts';

console.log(`Datenverzeichnis: ${dataDir()}`);
const directory = openDirectorySqlite();
console.log(`Verzeichnis-DB:   ${directoryDbPath()}`);
const gruenderId = ensureGruender(directory, (z) => console.log(`  ${z}`));

for (const g of alleGruppen(directory)) {
  const mandant = openTenantSqlite(g.id);
  try {
    const neu = syncKonten(directory, mandant, g.id);
    const mitglieder = (mandant.prepare('SELECT COUNT(*) n FROM members').get() as { n: number }).n;
    console.log(`  ${g.ist_gruender ? '★' : '·'} ${g.name} (${g.id}): ${mitglieder} Mitglieder, ${tenantDbPath(g.id)}${neu ? `, ${neu} Konten nachgetragen` : ''}`);
  } finally {
    mandant.close();
  }
}

const konten = (directory.prepare('SELECT COUNT(*) n FROM konten').get() as { n: number }).n;
console.log(`Konten im Verzeichnis: ${konten}`);
if (fs.existsSync(legacyDbPath())) {
  console.log(`Alte Einzel-DB liegt weiter unter ${legacyDbPath()} (Backup, wird nimmer benutzt).`);
}
console.log(`Fertig. Gründer-Mandant: ${gruenderId}`);
