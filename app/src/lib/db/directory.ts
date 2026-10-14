import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, desc, eq } from 'drizzle-orm';
import type Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import * as dirSchema from './directory-schema';
import { gruppen, konten, gruendungsTokens, passwortTokens, tokenAnfragen, type Gruppe, type Konto, type GruendungsToken, type PasswortToken, type TokenAnfrage, type TokenQuelle } from './directory-schema';
import { ensureGruender, openDirectorySqlite } from './core';

/**
 * Zentrale Verzeichnis-DB: Stammtische, Konten (Login-Routing), Tokens.
 * Wird LAZY geöffnet — `next build` fasst so keine DB-Datei an. Beim ersten
 * Öffnen läuft der Gründer-Bootstrap (idempotent, siehe core.ts).
 */
type DirectoryHandle = {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof dirSchema>;
  gruenderId: string;
};

let handle: DirectoryHandle | null = null;

export function getDirectory(): DirectoryHandle {
  if (handle) return handle;
  const sqlite = openDirectorySqlite();
  const gruenderId = ensureGruender(sqlite, (zeile) => console.log(`[verzeichnis] ${zeile}`));
  handle = { sqlite, db: drizzle(sqlite, { schema: dirSchema }), gruenderId };
  return handle;
}

/** Slug des eigenen Stammtischs (Ziel für Legacy-Cookies ohne Präfix). */
export function gruenderGruppeId(): string {
  return getDirectory().gruenderId;
}

export function findGruppe(id: string): Gruppe | null {
  return getDirectory().db.select().from(gruppen).where(eq(gruppen.id, id)).get() ?? null;
}

export function findGruppeByCode(code: string): Gruppe | null {
  if (!code) return null;
  return getDirectory().db.select().from(gruppen).where(eq(gruppen.gruendungscode, code)).get() ?? null;
}

export function slugFrei(id: string): boolean {
  return !findGruppe(id);
}

export function codeFrei(code: string, ausserGruppeId?: string): boolean {
  const g = findGruppeByCode(code);
  return !g || g.id === ausserGruppeId;
}

/** Neuen Stammtisch eintragen (Gründungs-Wizard). */
export function gruppeAnlegen(zeile: typeof gruppen.$inferInsert): void {
  getDirectory().db.insert(gruppen).values(zeile).run();
}

/* ── Gründungs-Tokens: genau einer pro Gründer-Mitglied, genau einmal einlösbar ── */

export function tokenFuerMitglied(memberId: string): GruendungsToken | null {
  return tokensFuerMitglied(memberId)[0] ?? null;
}

/** Alle Tokens eines Mitglieds, älteste zuerst (Admin derf mehrere haben). */
export function tokensFuerMitglied(memberId: string): GruendungsToken[] {
  return getDirectory().db.select().from(gruendungsTokens).where(eq(gruendungsTokens.memberId, memberId)).orderBy(gruendungsTokens.createdAt).all();
}

