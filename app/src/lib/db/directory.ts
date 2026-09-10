import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, eq } from 'drizzle-orm';
import type Database from 'better-sqlite3';
import * as dirSchema from './directory-schema';
import { gruppen, konten, type Gruppe, type Konto } from './directory-schema';
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

export function kontoLoeschen(gruppeId: string, memberId: string): void {
  getDirectory()
    .db.delete(konten)
    .where(and(eq(konten.gruppeId, gruppeId), eq(konten.memberId, memberId)))
    .run();
}

export type { Gruppe, Konto, GruendungsToken } from './directory-schema';
