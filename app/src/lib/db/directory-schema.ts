import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// Zentrale Verzeichnis-DB (data/directory.db): welche Stammtische gibt's,
// welche E-Mail gehört wohin, welche Gründungs-Tokens sind unterwegs.
// Alles Fachliche (Mitglieder, Termine, Kasse …) liegt pro Stammtisch in
// data/tenants/<id>.db — siehe schema.ts.

export const gruppen = sqliteTable(
  'gruppen',
  {
    /** Slug, gleichzeitig Dateiname der Mandanten-DB — siehe SLUG_RE in core.ts */
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    motto: text('motto'),
    stadt: text('stadt'),
    gruendungsjahr: integer('gruendungsjahr'),
    /** wandernd = jedes Mal a anders Wirtshaus; stammhaus = immer dasselbe */
    typ: text('typ', { enum: ['wandernd', 'stammhaus'] }).notNull().default('wandernd'),
    /** Aufnahme-Code für /beitreten; null = Aufnahme zu */
    gruendungscode: text('gruendungscode'),
    /** Der eigene Stammtisch: Feature-Flags (Dani-Modus, Augustiner, München-Badges …) */
    istGruender: integer('ist_gruender', { mode: 'boolean' }).notNull().default(false),
    /** Tenant-Config als JSON (fehlende Keys → Gründer-Defaults, siehe tenant-config.ts) */
    config: text('config').notNull().default('{}'),
    status: text('status', { enum: ['aktiv', 'gesperrt'] }).notNull().default('aktiv'),
    /** Wann gesperrt (Verzeichnis), null = nie / wieder entsperrt */
    gesperrtAm: text('gesperrt_am'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('gruppen_gruendungscode').on(t.gruendungscode)],
);

// Login-Routing: dieselbe E-Mail derf in mehreren Stammtischen existieren.
export const konten = sqliteTable(
  'konten',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    gruppeId: text('gruppe_id').notNull().references(() => gruppen.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('konten_email_gruppe').on(t.email, t.gruppeId), index('konten_email').on(t.email)],
);

// Gründungs-Token = Ehren-Einladung (Token-Verzeichnis-Redesign 14.10.2026):
// Jeder Token gehört einem Stammtisch (gruppe_id). Beim Gründer kriegt jedes
// Mitglied genau einen (quelle 'mitglied'), der Gründer-Admin beliebig viele
// ('admin'). Jeder andere Stammtisch bekommt nach 2 und 6 Monaten je einen
// ('anspruch') und kann weitere anfragen ('anfrage'). Vor dem Teilen wird der
// Token gewidmet („Sepp aus Regensburg“); member_id = wer ihn hält bzw. gewidmet hat.
export const gruendungsTokens = sqliteTable(
  'gruendungs_tokens',
  {
  token: text('token').primaryKey(), // lesbar, z. B. WIRT-XXXX-XXXX
  memberId: text('member_id').notNull(),
  gruppeId: text('gruppe_id').references(() => gruppen.id),
  quelle: text('quelle', { enum: ['mitglied', 'admin', 'anspruch', 'anfrage'] }).notNull().default('mitglied'),
  widmung: text('widmung'),
  gewidmetAm: text('gewidmet_am'),
  status: text('status', { enum: ['offen', 'eingeloest'] }).notNull().default('offen'),
  eingeloestVonGruppeId: text('eingeloest_von_gruppe_id').references(() => gruppen.id),
  eingeloestAm: text('eingeloest_am'),
  createdAt: text('created_at').notNull(),
  },
  (t) => [index('gruendungs_tokens_member_id').on(t.memberId), index('gruendungs_tokens_gruppe_id').on(t.gruppeId), index('gruendungs_tokens_eingeloest_von').on(t.eingeloestVonGruppeId)],
);

// Token-Anfragen: ein Stammtisch-Admin bittet um einen weiteren Token (mit
// Grund), die Wirtschaftln-Admins geben frei (dann wird der Token gemünzt) oder lehnen ab.
export const tokenAnfragen = sqliteTable(
  'token_anfragen',
  {
    id: text('id').primaryKey(),
    gruppeId: text('gruppe_id').notNull().references(() => gruppen.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    grund: text('grund').notNull(),
    status: text('status', { enum: ['offen', 'freigegeben', 'abgelehnt'] }).notNull().default('offen'),
    entschiedenVonMemberId: text('entschieden_von_member_id'),
    entschiedenAm: text('entschieden_am'),
    token: text('token').references(() => gruendungsTokens.token),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('token_anfragen_gruppe_status').on(t.gruppeId, t.status)],
);

export type Gruppe = typeof gruppen.$inferSelect;
export type Konto = typeof konten.$inferSelect;
export type GruendungsToken = typeof gruendungsTokens.$inferSelect;
export type TokenAnfrage = typeof tokenAnfragen.$inferSelect;
export type TokenQuelle = GruendungsToken['quelle'];

// „Passwort vergessen“: Link-Token per Mail, eine Stunde gültig, ein Token je
// Konto (E-Mail + Stammtisch). Wird beim Setzen des neuen Passworts gelöscht.
export const passwortTokens = sqliteTable(
  'passwort_tokens',
  {
    token: text('token').primaryKey(),
    email: text('email').notNull(),
    gruppeId: text('gruppe_id').notNull(),
    memberId: text('member_id').notNull(),
    /** ISO-Zeitpunkt, bis wann der Link gilt */
    bis: text('bis').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('passwort_tokens_email').on(t.email)],
);

export type PasswortToken = typeof passwortTokens.$inferSelect;
