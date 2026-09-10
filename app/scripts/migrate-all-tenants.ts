// Schema-Migrationen für ALLE Stammtische sofort ausführen (statt lazy beim
// ersten Öffnen im laufenden Betrieb). Nach jedem Deploy mit neuer Migration:
//   docker compose exec app node scripts/migrate-all-tenants.ts
import { ensureGruender, migrationsFolder, openDirectorySqlite, openSqlite, runMigrations, tenantDbPath } from '../src/lib/db/core.ts';
import { alleGruppen } from './_tenant.ts';

const directory = openDirectorySqlite(); // migriert die Verzeichnis-DB
ensureGruender(directory, (z) => console.log(`[verzeichnis] ${z}`));

for (const g of alleGruppen(directory)) {
  const sqlite = openSqlite(tenantDbPath(g.id));
  try {
    const neu = runMigrations(sqlite, migrationsFolder('drizzle'));
    console.log(`${g.name} (${g.id}): ${neu.length ? neu.join(', ') : 'nix Neues'}`);
  } finally {
    sqlite.close();
  }
}
console.log('Alle Mandanten migriert.');
