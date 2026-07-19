// Altbestand-Import: die Wirtshäuser, die der Stammtisch VOR der App-Zeit
// (seit 2019) besucht hat — Julius' Google-Maps-Liste vom 17.07.2026.
// Landen als „Bsucht vor da App"-Pins auf der Karte, ohne Termin-/Besuchsdaten;
// Adresse, Koordinaten und Foto holt sich der Karten-Backfill über Google Places.
// Aufruf lokal: node scripts/altbestand.ts
// Aufruf Prod:  docker compose exec app node scripts/altbestand.ts
import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const NAMEN = [
  'Zum Sollner Hirschen',
  "Xaver's",
  'Großwirt',
  'Türkenhof',
  'Stragula Realwirtschaft',
  'Da Wirtshauser Robert Koch',
  'Augustiner Stammhaus',
  'Trumpf oder Kritisch',
  'Zur Festwiese',
  'Zur Schwalbe',
  'Georgenhof',
  'Augustiner Spieglwirt',
  'Augustiner am Dante',
  'InselMühle',
  'Neuhauser Augustiner',
  'Schweizer Hof',
  'Saletta Giesing',
  'Wirtshaus Tannengarten',
  'Servus Heidi',
  'Wirtshaus Augustiner Kurgarten',
  'Gasthaus Isarthor',
  'Wirtshaus Obacht Maxvorstadt',
  'Nürnberger Bratwurst Glöckl am Dom',
  'Gasthaus Weinbauer',
  'Augustiner Schützengarten',
  'Wirtshaus Hohenwart',
  'Das Bad',
  'Wirtshaus Zum lustigen Bauern',
  'Gaststätte Scheidegger',
  'Sappralott',
  'Alter Simpl',
  'Schelling-Salon',
  'Taxisgarten',
  'Wirtshaus in der Au',
  'Wirtshaus im Braunauer Hof am Isartor',
  'Augustiner Ewiges Licht',
  'Augustiner Drei Mühlen',
  'Rusticana',
  "Wirtshaus Valley's",
  'Sendlinger Augustiner',
  'Liebighof',
  'Augustiner-Keller',
  'Giesinger Garten',
  "S' Maillinger",
  'Giesinger Bräu - Wirtshaus & Schänke',
  'Gaststätte Jagdschlössl',
  'Lindwurmstüberl',
  'Haxengrill',
  'Wirtshaus Eder',
];

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Schema sicherstellen (gleiche Logik wie src/lib/db: wn_migrations-Bookkeeping).
sqlite.exec('CREATE TABLE IF NOT EXISTS wn_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
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

const vorhandene = new Set(
  (sqlite.prepare('SELECT name FROM wirtshaeuser').all() as Array<{ name: string }>).map((r) => r.name.trim().toLowerCase()),
);
const insert = sqlite.prepare(
  'INSERT INTO wirtshaeuser (id, name, biersorte, altbestand, created_at) VALUES (?, ?, ?, 1, ?)',
);

let neu = 0;
for (const name of NAMEN) {
  if (vorhandene.has(name.toLowerCase())) {
    // Existiert schon (z. B. aus echtem Termin) → nur als Altbestand markieren
    sqlite.prepare('UPDATE wirtshaeuser SET altbestand = 1 WHERE lower(name) = ?').run(name.toLowerCase());
    console.log(`schon da, als Altbestand markiert: ${name}`);
    continue;
  }
  insert.run(`w_${randomBytes(8).toString('hex')}`, name, 'Augustiner', new Date().toISOString());
  neu += 1;
}
console.log(`${neu} von ${NAMEN.length} Wirtshäusern neu angelegt. Koordinaten & Fotos holt die Karte beim ersten Öffnen automatisch.`);
