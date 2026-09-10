import { AsyncLocalStorage } from 'node:async_hooks';
import { cache } from 'react';
// Next-interner Request-Store: dieselbe Stelle, aus der cookies()/headers()
// lesen — synchron erreichbar in Server Components, Server Actions und
// Route-Handlern, und pro Request eindeutig. Wir hängen den Mandanten per
// WeakMap dran (kein Mutieren des Stores).
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import type Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { openTenantSqlite } from './core';
import { findGruppe, type Gruppe } from './directory';

/**
 * Eine SQLite-DB pro Stammtisch. `db` ist nach außen weiterhin das gewohnte
 * Drizzle-Objekt (alle Importe bleiben wie sie sind), intern aber ein Proxy,
 * der pro Request auf die DB des gerade gebundenen Mandanten zeigt.
 *
 * Binden passiert über bindTenant() (getCurrentMember ruft es aus dem Cookie
 * heraus auf; Login/Beitreten binden explizit). Drei Slots, in dieser Reihenfolge:
 *  1. AsyncLocalStorage via runWithTenant() (Route-Handler, Skripte)
 *  2. Next-Request-Store (WeakMap): gilt synchron im ganzen Request — auch NACH
 *     einem `await getCurrentMember()` in einer Server Action. React-`cache()`
 *     greift dort ned, und AsyncLocalStorage.enterWith() gilt nur für die
 *     Fortsetzung des Aufrufers, ned für den, der drauf wartet.
 *  3. React-cache()-Slot als Netz beim Rendern
 *
 * Ohne gebundenen Mandanten wirft der Proxy absichtlich (fail fast) — so
 * fällt sofort auf, wenn irgendwo `db` vor dem Binden angefasst wird, und
 * `next build` kann beim Prerendern keine DB-Datei mehr berühren.
 */

export type TenantDb = BetterSQLite3Database<typeof schema>;

export type Tenant = {
  id: string;
  /** Verzeichnis-Zeile, wird bei jedem bindTenant/runWithTenant frisch geladen */
  gruppe: Gruppe;
  sqlite: Database.Database;
  db: TenantDb;
};

// Ein Handle pro Mandant und Prozess (kein Doppel-Öffnen derselben Datei).
const geoeffnet = new Map<string, Tenant>();
const als = new AsyncLocalStorage<Tenant>();
const requestSlot = cache((): { tenant: Tenant | null } => ({ tenant: null }));
const requestSlots = new WeakMap<object, Tenant>();

function requestKey(): object | null {
  try {
    return workAsyncStorage.getStore() ?? null;
  } catch {
    return null;
  }
}

export class TenantNichtGebunden extends Error {
  constructor() {
    super('Kein Stammtisch gebunden: db wurde ohne bindTenant()/runWithTenant() angefasst.');
    this.name = 'TenantNichtGebunden';
  }
}

/**
 * Mandanten-DB öffnen (oder das gecachte Handle liefern). Validiert die id
 * ZUERST gegen das Verzeichnis — erst dann wird ein Dateipfad gebildet.
 */
export function openTenantDb(id: string): Tenant {
  const gruppe = findGruppe(id);
  if (!gruppe) throw new Error(`Unbekannter Stammtisch: ${JSON.stringify(id)}`);
  const vorhanden = geoeffnet.get(id);
  if (vorhanden) {
    vorhanden.gruppe = gruppe;
    return vorhanden;
  }
  const sqlite = openTenantSqlite(id);
  const tenant: Tenant = { id, gruppe, sqlite, db: drizzle(sqlite, { schema }) };
  geoeffnet.set(id, tenant);
  return tenant;
}

function slotSicher(): { tenant: Tenant | null } | null {
  try {
    return requestSlot();
  } catch {
    return null;
  }
}

/**
 * Mandanten für den laufenden Request binden (Server Components/Actions).
 * Liefert null bei unbekanntem oder gesperrtem Stammtisch — der Aufrufer
 * behandelt das wie „ned angemeldet".
 */
export function bindTenant(id: string): Tenant | null {
  const gruppe = findGruppe(id);
  if (!gruppe || gruppe.status !== 'aktiv') return null;
  const tenant = openTenantDb(id);
  // enterWith: gilt für die restliche synchrone Ausführung und alles, was
  // asynchron daraus folgt — also den laufenden Request (Next legt um jeden
  // Request seinen eigenen Async-Kontext, andere Requests sehen das ned).
  als.enterWith(tenant);
  const key = requestKey();
  if (key) requestSlots.set(key, tenant);
  const slot = slotSicher();
  if (slot) slot.tenant = tenant;
  return tenant;
}

/** Gibt es den Stammtisch und ist er aktiv? (ohne DB zu öffnen) */
export function tenantVerfuegbar(id: string): boolean {
  const gruppe = findGruppe(id);
  return !!gruppe && gruppe.status === 'aktiv';
}

/** Mandanten für einen Callback binden (Route-Handler, Skripte). */
export function runWithTenant<T>(id: string, fn: () => T): T {
  if (!tenantVerfuegbar(id)) throw new Error(`Unbekannter oder gesperrter Stammtisch: ${JSON.stringify(id)}`);
  return als.run(openTenantDb(id), fn);
}

export function currentTenantOrNull(): Tenant | null {
  const key = requestKey();
  return als.getStore() ?? (key ? requestSlots.get(key) : undefined) ?? slotSicher()?.tenant ?? null;
}

export function currentTenant(): Tenant {
  const t = currentTenantOrNull();
  if (!t) throw new TenantNichtGebunden();
  return t;
}

export const db: TenantDb = new Proxy({} as TenantDb, {
  get(_ziel, prop) {
    const echt = currentTenant().db as unknown as Record<PropertyKey, unknown>;
    const wert = echt[prop];
    return typeof wert === 'function' ? (wert as (...args: unknown[]) => unknown).bind(echt) : wert;
  },
});

export * from './schema';
