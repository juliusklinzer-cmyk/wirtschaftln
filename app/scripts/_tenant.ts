// Gemeinsamer Einstieg für alle Skripte: welcher Stammtisch?
//   node scripts/<skript>.ts --tenant <slug>     (oder WN_TENANT=<slug>)
// Ohne Angabe: der Gründer-Mandant (der eigene Stammtisch) — so laufen die
// gewohnten Aufrufe (npm run db:demo usw.) unverändert weiter.
// Importiert den Mandanten-Kern direkt aus src (Node führt .ts ohne Build aus).
import type Database from 'better-sqlite3';
import {
  ensureGruender,
  istGueltigerSlug,
  openDirectorySqlite,
  openTenantSqlite,
  type GruppeRow,
} from '../src/lib/db/core.ts';

export function tenantArg(argv = process.argv): string | null {
  const i = argv.indexOf('--tenant');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  const mitGleich = argv.find((a) => a.startsWith('--tenant='));
  if (mitGleich) return mitGleich.slice('--tenant='.length);
  return process.env.WN_TENANT || null;
}

export type Mandant = {
  id: string;
  gruppe: GruppeRow;
  /** Mandanten-DB (migriert) */
  sqlite: Database.Database;
  /** Verzeichnis-DB (migriert, Gründer-Bootstrap gelaufen) */
  directory: Database.Database;
};

export function alleGruppen(directory: Database.Database): GruppeRow[] {
  return directory.prepare('SELECT * FROM gruppen ORDER BY ist_gruender DESC, id').all() as GruppeRow[];
}

/** Verzeichnis öffnen (inkl. Gründer-Bootstrap) und den gewünschten Mandanten binden. */
export function oeffneMandant(slug: string | null = tenantArg(), log: (z: string) => void = (z) => console.log(`[verzeichnis] ${z}`)): Mandant {
  const directory = openDirectorySqlite();
  const gruenderId = ensureGruender(directory, log);
  const id = slug ?? gruenderId;
  if (!istGueltigerSlug(id)) {
    console.error(`Ungültiger Mandanten-Slug: ${JSON.stringify(id)} (erlaubt: a-z, 0-9, Bindestrich)`);
    process.exit(1);
  }
  const gruppe = directory.prepare('SELECT * FROM gruppen WHERE id = ?').get(id) as GruppeRow | undefined;
  if (!gruppe) {
    const bekannt = alleGruppen(directory).map((g) => g.id).join(', ');
    console.error(`Unbekannter Stammtisch „${id}“ — bekannt: ${bekannt}`);
    process.exit(1);
  }
  const sqlite = openTenantSqlite(id);
  console.log(`→ Mandant: ${gruppe.name} (${id})`);
  return { id, gruppe, sqlite, directory };
}
