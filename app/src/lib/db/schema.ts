import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Beträge immer in Cent (Integer), Datumswerte als ISO-Strings (UTC).

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  /** Voller Name („Julius Klinzer"), Fallback; Anzeige läuft über lib/namen.ts. */
  name: text('name').notNull(),
  vorname: text('vorname'),
  nachname: text('nachname'),
  spitzname: text('spitzname'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  photoUrl: text('photo_url'), // Upload wird als Data-URL gespeichert (klein skaliert)
  role: text('role', { enum: ['admin', 'mitglied'] }).notNull().default('mitglied'),
  status: text('status', { enum: ['aktiv', 'antrag', 'inaktiv'] }).notNull().default('aktiv'),
  // Profil, alles was bayrisch und witzig is
  herkunft: text('herkunft'), // Stadtviertel/Herkunft
  lieblingsbier: text('lieblingsbier'),
  lieblingsweissbier: text('lieblingsweissbier'),
  leibspeise: text('leibspeise'),
  lieblingsbiergarten: text('lieblingsbiergarten'),
  lieblingswirtshaus: text('lieblingswirtshaus'),
  verein: text('verein', { enum: ['bayern', 'sechzig'] }),
  schafkopfer: integer('schafkopfer', { mode: 'boolean' }).notNull().default(false),
  beschreibung: text('beschreibung'),
  // true, bis der Spezl beim ersten Login Passwort gesetzt + Profil ausgefüllt hat
  erstanmeldung: integer('erstanmeldung', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
});

export const wirtshaeuser = sqliteTable('wirtshaeuser', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  adresse: text('adresse'),
  bezirk: text('bezirk'),
  lat: real('lat'),
  lng: real('lng'),
  photoUrl: text('photo_url'),
  biersorte: text('biersorte').notNull().default('Augustiner'), // Helles
  weissbier: text('weissbier'), // null = koa Weißbier ausg'schenkt
  telefon: text('telefon'),
  // Gesetzt, wenn ein Spezl das Wirtshaus über „Wirtshaus gfunden" vorgeschlagen hat.
  vorgeschlagenVon: text('vorgeschlagen_von').references(() => members.id),
  // „Vor der App"-Chronik: besucht seit 2019, aber ohne Termin-/Besuchsdaten.
  altbestand: integer('altbestand', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Freiwillige Nachbewertung (Altbestand oder Wiederbesuch ohne Stammtisch):
// eine pro Spezl & Wirtshaus, änderbar, bringt bewusst KEINE WP.
// Ziel: saubere Doku aller Münchner Wirtshäuser, wo is' gut, wo der beste
// Kaiserschmarrn, wo der beste Brodn.
export const wirtshausBewertungen = sqliteTable(
  'wirtshaus_bewertungen',
  {
    id: text('id').primaryKey(),
    wirtshausId: text('wirtshaus_id').notNull().references(() => wirtshaeuser.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    // Bewertungen mit einer Kommastelle (±-Stepper ab 3,0), wie beim Besuch-Abschluss.
    // SQLite-Affinität macht den Wechsel integer→real migrationsfrei.
    sterne: real('sterne').notNull(), // 1,0–5,0
    kaiserSterne: real('kaiser_sterne'), // 1,0–5,0, optional
    brodnSterne: real('brodn_sterne'), // 1,0–5,0, optional
    kommentar: text('kommentar'), // Freitext zum Wirtshaus
    kaiserNotiz: text('kaiser_notiz'), // Freitext zum Schmarrn → 🥞-Hinweis
    brodnNotiz: text('brodn_notiz'), // Freitext zum Brodn → 🍖-Hinweis
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('wirtshaus_bewertungen_wirtshaus_member').on(t.wirtshausId, t.memberId)],
);

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull(),
});

export const termine = sqliteTable('termine', {
  id: text('id').primaryKey(),
  datum: text('datum').notNull(), // ISO-Datum, z.B. 2026-07-23
  zeit: text('zeit').notNull().default('19:00'),
  phase: text('phase', { enum: ['planung', 'reserviert', 'heute', 'abgeschlossen'] })
    .notNull()
    .default('planung'),
  planerId: text('planer_id').references(() => members.id),
  wirtshausId: text('wirtshaus_id').references(() => wirtshaeuser.id),
  // Wer den Besuch abgeschlossen hat (gibt 1 WP; meiste Abschlüsse = Schriftführer).
  abgeschlossenVon: text('abgeschlossen_von').references(() => members.id),
  abgeschlossenAm: text('abgeschlossen_am'), // ab da läuft die 7-Tage-Nachtragsfrist
  createdAt: text('created_at').notNull(),
});

export const votes = sqliteTable(
  'votes',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    wert: text('wert', { enum: ['zu', 'vielleicht', 'ab'] }).notNull(),
    updatedAt: text('updated_at').notNull(),
    // Wann die ERSTE Stimme kam (wird bei Änderungen nie überschrieben) —
    // entscheidet über den „rechtzeitig abgstimmt"-Bonus (3-Tage-Frist).
    erstmalsAm: text('erstmals_am'),
  },
  (t) => [uniqueIndex('votes_termin_member').on(t.terminId, t.memberId)],
);

