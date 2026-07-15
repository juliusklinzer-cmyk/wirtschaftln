import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

/**
 * Mini-Migrations-Runner: wendet jede .sql-Datei aus drizzle/ genau einmal an
 * (Bookkeeping in wn_migrations). Die Skripte in scripts/ nutzen dieselbe Logik.
 */
function migrateDb() {
  const folder = path.join(process.cwd(), 'drizzle');
  if (!fs.existsSync(folder)) return;
  sqlite.exec('CREATE TABLE IF NOT EXISTS wn_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set(
    (sqlite.prepare('SELECT name FROM wn_migrations').all() as Array<{ name: string }>).map((r) => r.name),
  );
  for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(folder, file), 'utf8');
    const tx = sqlite.transaction(() => {
      for (const stmt of sql.split('--> statement-breakpoint')) {
        if (stmt.trim()) sqlite.exec(stmt);
      }
      sqlite.prepare('INSERT INTO wn_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    tx();
  }
}
migrateDb();

export const db = drizzle(sqlite, { schema });

export * from './schema';
