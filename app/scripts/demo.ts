// Demo-Daten für die lokale Entwicklung (NICHT auf dem Server ausführen).
// Aufruf: npm run db:demo
import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'wirtschaftln.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Schema sicherstellen (gleiche Logik wie src/lib/db: wn_migrations-Bookkeeping).
sqlite.exec("CREATE TABLE IF NOT EXISTS wn_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
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

const anzahl = sqlite.prepare('SELECT COUNT(*) AS n FROM termine').get() as { n: number };
if (anzahl.n > 0) {
  console.log('Demo-Daten existieren schon — nichts zu tun.');
  process.exit(0);
}

const now = () => new Date().toISOString();
const id = (p: string) => `${p}_${randomBytes(8).toString('hex')}`;
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384 }).toString('hex');
  return `scrypt$16384$${salt}$${hash}`;
}

const insMember = sqlite.prepare(
  `INSERT INTO members (id, name, spitzname, email, password_hash, photo_url, role, status, created_at)
   VALUES (?, ?, ?, ?, ?, NULL, 'mitglied', 'aktiv', ?)`
);
const insWirtshaus = sqlite.prepare(
  `INSERT INTO wirtshaeuser (id, name, adresse, bezirk, lat, lng, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`
);
const insTermin = sqlite.prepare(
  `INSERT INTO termine (id, datum, zeit, phase, planer_id, wirtshaus_id, created_at) VALUES (?, ?, '19:00', ?, ?, ?, ?)`
);
const insVote = sqlite.prepare(`INSERT INTO votes (id, termin_id, member_id, wert, updated_at) VALUES (?, ?, ?, ?, ?)`);
const insBesuch = sqlite.prepare(
  `INSERT INTO besuche (id, termin_id, member_id, anwesend, hoiben, kaiserschmarrn, sterne, kommentar)
   VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`
);
const insKasse = sqlite.prepare(
  `INSERT INTO kasse (id, member_id, termin_id, grund, betrag_cents, kind, status, created_at)
   VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`
);
const insAmt = sqlite.prepare(`INSERT INTO aemter (id, titel, icon, member_id, saison) VALUES (?, ?, ?, ?, ?)`);

const DEMO = [
  { name: 'Sepp Brunner', spitzname: 'da Sepp' },
  { name: 'Resi Gruber', spitzname: "d'Resi" },
  { name: 'Hans Huber', spitzname: 'da Hansi' },
  { name: 'Toni Wimmer', spitzname: 'da Toni' },
  { name: 'Vroni Maier', spitzname: "d'Vroni" },
];
const ids: string[] = [];
for (const m of DEMO) {
  const mid = id('m');
  ids.push(mid);
  insMember.run(mid, m.name, m.spitzname, `${m.name.split(' ')[0].toLowerCase()}@demo.wirtschaftln.de`, hashPassword('servus123'), now());
}

// Zwei abgeschlossene Besuche
const vergangene = [
  { name: 'Wirtshaus in der Au', bezirk: 'Au-Haidhausen', adresse: 'Lilienstraße 51, 81669 München', lat: 48.1266, lng: 11.5883, datum: '2026-06-18' },
  { name: 'Augustiner-Keller', bezirk: 'Maxvorstadt', adresse: 'Arnulfstraße 52, 80335 München', lat: 48.1437, lng: 11.5502, datum: '2026-07-02' },
];
vergangene.forEach((w, wi) => {
  const wid = id('w');
  insWirtshaus.run(wid, w.name, w.adresse, w.bezirk, w.lat, w.lng, now());
  const tid = id('t');
  insTermin.run(tid, w.datum, 'abgeschlossen', ids[wi], wid, now());
  ids.forEach((mid, i) => {
    const anwesend = !(wi === 0 && i === 3) ? 1 : 0; // da Toni hat beim ersten g'schwänzt
    insBesuch.run(id('b'), tid, mid, anwesend, anwesend ? 2 + ((i + wi) % 4) : 0, anwesend && i % 2 === 0 ? 1 : 0, anwesend ? 3 + ((i + wi) % 3) : null);
  });
});

// Laufender Termin in Abstimmung
const wid = id('w');
insWirtshaus.run(wid, 'Wirtshaus am Hart', 'Sudetendeutsche Straße 40, 80937 München', 'Am Hart', 48.1963, 11.5869, now());
const tid = id('t');
insTermin.run(tid, '2026-07-23', 'reserviert', ids[1], wid, now());
(['zu', 'zu', 'vielleicht', 'ab', 'zu'] as const).forEach((wert, i) => {
  insVote.run(id('v'), tid, ids[i], wert, now());
});

// Kasse
insKasse.run(id('k'), ids[3], 'Zugesagt & nicht erschienen', -1000, 'strafe', 'offen', now());
insKasse.run(id('k'), ids[1], 'Strafe beglichen', 1000, 'einzahlung', 'beglichen', now());
insKasse.run(id('k'), ids[4], 'Runde geschmissen 🍻', 2400, 'runde', 'beglichen', now());

// Ämter
const jahr = String(new Date().getFullYear());
insAmt.run(id('a'), 'Bierwart', '🍺', ids[0], jahr);
insAmt.run(id('a'), 'Kassenwartin', '💰', ids[1], jahr);
insAmt.run(id('a'), 'Spätzünder', '🐌', ids[3], jahr);

console.log('Demo-Daten angelegt. Demo-Logins: sepp@demo.wirtschaftln.de usw. (Passwort: servus123)');
