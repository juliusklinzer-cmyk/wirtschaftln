import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, eq } from 'drizzle-orm';
import type Database from 'better-sqlite3';
import * as dirSchema from './directory-schema';
import { gruppen, konten, gruendungsTokens, type Gruppe, type Konto, type GruendungsToken } from './directory-schema';
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

export function tokenAnlegen(token: string, memberId: string): GruendungsToken {
  getDirectory()
    .db.insert(gruendungsTokens)
    .values({ token, memberId, status: 'offen', createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();
  return findToken(token)!;
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

export function alleGruppen(): Gruppe[] {
  return getDirectory().db.select().from(gruppen).all();
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

export type { Gruppe, Konto, GruendungsToken } from './directory-schema';