// Ein Eintrag pro Mitglied pro abgeschlossenem Besuch (Hoiben-Zählung etc.).
export const besuche = sqliteTable(
  'besuche',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    anwesend: integer('anwesend', { mode: 'boolean' }).notNull().default(true),
    hoiben: integer('hoiben').notNull().default(0),
    kaiserschmarrn: integer('kaiserschmarrn').notNull().default(0),
    schweinsbraten: integer('schweinsbraten').notNull().default(0),
    taxi: integer('taxi', { mode: 'boolean' }).notNull().default(false), // hat gfahrn & Spezln mitgnommen
    sterne: integer('sterne'), // 1–5, Bewertung des Wirtshauses
    kaiserSterne: integer('kaiser_sterne'), // 1–5, Kaiserschmarrn-Bewertung
    brodnSterne: integer('brodn_sterne'), // 1–5, Schweinsbraten-Bewertung
    kaiserNotiz: text('kaiser_notiz'),
    brodnNotiz: text('brodn_notiz'),
    kommentar: text('kommentar'),
  },
  (t) => [uniqueIndex('besuche_termin_member').on(t.terminId, t.memberId)],
);

// Wer scho im Wirtshaus sitzt, checkt ein: der Erste kriegt an WP, verrät im
// Freitext wo die Spezln hocken („hinten rechts, bei der Band") und alle
// anderen kriegen an Push. Einchecken geht ab 2 Stunden vor Termin-Beginn.
export const checkins = sqliteTable(
  'checkins',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    platz: text('platz'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('checkins_termin_member').on(t.terminId, t.memberId)],
);

export const kasse = sqliteTable('kasse', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  terminId: text('termin_id').references(() => termine.id),
  grund: text('grund').notNull(),
  betragCents: integer('betrag_cents').notNull(), // Forderung/Ausgabe negativ, Einzahlung positiv
  kind: text('kind', { enum: ['strafe', 'einzahlung', 'ausgabe', 'runde'] }).notNull(),
  status: text('status', { enum: ['offen', 'beglichen', 'aufgehoben'] }).notNull().default('offen'),
  // Wer den Eintrag angelegt/gemeldet hat, null = automatisch von der App (z. B. Abschluss-Strafen)
  gemeldetVon: text('gemeldet_von').references(() => members.id),
  createdAt: text('created_at').notNull(),
});

// Umfragen: jeder Spezl kann eine starten (Frage + beliebig viele Antworten).
// Antworten als JSON-Array, die Position im Array ist der antwortIndex der Stimmen.
export const umfragen = sqliteTable('umfragen', {
  id: text('id').primaryKey(),
  frage: text('frage').notNull(),
  antworten: text('antworten', { mode: 'json' }).$type<string[]>().notNull(),
  erstelltVon: text('erstellt_von').references(() => members.id),
  createdAt: text('created_at').notNull(),
});

export const umfrageStimmen = sqliteTable(
  'umfrage_stimmen',
  {
    id: text('id').primaryKey(),
    umfrageId: text('umfrage_id').notNull().references(() => umfragen.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    antwortIndex: integer('antwort_index').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('umfrage_stimmen_umfrage_member').on(t.umfrageId, t.memberId)],
);

export const aemter = sqliteTable('aemter', {
  id: text('id').primaryKey(),
  titel: text('titel').notNull(),
  icon: text('icon').notNull().default('🍺'),
  memberId: text('member_id').references(() => members.id),
  saison: text('saison').notNull(), // z.B. "2026"
});
