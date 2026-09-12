// Test-Daten für einen NICHT-Gründer-Stammtisch (z. B. „Die Kichererbsen"):
// 10 Mitglieder mit Historie (Termine, Besuche mit Hoibe + Schnaps, Stimmen,
// Kasse), Schnaps-Feature an, Stammhaus mit Adresse/Koordinaten, und ein
// Termin HEUTE im Stammhaus (Phase „heute“, Bierdeckel offen).
//   node scripts/demo-stammtisch.ts --tenant die-kichererbsen --ja-wirklich
// Logins danach (Passwort servus123):
//   admin@<slug>.test   → Admin
//   spezl@<slug>.test   → normales Mitglied
// Läuft NICHT auf dem Gründer-Mandanten und nur mit --ja-wirklich.
import { randomBytes, scryptSync } from 'node:crypto';
import { syncKonten } from '../src/lib/db/core.ts';
import { oeffneMandant } from './_tenant.ts';

const { sqlite: db, id: slug, gruppe, directory } = oeffneMandant();
if (gruppe.ist_gruender) {
  console.error('ABBRUCH: demo-stammtisch.ts läuft ned auf dem Gründer-Stammtisch.');
  process.exit(1);
}
if (!process.argv.includes('--ja-wirklich')) {
  console.error(`ABBRUCH: legt Testdaten in „${gruppe.name}“ an. Nochmal mit --ja-wirklich.`);
  process.exit(1);
}

// Deterministischer Zufall, damit der Lauf reproduzierbar is
let seed = 4711;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const zwischen = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const now = () => new Date().toISOString();
const id = (p: string) => `${p}_${randomBytes(8).toString('hex')}`;
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384 }).toString('hex');
  return `scrypt$16384$${salt}$${hash}`;
}

// ── Stammhaus: Görreshof mit echten Daten ───────────────────────────────────
const config = JSON.parse(gruppe.config || '{}') as Record<string, unknown>;
let stammhausId = typeof config.stammhausWirtshausId === 'string' ? config.stammhausWirtshausId : null;
const goerreshof = {
  name: 'Görreshof',
  adresse: 'Görresstraße 38, 80798 München',
  bezirk: 'Maxvorstadt',
  lat: 48.156155,
  lng: 11.5620609,
  telefon: '089 20209550',
  biersorte: 'Augustiner – Lagerbier Hell',
  weissbier: 'Franziskaner – Hefe-Weissbier',
};
if (stammhausId && db.prepare('SELECT 1 FROM wirtshaeuser WHERE id = ?').get(stammhausId)) {
  db.prepare('UPDATE wirtshaeuser SET name=?, adresse=?, bezirk=?, lat=?, lng=?, telefon=?, biersorte=?, weissbier=? WHERE id=?')
    .run(goerreshof.name, goerreshof.adresse, goerreshof.bezirk, goerreshof.lat, goerreshof.lng, goerreshof.telefon, goerreshof.biersorte, goerreshof.weissbier, stammhausId);
} else {
  stammhausId = id('w');
  db.prepare('INSERT INTO wirtshaeuser (id, name, adresse, bezirk, lat, lng, telefon, biersorte, weissbier, altbestand, created_at) VALUES (?,?,?,?,?,?,?,?,?,0,?)')
    .run(stammhausId, goerreshof.name, goerreshof.adresse, goerreshof.bezirk, goerreshof.lat, goerreshof.lng, goerreshof.telefon, goerreshof.biersorte, goerreshof.weissbier, now());
}
// Config: Schnaps an, Stammhaus gesetzt
const features = (config.features && typeof config.features === 'object' ? config.features : {}) as Record<string, unknown>;
features.schnaps = true;
config.features = features;
config.stammhausWirtshausId = stammhausId;
directory.prepare('UPDATE gruppen SET config = ? WHERE id = ?').run(JSON.stringify(config), slug);
console.log(`Stammhaus „${goerreshof.name}“ gesetzt, Schnaps an.`);

