// Probe-Abend für die lokale Entwicklung: legt einen Test-Termin für HEUTE an,
// damit ma Check-in, Bierdeckel, „Mei Bewertung" und Abschluss durchklicken kann.
//
// Aufruf:  npm run db:probeabend            → Termin heute, Check-in offen, Abschluss no gsperrt
//          npm run db:probeabend abschluss  → Termin liegt 3 Std. zruck → Abschluss is offen
//          npm run db:probeabend weg        → räumt den Probe-Abend wieder weg
//          (--tenant <slug> für an anderen Stammtisch)
import { oeffneMandant } from './_tenant.ts';

// Harter Prod-Schutz wie in demo.ts — Testdaten haben auf der echten DB nix verloren.
if (process.env.NODE_ENV === 'production') {
  console.error('probe-abend.ts läuft NUR lokal.');
  process.exit(1);
}

const TERMIN_ID = 't_probeabend';
const WIRTSHAUS_ID = 'w_probeabend';

const { sqlite: db } = oeffneMandant();

const modus = process.argv[2] ?? 'an';

function wegraeumen() {
  db.prepare('DELETE FROM checkins WHERE termin_id = ?').run(TERMIN_ID);
  db.prepare('DELETE FROM besuche WHERE termin_id = ?').run(TERMIN_ID);
  db.prepare('DELETE FROM kasse WHERE termin_id = ?').run(TERMIN_ID);
  db.prepare('DELETE FROM termine WHERE id = ?').run(TERMIN_ID);
  db.prepare('DELETE FROM wirtshaeuser WHERE id = ?').run(WIRTSHAUS_ID);
}

if (modus === 'weg') {
  wegraeumen();
  console.log('Probe-Abend weggräumt.');
  process.exit(0);
}

// Heutiges Datum & Uhrzeit in Europe/Berlin (wie die App rechnet)
const jetzt = new Date();
const datum = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const berlinMinuten = (() => {
  const [h, m] = jetzt
    .toLocaleTimeString('sv-SE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' })
    .split(':')
    .map(Number);
  return h * 60 + m;
})();
// Standard: Termin „beginnt" in 1 Std. → Check-in scho offen (2 Std. Vorlauf),
// Abschluss no gsperrt (erst 3 Std. nach Beginn). Modus „abschluss": Beginn
// liegt 3 Std. zruck → Abschluss-Zettel is offen.
const beginnMinuten = Math.max(0, Math.min(23 * 60 + 59, modus === 'abschluss' ? berlinMinuten - 180 : berlinMinuten + 60));
const zeit = `${String(Math.floor(beginnMinuten / 60)).padStart(2, '0')}:${String(beginnMinuten % 60).padStart(2, '0')}`;

const planer = db.prepare("SELECT id FROM members WHERE status = 'aktiv' ORDER BY name LIMIT 1").get() as { id: string } | undefined;
if (!planer) {
  console.error('Keine Mitglieder in der DB — erst npm run db:demo laufen lassen.');
  process.exit(1);
}

wegraeumen(); // alter Probe-Abend weg, damit jeder Lauf frisch startet
const now = new Date().toISOString();
db.prepare(
  "INSERT INTO wirtshaeuser (id, name, adresse, bezirk, biersorte, altbestand, created_at) VALUES (?, 'TEST Probelauf-Stuben', 'Teststraße 1', 'Testviertel', 'Augustiner', 0, ?)",
).run(WIRTSHAUS_ID, now);
db.prepare(
  "INSERT INTO termine (id, datum, zeit, phase, planer_id, wirtshaus_id, created_at) VALUES (?, ?, ?, 'heute', ?, ?, ?)",
).run(TERMIN_ID, datum, zeit, planer.id, WIRTSHAUS_ID, now);

console.log(`Probe-Abend angelegt: heute (${datum}), Beginn ${zeit} Uhr, Phase „heute".`);
console.log(modus === 'abschluss'
  ? '→ Abschluss-Zettel is OFFEN (Beginn liegt 3 Std. zruck).'
  : '→ Check-in & Bewertung offen, Abschluss no gsperrt (kommt 3 Std. nach Beginn).');
console.log('Wegräumen: npm run db:probeabend weg');
