// Mandanten-Kern ohne Abhängigkeiten ins restliche Projekt: Pfade, SQLite
// öffnen, Migrations-Runner, Gründer-Bootstrap. Wird von der App (index.ts,
// directory.ts) UND von den Skripten (scripts/_tenant.ts, per .ts-Import
// direkt in Node) benutzt — deshalb hier keine `@/`-Aliasse und kein React.
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/** Slug des eigenen Stammtischs (Gründer-Mandant). */
export const GRUENDER_ID = 'wirtschaftln';

/**
 * Erlaubte Mandanten-Slugs. Der Slug landet im Dateipfad — deshalb streng:
 * Kleinbuchstaben, Ziffern, Bindestrich, 2–40 Zeichen. Alles andere fliegt,
 * BEVOR irgendwas den Pfad anfasst (Path-Traversal-Schutz).
 */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;

export function istGueltigerSlug(id: unknown): id is string {
  return typeof id === 'string' && SLUG_RE.test(id);
}

/**
 * Datenverzeichnis: DATA_DIR, sonst der Ordner der alten DATABASE_PATH
 * (Docker setzt /data/wirtschaftln.db → /data), sonst ./data.
 */
export function dataDir(): string {
  // turbopackIgnore: Laufzeit-Pfade aus der Env, nix zum Mit-Tracen
  if (process.env.DATA_DIR) return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR);
  if (process.env.DATABASE_PATH) return path.dirname(path.resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH));
  return path.join(process.cwd(), 'data');
}

/** Die alte Einzel-DB von vor dem Mandanten-Umbau (bleibt als Backup liegen). */
export function legacyDbPath(): string {
  return process.env.DATABASE_PATH ? path.resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH) : path.join(dataDir(), 'wirtschaftln.db');
}

export function directoryDbPath(): string {
  return path.join(dataDir(), 'directory.db');
}

export function tenantsDir(): string {
  return path.join(dataDir(), 'tenants');
}

export function tenantDbPath(id: string): string {
  if (!istGueltigerSlug(id)) throw new Error(`Ungültiger Mandanten-Slug: ${JSON.stringify(id)}`);
  return path.join(tenantsDir(), `${id}.db`);
}

export function migrationsFolder(name: 'drizzle' | 'drizzle-directory'): string {
  // Zwei statische Pfade statt path.join(cwd, variable) — sonst traced der
  // Turbopack-Build das ganze Projekt als Abhängigkeit (NFT-Warnung).
  return name === 'drizzle' ? path.join(process.cwd(), 'drizzle') : path.join(process.cwd(), 'drizzle-directory');
}

export function openSqlite(file: string, opts: Database.Options = {}): Database.Database {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file, opts);
  if (!opts.readonly) {
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
  }
  return sqlite;
}

/**
 * Mini-Migrations-Runner: wendet jede .sql-Datei aus dem Ordner genau einmal
 * an (Bookkeeping in wn_migrations). Gilt für Mandanten-DBs (drizzle/) und
 * die Verzeichnis-DB (drizzle-directory/).
 */
