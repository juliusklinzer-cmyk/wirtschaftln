// Altbestand-Import: die Wirtshäuser, die der Stammtisch VOR der App-Zeit
// (seit 2019) besucht hat — Julius' Google-Maps-Liste vom 17.07.2026.
// Landen als „Bsucht vor da App"-Pins auf der Karte, ohne Termin-/Besuchsdaten;
// Adresse, Koordinaten und Foto holt sich der Karten-Backfill über Google Places.
// Aufruf lokal: node scripts/altbestand.ts            (--tenant <slug> für an anderen Stammtisch)
// Aufruf Prod:  docker compose exec app node scripts/altbestand.ts
import { randomBytes } from 'node:crypto';
import { oeffneMandant } from './_tenant.ts';

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
  'Zum Tattenbach', // nachgetragen 03.08.2026 — hat in Julius' Liste gfehlt
];

// Mandant wählen (--tenant <slug>, Default: der eigene Stammtisch); Schema is
// nach oeffneMandant garantiert aktuell (Migrations-Runner im Kern).
const { sqlite } = oeffneMandant();

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