export function tokenAnlegen(token: string, memberId: string, gruppeId: string, quelle: TokenQuelle): GruendungsToken {
  getDirectory()
    .db.insert(gruendungsTokens)
    .values({ token, memberId, gruppeId, quelle, status: 'offen', createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();
  return findToken(token)!;
}

/** Alle Tokens eines Stammtischs (Besitzer), älteste zuerst. */
export function tokensFuerGruppe(gruppeId: string): GruendungsToken[] {
  return getDirectory().db.select().from(gruendungsTokens).where(eq(gruendungsTokens.gruppeId, gruppeId)).orderBy(asc(gruendungsTokens.createdAt)).all();
}

export function alleTokens(): GruendungsToken[] {
  return getDirectory().db.select().from(gruendungsTokens).orderBy(asc(gruendungsTokens.createdAt)).all();
}

/** Der Token, mit dem dieser Stammtisch gegründet wurde (null = ohne Token angelegt). */
export function tokenFuerGegruendeteGruppe(gruppeId: string): GruendungsToken | null {
  return getDirectory().db.select().from(gruendungsTokens).where(eq(gruendungsTokens.eingeloestVonGruppeId, gruppeId)).get() ?? null;
}

/** Token widmen („Sepp aus Regensburg“); member_id = wer gewidmet hat. Nur solange offen. */
export function tokenWidmen(token: string, widmung: string, memberId: string): boolean {
  const r = getDirectory()
    .db.update(gruendungsTokens)
    .set({ widmung, gewidmetAm: new Date().toISOString(), memberId })
    .where(and(eq(gruendungsTokens.token, token), eq(gruendungsTokens.status, 'offen')))
    .run();
  return r.changes === 1;
}

/** Stammtisch sperren / entsperren (Verzeichnis). Der Gründer-Stammtisch is tabu. */
export function gruppeStatusSetzen(id: string, status: 'aktiv' | 'gesperrt'): void {
  const g = findGruppe(id);
  if (!g) throw new Error('Unbekannter Stammtisch');
  if (g.istGruender) throw new Error('Der Gründer-Stammtisch lässt sich ned sperren');
  getDirectory()
    .db.update(gruppen)
    .set({ status, gesperrtAm: status === 'gesperrt' ? new Date().toISOString() : null })
    .where(eq(gruppen.id, id))
    .run();
}

/* ── Token-Anfragen ── */

export function anfrageAnlegen(zeile: { id: string; gruppeId: string; memberId: string; grund: string }): TokenAnfrage {
  getDirectory().db.insert(tokenAnfragen).values({ ...zeile, status: 'offen', createdAt: new Date().toISOString() }).run();
  return findAnfrage(zeile.id)!;
}

export function findAnfrage(id: string): TokenAnfrage | null {
  return getDirectory().db.select().from(tokenAnfragen).where(eq(tokenAnfragen.id, id)).get() ?? null;
}

/** Anfragen eines Stammtischs, neueste zuerst. */
export function anfragenFuerGruppe(gruppeId: string): TokenAnfrage[] {
  return getDirectory().db.select().from(tokenAnfragen).where(eq(tokenAnfragen.gruppeId, gruppeId)).orderBy(desc(tokenAnfragen.createdAt)).all();
}

export function offeneAnfragen(): TokenAnfrage[] {
  return getDirectory().db.select().from(tokenAnfragen).where(eq(tokenAnfragen.status, 'offen')).orderBy(asc(tokenAnfragen.createdAt)).all();
}

/**
 * Anfrage entscheiden. Bei Freigabe wird der Token in derselben Transaktion
 * gemünzt (quelle 'anfrage', Halter = Antragsteller). false = war scho entschieden.
 */
export function anfrageEntscheiden(id: string, status: 'freigegeben' | 'abgelehnt', entschiedenVon: string, token: string | null): boolean {
  const d = getDirectory();
  const tx = d.sqlite.transaction((): boolean => {
    const a = findAnfrage(id);
    if (!a || a.status !== 'offen') return false;
    if (status === 'freigegeben' && token) {
      d.db.insert(gruendungsTokens).values({ token, memberId: a.memberId, gruppeId: a.gruppeId, quelle: 'anfrage', status: 'offen', createdAt: new Date().toISOString() }).run();
    }
    d.db.update(tokenAnfragen).set({ status, entschiedenVonMemberId: entschiedenVon, entschiedenAm: new Date().toISOString(), token: status === 'freigegeben' ? token : null }).where(eq(tokenAnfragen.id, id)).run();
    return true;
  });
  return tx();
}

export function findToken(token: string): GruendungsToken | null {
  return getDirectory().db.select().from(gruendungsTokens).where(eq(gruendungsTokens.token, token)).get() ?? null;
}

/**
 * Gruppe anlegen + Token einlösen in EINER Transaktion (Verzeichnis-DB).
 * Liefert false, wenn der Token inzwischen scho eingelöst war (Doppelklick,
 * zwei Leute mit demselben Link) — dann wird auch die Gruppe ned angelegt.
 */
export function gruppeGruendenMitToken(zeile: typeof gruppen.$inferInsert, token: string): boolean {
  const d = getDirectory();
  const tx = d.sqlite.transaction((): boolean => {
    const offen = d.sqlite.prepare("SELECT 1 FROM gruendungs_tokens WHERE token = ? AND status = 'offen'").get(token);
    if (!offen) return false;
    d.db.insert(gruppen).values(zeile).run();
    const r = d.db
      .update(gruendungsTokens)
      .set({ status: 'eingeloest', eingeloestVonGruppeId: zeile.id, eingeloestAm: new Date().toISOString() })
      .where(and(eq(gruendungsTokens.token, token), eq(gruendungsTokens.status, 'offen')))
      .run();
    if (r.changes !== 1) throw new Error('Token-Race');
    return true;
  });
  try {
    return tx();
  } catch (err) {
    if (err instanceof Error && err.message === 'Token-Race') return false;
    throw err;
  }
}

/** Alle Stammtische, der Gründer zuerst, dann nach Gründungsdatum. */
export function alleGruppen(): Gruppe[] {
  return getDirectory().db.select().from(gruppen).orderBy(desc(gruppen.istGruender), asc(gruppen.createdAt)).all();
}

/** Alle Stammtische, in denen die E-Mail ein Konto hat (Login-Routing). */
export function kontenFuerEmail(email: string): Konto[] {
  return getDirectory().db.select().from(konten).where(eq(konten.email, email.toLowerCase())).all();
}

/** Konto im Verzeichnis eintragen (idempotent). Nach jedem members-INSERT aufrufen. */
export function kontoAnlegen(email: string, gruppeId: string, memberId: string): void {
  getDirectory()
    .db.insert(konten)
    .values({
      id: `k_${memberId}_${gruppeId}`,
      email: email.toLowerCase(),
      gruppeId,
      memberId,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run();
}

/** Stammdaten/Config eines Stammtischs ändern (Admin-Seite „Stammtisch"). */
export function gruppeAktualisieren(
  id: string,
  patch: Partial<Pick<Gruppe, 'name' | 'motto' | 'stadt' | 'gruendungsjahr' | 'gruendungscode' | 'config'>>,
): void {
  getDirectory().db.update(gruppen).set(patch).where(eq(gruppen.id, id)).run();
}

export function kontoLoeschen(gruppeId: string, memberId: string): void {
  getDirectory()
    .db.delete(konten)
    .where(and(eq(konten.gruppeId, gruppeId), eq(konten.memberId, memberId)))
    .run();
}

/* ── Passwort vergessen ──────────────────────────────────────────────── */

const PASSWORT_TOKEN_MINUTEN = 60;

/** Neuen Link-Token für ein Konto anlegen (alte Tokens des Kontos fliegen raus). */
export function passwortTokenAnlegen(email: string, gruppeId: string, memberId: string): PasswortToken {
  const { db } = getDirectory();
  db.delete(passwortTokens).where(and(eq(passwortTokens.email, email), eq(passwortTokens.gruppeId, gruppeId))).run();
  const zeile: PasswortToken = {
    token: randomBytes(24).toString('base64url'),
    email,
    gruppeId,
    memberId,
    bis: new Date(Date.now() + PASSWORT_TOKEN_MINUTEN * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.insert(passwortTokens).values(zeile).run();
  return zeile;
}

/** Token nachschlagen; abgelaufene werden dabei gleich aufgeräumt (null). */
export function passwortTokenFinden(token: string): PasswortToken | null {
  const { db } = getDirectory();
  const t = db.select().from(passwortTokens).where(eq(passwortTokens.token, token)).get() ?? null;
  if (!t) return null;
  if (t.bis < new Date().toISOString()) {
    db.delete(passwortTokens).where(eq(passwortTokens.token, token)).run();
    return null;
  }
  return t;
}

export function passwortTokensLoeschen(email: string): void {
  getDirectory().db.delete(passwortTokens).where(eq(passwortTokens.email, email)).run();
}

export type { Gruppe, Konto, GruendungsToken, PasswortToken, TokenAnfrage, TokenQuelle } from './directory-schema';
