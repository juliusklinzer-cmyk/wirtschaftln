import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Beträge immer in Cent (Integer), Datumswerte als ISO-Strings (UTC).

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  spitzname: text('spitzname'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  photoUrl: text('photo_url'),
  role: text('role', { enum: ['admin', 'mitglied'] }).notNull().default('mitglied'),
  status: text('status', { enum: ['aktiv', 'antrag', 'inaktiv'] }).notNull().default('aktiv'),
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
    sterne: integer('sterne'), // 1–5, Bewertung des Wirtshauses
    kommentar: text('kommentar'),
  },
  (t) => [uniqueIndex('besuche_termin_member').on(t.terminId, t.memberId)],
);

export const kasse = sqliteTable('kasse', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  terminId: text('termin_id').references(() => termine.id),
  grund: text('grund').notNull(),
  betragCents: integer('betrag_cents').notNull(), // Forderung/Ausgabe negativ, Einzahlung positiv
  kind: text('kind', { enum: ['strafe', 'einzahlung', 'ausgabe', 'runde'] }).notNull(),
  status: text('status', { enum: ['offen', 'beglichen', 'aufgehoben'] }).notNull().default('offen'),
  createdAt: text('created_at').notNull(),
});

export const aemter = sqliteTable('aemter', {
  id: text('id').primaryKey(),
  titel: text('titel').notNull(),
  icon: text('icon').notNull().default('🍺'),
  memberId: text('member_id').references(() => members.id),
  saison: text('saison').notNull(), // z.B. "2026"
});
