// Zweiter (und dritter) Stammtisch für die lokale Entwicklung (NICHT auf dem Server):
// legt den „Probier-Stammtisch“ (Slug: probier) mit eigener DB an, damit ma
// Mandanten-Isolation, Login-Routing und die Gruppen-Auswahl testen kann.
//   npm run db:seed:tenant
// Logins (Passwort servus123):
//   resi@probier.wirtschaftln.de  → Admin vom Probier-Stammtisch
//   sepp@demo.wirtschaftln.de     → existiert NUR mit Demo-Daten auch beim Gründer
//                                   (npm run db:demo) → Login zeigt die Gruppen-Auswahl
import { randomBytes, scryptSync } from 'node:crypto';
import { openTenantSqlite, syncKonten, tenantDbPath } from '../src/lib/db/core.ts';
import { oeffneMandant } from './_tenant.ts';

if (process.env.NODE_ENV === 'production') {
  console.error('seed-tenant.ts läuft NUR lokal — echte Stammtische entstehen über den Gründungs-Wizard.');
  process.exit(1);
}

const SLUG = 'probier';
const CODE = 'PROBIER';

// Verzeichnis + Gründer-Bootstrap über den gewohnten Einstieg
const { directory } = oeffneMandant(null, () => {});

const now = () => new Date().toISOString();
const id = (p: string) => `${p}_${randomBytes(8).toString('hex')}`;
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384 }).toString('hex');
  return `scrypt$16384$${salt}$${hash}`;
}

if (!directory.prepare('SELECT 1 FROM gruppen WHERE id = ?').get(SLUG)) {
  directory
    .prepare(
      `INSERT INTO gruppen (id, name, motto, stadt, gruendungsjahr, typ, gruendungscode, ist_gruender, config, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'wandernd', ?, 0, '{}', 'aktiv', ?)`,
    )
    .run(SLUG, 'Probier-Stammtisch', 'Zum Probieren.', 'Nürnberg', 2024, CODE, now());
  console.log(`Stammtisch „Probier-Stammtisch“ (${SLUG}) angelegt, Gründungscode: ${CODE}`);
} else {
  console.log(`Stammtisch ${SLUG} existiert scho.`);
}

const sqlite = openTenantSqlite(SLUG);
const insMember = sqlite.prepare(
  `INSERT OR IGNORE INTO members (id, name, vorname, nachname, spitzname, email, password_hash, role, status, erstanmeldung, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktiv', 0, ?)`,
);
const leute = [
  { vorname: 'Resi', nachname: 'Probierer', spitzname: "d'Resi", email: 'resi@probier.wirtschaftln.de', role: 'admin' },
  { vorname: 'Sepp', nachname: 'Brunner', spitzname: 'da Sepp', email: 'sepp@demo.wirtschaftln.de', role: 'mitglied' },
];
let neu = 0;
for (const p of leute) {
  if (sqlite.prepare('SELECT 1 FROM members WHERE email = ?').get(p.email)) continue;
  insMember.run(id('m'), `${p.vorname} ${p.nachname}`, p.vorname, p.nachname, p.spitzname, p.email, hashPassword('servus123'), p.role, now());
  neu += 1;
}
const konten = syncKonten(directory, sqlite, SLUG);
console.log(`${neu} Mitglied(er) neu, ${konten} Konto/Konten im Verzeichnis, DB: ${tenantDbPath(SLUG)}`);
console.log('Login: resi@probier.wirtschaftln.de / servus123 — Beitritt mit Code PROBIER.');

// ── Dritter Mandant: Typ „stammhaus" (immer dasselbe Wirtshaus) ──
const SH = 'stammhaus';
const SH_WIRTSHAUS_ID = 'w_stammhaus';
if (!directory.prepare('SELECT 1 FROM gruppen WHERE id = ?').get(SH)) {
  directory
    .prepare(
      `INSERT INTO gruppen (id, name, motto, stadt, gruendungsjahr, typ, gruendungscode, ist_gruender, config, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'stammhaus', ?, 0, ?, 'aktiv', ?)`,
    )
    .run(SH, 'Hirschen-Stammtisch', 'Immer im Hirschen.', 'Regensburg', 2021, 'HIRSCHEN', JSON.stringify({ stammhausWirtshausId: SH_WIRTSHAUS_ID, hoibePreisCents: 390 }), now());
  console.log(`Stammtisch „Hirschen-Stammtisch“ (${SH}, Typ stammhaus) angelegt, Gründungscode: HIRSCHEN`);
}
const shDb = openTenantSqlite(SH);
if (!shDb.prepare('SELECT 1 FROM wirtshaeuser WHERE id = ?').get(SH_WIRTSHAUS_ID)) {
  shDb
    .prepare("INSERT INTO wirtshaeuser (id, name, adresse, bezirk, biersorte, altbestand, created_at) VALUES (?, 'Zum Goldenen Hirschen', 'Hirschengasse 1, 93047 Regensburg', 'Altstadt', 'Augustiner', 0, ?)")
    .run(SH_WIRTSHAUS_ID, now());
}
let shNeu = 0;
for (const p of [
  { vorname: 'Wastl', nachname: 'Wirt', spitzname: 'da Wastl', email: 'wastl@stammhaus.wirtschaftln.de', role: 'admin' },
  { vorname: 'Lena', nachname: 'Stammgast', spitzname: "d'Lena", email: 'lena@stammhaus.wirtschaftln.de', role: 'mitglied' },
]) {
  if (shDb.prepare('SELECT 1 FROM members WHERE email = ?').get(p.email)) continue;
  shDb
    .prepare(
      `INSERT INTO members (id, name, vorname, nachname, spitzname, email, password_hash, role, status, erstanmeldung, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktiv', 0, ?)`,
    )
    .run(id('m'), `${p.vorname} ${p.nachname}`, p.vorname, p.nachname, p.spitzname, p.email, hashPassword('servus123'), p.role, now());
  shNeu += 1;
}
const shKonten = syncKonten(directory, shDb, SH);
console.log(`Stammhaus: ${shNeu} Mitglied(er) neu, ${shKonten} Konto/Konten, DB: ${tenantDbPath(SH)}`);
console.log('Login: wastl@stammhaus.wirtschaftln.de / servus123 — Beitritt mit Code HIRSCHEN.');