export function runMigrations(sqlite: Database.Database, folder: string): string[] {
  if (!fs.existsSync(folder)) return [];
  sqlite.exec('CREATE TABLE IF NOT EXISTS wn_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set(
    (sqlite.prepare('SELECT name FROM wn_migrations').all() as Array<{ name: string }>).map((r) => r.name),
  );
  const neu: string[] = [];
  for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(folder, file), 'utf8');
    const tx = sqlite.transaction(() => {
      for (const stmt of sql.split('--> statement-breakpoint')) {
        if (stmt.trim()) sqlite.exec(stmt);
      }
      // OR IGNORE: öffnen mehrere Prozesse dieselbe DB gleichzeitig und wenden
      // dieselbe (idempotente) Migration an, derf die Buchführung ned am
      // Unique-Konflikt sterben.
      sqlite.prepare('INSERT OR IGNORE INTO wn_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    tx();
    neu.push(file);
  }
  return neu;
}

/** Verzeichnis-DB öffnen (legt sie bei Bedarf an) und migrieren. */
export function openDirectorySqlite(): Database.Database {
  const sqlite = openSqlite(directoryDbPath());
  runMigrations(sqlite, migrationsFolder('drizzle-directory'));
  return sqlite;
}

/** Mandanten-DB öffnen (legt sie bei Bedarf an) und migrieren. */
export function openTenantSqlite(id: string): Database.Database {
  const sqlite = openSqlite(tenantDbPath(id));
  runMigrations(sqlite, migrationsFolder('drizzle'));
  return sqlite;
}

export type GruppeRow = {
  id: string;
  name: string;
  motto: string | null;
  stadt: string | null;
  gruendungsjahr: number | null;
  typ: 'wandernd' | 'stammhaus';
  gruendungscode: string | null;
  ist_gruender: number;
  config: string;
  status: 'aktiv' | 'gesperrt';
  created_at: string;
};

/**
 * Gründungscode des eigenen Stammtischs beim Bootstrap: aus der Env, lokal
 * (alles außer production — Skripte laufen ohne NODE_ENV) der bekannte
 * Default, auf Prod null = Aufnahme zu (fail-closed wie bisher).
 */
function gruenderCodeAusEnv(): string | null {
  const env = process.env.WN_GRUENDUNGSCODE;
  if (env !== undefined) return env.trim() || null;
  return process.env.NODE_ENV === 'production' ? null : '1328';
}

/**
 * Gründer-Bootstrap (idempotent, wird beim ersten Öffnen der Verzeichnis-DB
 * und vom Skript migrate-to-tenants.ts aufgerufen):
 *  1. Gründer-Zeile in `gruppen` anlegen, falls sie fehlt
 *  2. alte Einzel-DB nach tenants/<id>.db KOPIEREN (VACUUM INTO = WAL-sicher,
 *     synchron; das Original bleibt als Backup unangetastet)
 *  3. `konten` aus den Mitgliedern des Mandanten auffüllen
 * Gibt die Gründer-ID zurück; `log` kriegt eine Zeile pro Schritt.
 */
export function ensureGruender(dir: Database.Database, log: (zeile: string) => void = () => {}): string {
  let gruender = dir.prepare('SELECT * FROM gruppen WHERE ist_gruender = 1').get() as GruppeRow | undefined;
  if (!gruender) {
    dir
      .prepare(
        `INSERT INTO gruppen (id, name, motto, stadt, gruendungsjahr, typ, gruendungscode, ist_gruender, config, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'wandernd', ?, 1, '{}', 'aktiv', ?)`,
      )
      .run(GRUENDER_ID, 'Wirtschaftln', 'Oiwei anders. Oiwei dahoam.', 'München', 2019, gruenderCodeAusEnv(), new Date().toISOString());
    gruender = dir.prepare('SELECT * FROM gruppen WHERE id = ?').get(GRUENDER_ID) as GruppeRow;
    log(`Gründer-Mandant „${gruender.name}“ (${gruender.id}) im Verzeichnis angelegt.`);
  }

  const ziel = tenantDbPath(gruender.id);
  const legacy = legacyDbPath();
  if (!fs.existsSync(ziel) && fs.existsSync(legacy)) {
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    const alt = openSqlite(legacy);
    try {
      alt.pragma('wal_checkpoint(TRUNCATE)');
      alt.exec(`VACUUM INTO '${ziel.replaceAll("'", "''")}'`);
    } finally {
      alt.close();
    }
    log(`Alte DB ${legacy} → ${ziel} kopiert (Original bleibt als Backup liegen).`);
  }

  const mandant = openTenantSqlite(gruender.id);
  try {
    const neu = syncKonten(dir, mandant, gruender.id);
    if (neu > 0) log(`${neu} Konto/Konten im Verzeichnis nachgetragen.`);
  } finally {
    mandant.close();
  }
  return gruender.id;
}

/**
 * `konten` (E-Mail → Gruppe + Mitglied) aus der Mitgliederliste eines
 * Mandanten auffüllen. Idempotent, gibt die Zahl neuer Zeilen zurück.
 */
export function syncKonten(dir: Database.Database, mandant: Database.Database, gruppeId: string): number {
  const members = mandant.prepare('SELECT id, email FROM members').all() as Array<{ id: string; email: string }>;
  const ins = dir.prepare(
    'INSERT OR IGNORE INTO konten (id, email, gruppe_id, member_id, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  let neu = 0;
  const tx = dir.transaction(() => {
    for (const m of members) {
      const r = ins.run(`k_${m.id}_${gruppeId}`, m.email.toLowerCase(), gruppeId, m.id, new Date().toISOString());
      neu += r.changes;
    }
  });
  tx();
  return neu;
}
