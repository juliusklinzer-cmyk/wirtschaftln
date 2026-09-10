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

// Jedes Gründer-Mitglied kriegt genau EINEN Token, mit dem es genau EINEN
// neuen Stammtisch in d'Welt setzen derf (nicht viral).
export const gruendungsTokens = sqliteTable('gruendungs_tokens', {
  token: text('token').primaryKey(), // lesbar, z. B. WIRT-XXXX-XXXX
  memberId: text('member_id').notNull().unique(),
  status: text('status', { enum: ['offen', 'eingeloest'] }).notNull().default('offen'),
  eingeloestVonGruppeId: text('eingeloest_von_gruppe_id').references(() => gruppen.id),
  eingeloestAm: text('eingeloest_am'),
  createdAt: text('created_at').notNull(),
});

export type Gruppe = typeof gruppen.$inferSelect;
export type Konto = typeof konten.$inferSelect;
export type GruendungsToken = typeof gruendungsTokens.$inferSelect;