// ── 10 Mitglieder ───────────────────────────────────────────────────────────
const LEUTE: Array<{ vorname: string; nachname: string; spitzname: string; email: string; role: 'admin' | 'mitglied'; herkunft: string; verein: string | null }> = [
  { vorname: 'Kathi', nachname: 'Obermeier', spitzname: "d'Kathi", email: `admin@${slug}.test`, role: 'admin', herkunft: 'Haidhausen', verein: 'FC Bayern' },
  { vorname: 'Basti', nachname: 'Reiter', spitzname: 'da Basti', email: `spezl@${slug}.test`, role: 'mitglied', herkunft: 'Sendling', verein: 'TSV 1860' },
  { vorname: 'Franzi', nachname: 'Huber', spitzname: "d'Franzi", email: `franzi@${slug}.test`, role: 'mitglied', herkunft: 'Neuhausen', verein: null },
  { vorname: 'Lukas', nachname: 'Brandl', spitzname: 'da Luggi', email: `luggi@${slug}.test`, role: 'mitglied', herkunft: 'Giesing', verein: 'TSV 1860' },
  { vorname: 'Vroni', nachname: 'Kastner', spitzname: "d'Vroni", email: `vroni@${slug}.test`, role: 'mitglied', herkunft: 'Schwabing', verein: 'FC Bayern' },
  { vorname: 'Max', nachname: 'Eder', spitzname: 'da Maxl', email: `maxl@${slug}.test`, role: 'mitglied', herkunft: 'Pasing', verein: null },
  { vorname: 'Lena', nachname: 'Wimmer', spitzname: "d'Lena", email: `lena@${slug}.test`, role: 'mitglied', herkunft: 'Au', verein: 'FC Bayern' },
  { vorname: 'Simon', nachname: 'Gruber', spitzname: 'da Simi', email: `simi@${slug}.test`, role: 'mitglied', herkunft: 'Laim', verein: null },
  { vorname: 'Anna', nachname: 'Stadler', spitzname: "d'Anna", email: `anna@${slug}.test`, role: 'mitglied', herkunft: 'Bogenhausen', verein: 'TSV 1860' },
  { vorname: 'Flo', nachname: 'Hinterberger', spitzname: 'da Flo', email: `flo@${slug}.test`, role: 'mitglied', herkunft: 'Moosach', verein: null },
];
const insMember = db.prepare(
  `INSERT INTO members (id, name, vorname, nachname, spitzname, email, password_hash, role, status, erstanmeldung, herkunft, verein, lieblingsbier, schafkopfer, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktiv', 0, ?, ?, ?, ?, ?)`,
);
const ids: string[] = [];
const beitritt = new Date(Date.now() - 150 * 864e5).toISOString();
let neu = 0;
for (const p of LEUTE) {
  const vorhanden = db.prepare('SELECT id FROM members WHERE email = ?').get(p.email) as { id: string } | undefined;
  if (vorhanden) {
    ids.push(vorhanden.id);
    continue;
  }
  const mid = id('m');
  insMember.run(mid, `${p.vorname} ${p.nachname}`, p.vorname, p.nachname, p.spitzname, p.email, hashPassword('servus123'), p.role, p.herkunft, p.verein, rnd() < 0.5 ? 'Augustiner – Lagerbier Hell' : 'Tegernseer – Hell', rnd() < 0.4 ? 1 : 0, beitritt);
  ids.push(mid);
  neu += 1;
}
console.log(`${neu} Mitglieder neu (${LEUTE.length} gesamt).`);

// ── Historie: 8 Abende alle 14 Tage, alle im Stammhaus ─────────────────────
const insTermin = db.prepare(
  `INSERT INTO termine (id, datum, zeit, phase, planer_id, wirtshaus_id, abgeschlossen_von, abgeschlossen_am, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insVote = db.prepare(`INSERT INTO votes (id, termin_id, member_id, wert, updated_at, erstmals_am) VALUES (?, ?, ?, ?, ?, ?)`);
const insBesuch = db.prepare(
  `INSERT INTO besuche (id, termin_id, member_id, anwesend, hoiben, schnaps, kaiserschmarrn, schweinsbraten, taxi, sterne, kaiser_sterne, brodn_sterne, kommentar)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insKasse = db.prepare(
  `INSERT INTO kasse (id, member_id, termin_id, grund, betrag_cents, kind, status, gemeldet_von, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const KOMMENTARE = ['Brodn war a Wucht.', 'Bedienung a bisserl langsam, Bier top.', 'Wia immer dahoam.', 'Schmarrn hat gfehlt, sonst passt.', 'Kellner hat uns durchgfüttert.', null, null];
const hoibeCents = Number(config.hoibePreisCents) || 370;

const heute = new Date();
const berlinDatum = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const schonTermine = (db.prepare('SELECT COUNT(*) n FROM termine').get() as { n: number }).n;
if (schonTermine > 0) {
  console.log(`Historie übersprungen: es gibt scho ${schonTermine} Termine.`);
} else {
  for (let k = 8; k >= 1; k -= 1) {
    const d = new Date(heute.getTime() - k * 14 * 864e5);
    const datum = berlinDatum(d);
    const tid = id('t');
    const planer = ids[(k * 3) % ids.length];
    const abschliesser = ids[(k * 5 + 1) % ids.length];
    insTermin.run(tid, datum, '19:00', 'abgeschlossen', planer, stammhausId, abschliesser, `${datum}T21:30:00.000Z`, `${datum}T08:00:00.000Z`);
    const taxler = ids[zwischen(0, ids.length - 1)];
    let rundeGeschmissen = false;
    ids.forEach((mid, i) => {
      const dabei = rnd() < 0.72;
      const zugesagt = dabei || rnd() < 0.15; // ab und zu: zugesagt, aber ned kommen → Strafe
      insVote.run(id('v'), tid, mid, zugesagt ? 'zu' : 'ab', `${datum}T10:00:00.000Z`, `${datum}T10:00:00.000Z`);
      if (dabei) {
        const hoiben = zwischen(1, 6);
        const schnaps = rnd() < 0.55 ? zwischen(1, 3) : 0;
        const brodn = rnd() < 0.35 ? 1 : 0;
        const kaisi = rnd() < 0.25 ? 1 : 0;
        insBesuch.run(id('b'), tid, mid, 1, hoiben, schnaps, kaisi, brodn, mid === taxler ? 1 : 0, zwischen(3, 5), kaisi ? zwischen(3, 5) : null, brodn ? zwischen(3, 5) : null, KOMMENTARE[(i + k) % KOMMENTARE.length]);
        if (!rundeGeschmissen && rnd() < 0.3) {
          rundeGeschmissen = true;
          insKasse.run(id('k'), mid, tid, `Runde gschmissen im ${goerreshof.name} 🍻`, 7 * hoibeCents, 'runde', 'beglichen', null, `${datum}T21:40:00.000Z`);
        }
      } else {
        insBesuch.run(id('b'), tid, mid, 0, 0, 0, 0, 0, 0, null, null, null, null);
        if (zugesagt) {
          const beglichen = rnd() < 0.6;
          insKasse.run(id('k'), mid, tid, `Zugesagt & nicht erschienen: Runde für die Spezln (7 × ${(hoibeCents / 100).toFixed(2).replace('.', ',')} €) im ${goerreshof.name}`, -7 * hoibeCents, 'strafe', beglichen ? 'beglichen' : 'offen', null, `${datum}T21:40:00.000Z`);
        }
      }
    });
  }
  // A paar Kasse-Bewegungen außerhalb der Abende
  insKasse.run(id('k'), ids[1], null, '💝 5 Hoibe gspendt, Geburtstag', 5 * hoibeCents, 'einzahlung', 'beglichen', ids[1], new Date(heute.getTime() - 20 * 864e5).toISOString());
  insKasse.run(id('k'), ids[4], null, 'Gschnapselt ohne Grund, des kost 2 Hoibe 🍺', -2 * hoibeCents, 'strafe', 'offen', ids[0], new Date(heute.getTime() - 9 * 864e5).toISOString());
  console.log('8 abgeschlossene Abende mit Besuchen, Stimmen und Kasse angelegt.');

  // ── Heute: Termin im Stammhaus, Phase „heute“, Bierdeckel offen ──────────
  const datumHeute = berlinDatum(heute);
  const tid = id('t');
  insTermin.run(tid, datumHeute, '18:00', 'heute', ids[2], stammhausId, null, null, `${datumHeute}T08:00:00.000Z`);
  ids.forEach((mid, i) => {
    const wert = i === 7 || i === 9 ? 'ab' : 'zu';
    insVote.run(id('v'), tid, mid, wert, `${datumHeute}T09:00:00.000Z`, `${datumHeute}T09:00:00.000Z`);
  });
  // Zwoa san scho am Stricheln
  insBesuch.run(id('b'), tid, ids[1], 1, 2, 1, 0, 0, 0, null, null, null, null);
  insBesuch.run(id('b'), tid, ids[3], 1, 1, 0, 0, 0, 0, null, null, null, null);
  console.log(`Termin heute (${datumHeute}, 18:00) im ${goerreshof.name} angelegt, 8 Zusagen, 2 Absagen.`);
}

const konten = syncKonten(directory, db, slug);
console.log(`${konten} Konto/Konten im Verzeichnis nachgetragen.`);
console.log(`Logins (Passwort servus123): admin@${slug}.test (Admin) · spezl@${slug}.test (Mitglied)`);
