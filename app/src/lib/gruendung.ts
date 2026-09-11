import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { bindTenant, currentTenant, db, members, wirtshaeuser, runWithTenant } from '@/lib/db';
import {
  codeFrei,
  findGruppe,
  findToken,
  gruenderGruppeId,
  gruppeGruendenMitToken,
  kontoAnlegen,
  slugFrei,
  tokenAnlegen,
  tokenFuerMitglied,
  tokensFuerMitglied,
  type GruendungsToken,
} from '@/lib/db/directory';
import { istGueltigerSlug } from '@/lib/db/core';
import { hashPassword } from '@/lib/password';
import { newId, nowIso } from '@/lib/ids';
import { appUrl } from '@/lib/tenant-config';
import { createSession } from '@/lib/session';

/**
 * Gründungs-Tokens & Gründungs-Wizard: Jedes Mitglied des Gründer-Stammtischs
 * derf genau OAN neuen Stammtisch in d'Welt setzen. Der Token wird lazy beim
 * ersten Aufruf gemünzt (WIRT-XXXX-XXXX) und is genau einmal einlösbar.
 */

// Ohne 0/O/1/I/L — lesbar am Handy, tippbar am Stammtisch
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_RE = /^WIRT-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

function zufall(n: number): string {
  let s = '';
  for (let i = 0; i < n; i += 1) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Token des eingeloggten Gründer-Mitglieds (wird bei Bedarf gemünzt); null außerhalb des Gründer-Mandanten. */
export function tokenFuerGruenderMitglied(memberId: string): GruendungsToken | null {
  if (!currentTenant().gruppe.istGruender) return null;
  const vorhanden = tokenFuerMitglied(memberId);
  if (vorhanden) return vorhanden;
  return neuerToken(memberId);
}

/** Alle Tokens des Mitglieds (Gründer-Admin derf beliebig viele; mindestens einer wird gemünzt). */
export function tokensFuerGruenderMitglied(memberId: string): GruendungsToken[] {
  if (!currentTenant().gruppe.istGruender) return [];
  const alle = tokensFuerMitglied(memberId);
  return alle.length > 0 ? alle : [neuerToken(memberId)];
}

/** Frischen Token münzen (Aufrufer prüft, ob das Mitglied mehr als einen haben derf). */
export function neuerToken(memberId: string): GruendungsToken {
  for (let i = 0; i < 5; i += 1) {
    const token = `WIRT-${zufall(4)}-${zufall(4)}`;
    if (!findToken(token)) return tokenAnlegen(token, memberId);
  }
  throw new Error('Koa freier Token gfunden (Zufall streikt).');
}

export function tokenLink(token: string): string {
  return appUrl(`/gruenden/${token}`);
}

/** „wirt-abcd-1234" / „WIRT ABCD 1234" → „WIRT-ABCD-1234", sonst null */
export function normalisiereToken(roh: string): string | null {
  const t = roh.trim().toUpperCase().replace(/[\s_]+/g, '-');
  return TOKEN_RE.test(t) ? t : null;
}

/** Wer hat eingladen? Name des Gründer-Mitglieds hinter dem Token. */
export function einladerName(token: GruendungsToken): string | null {
  return runWithTenant(gruenderGruppeId(), () => {
    const m = db.select().from(members).where(eq(members.id, token.memberId)).get();
    return m ? (m.spitzname || m.vorname || m.name) : null;
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

/** Freier Slug aus dem Namen („Hirschen-Stammtisch" → hirschen-stammtisch, -2, -3 …) */
export function freierSlug(name: string): string {
  let basis = slugify(name);
  if (basis.length < 2) basis = `stammtisch-${zufall(4).toLowerCase()}`;
  if (istGueltigerSlug(basis) && slugFrei(basis)) return basis;
  for (let n = 2; n < 100; n += 1) {
    const s = `${basis}-${n}`;
    if (istGueltigerSlug(s) && slugFrei(s)) return s;
  }
  return `${basis.slice(0, 20)}-${zufall(4).toLowerCase()}`;
}

/** Gründungscode-Vorschlag: vier Buchstaben aus dem Namen + vier Ziffern, z. B. HIRS-4711 */
export function codeVorschlag(name: string): string {
  const buchstaben = slugify(name).replace(/[^a-z]/g, '').toUpperCase().padEnd(4, 'X').slice(0, 4);
  for (let i = 0; i < 20; i += 1) {
    const code = `${buchstaben}-${String(randomInt(1000, 9999))}`;
    if (codeFrei(code)) return code;
  }
  return `${buchstaben}-${zufall(4)}`;
}

/** Best-effort-Geocoding der Stadt (Nominatim/OSM), scheitert leise → koa Geo-Einschränkung. */
async function geocodeStadt(stadt: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(stadt)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'wirtschaftln (Stammtisch-App)' }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

export type GruendungsEingabe = {
  vorname: string;
  nachname: string;
  email: string;
  passwort: string;
  name: string;
  motto: string;
  stadt: string;
  gruendungsjahr: string;
  typ: string;
  stammhausName: string;
  stammhausAdresse: string;
  bierName: string;
  hoibePreis: string;
  code: string;
};

export type GruendungsErgebnis = { ok: true; gruppeId: string } | { ok: false; fehler: string; schritt: 1 | 2 | 3 };

/**
 * Der eigentliche Gründungsakt: Verzeichnis-Zeile + Token-Einlösung (atomar),
 * Mandanten-DB öffnen (Migrationen laufen), Gründer als Admin anlegen, Konto
 * fürs Login-Routing, beim Stammhaus-Typ das Stammhaus als Wirtshaus, Session.
 */
export async function stammtischGruenden(tokenRoh: string, e: GruendungsEingabe): Promise<GruendungsErgebnis> {
  const token = normalisiereToken(tokenRoh);
  const tokenZeile = token ? findToken(token) : null;
  if (!token || !tokenZeile) return { ok: false, fehler: 'Der Gründungs-Link is ned gültig.', schritt: 1 };
  if (tokenZeile.status !== 'offen') return { ok: false, fehler: 'Der Token is scho eingelöst — jeder derf genau oan Stammtisch gründen.', schritt: 1 };

  // Schritt 1: Gründer-Konto
  const vorname = e.vorname.trim().slice(0, 60);
  const nachname = e.nachname.trim().slice(0, 60);
  const email = e.email.trim().toLowerCase();
  if (!vorname || !nachname) return { ok: false, fehler: 'Bitte Vor- und Nachname eintragen.', schritt: 1 };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, fehler: 'Des schaut ned nach einer E-Mail aus.', schritt: 1 };
  if (e.passwort.length < 6) return { ok: false, fehler: 'Passwort braucht mindestens 6 Zeichen.', schritt: 1 };

  // Schritt 2: Stammtisch-Basis
  const name = e.name.trim().slice(0, 60);
  const motto = e.motto.trim().slice(0, 120) || null;
  const stadt = e.stadt.trim().slice(0, 60);
  const jahr = Number(e.gruendungsjahr.trim());
  const typ = e.typ === 'stammhaus' ? 'stammhaus' : 'wandernd';
  const stammhausName = e.stammhausName.trim().slice(0, 80);
  const stammhausAdresse = e.stammhausAdresse.trim().slice(0, 200) || null;
  const bierName = e.bierName.trim().slice(0, 60) || 'Helles';
  const hoibePreisCents = Math.round(Number(e.hoibePreis.trim().replace(',', '.')) * 100);
  if (name.length < 2) return { ok: false, fehler: 'Der Stammtisch braucht an Namen.', schritt: 2 };
  if (stadt.length < 2) return { ok: false, fehler: 'In welcher Stadt seid’s dahoam?', schritt: 2 };
  if (!Number.isInteger(jahr) || jahr < 1500 || jahr > new Date().getFullYear()) return { ok: false, fehler: 'Des Gründungsjahr schaut komisch aus.', schritt: 2 };
  if (typ === 'stammhaus' && stammhausName.length < 2) return { ok: false, fehler: 'Wia hoaßt euer Stammhaus?', schritt: 2 };
  if (!Number.isInteger(hoibePreisCents) || hoibePreisCents < 50 || hoibePreisCents > 5000) return { ok: false, fehler: 'Der Hoibe-Preis muss zwischen 0,50 € und 50 € liegen.', schritt: 2 };

  // Schritt 3: eigener Gründungscode
  const code = e.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) return { ok: false, fehler: 'Der Gründungscode: 3–40 Zeichen, nur Buchstaben, Ziffern, Bindestrich.', schritt: 3 };
  if (!codeFrei(code)) return { ok: false, fehler: 'Den Code hat scho a anderer Stammtisch, nimm an eigenen.', schritt: 3 };

  const center = await geocodeStadt(stadt);
  const slug = freierSlug(name);
  const stammhausId = typ === 'stammhaus' ? newId('w') : null;
  const config = {
    bierName,
    hoibePreisCents,
    saisonEpocheJahr: new Date().getFullYear(),
    geo: center ? { center, boundsKm: 40, suchSuffix: stadt } : null,
    ...(stammhausId ? { stammhausWirtshausId: stammhausId } : {}),
  };

  const angelegt = gruppeGruendenMitToken(
    {
      id: slug,
      name,
      motto,
      stadt,
      gruendungsjahr: jahr,
      typ,
      gruendungscode: code,
      istGruender: false,
      config: JSON.stringify(config),
      status: 'aktiv',
      createdAt: nowIso(),
    },
    token,
  );
  if (!angelegt) return { ok: false, fehler: 'Der Token wurde grad eben scho eingelöst.', schritt: 1 };

  // Mandanten-DB öffnen (Migrationen), Gründer als Admin, Stammhaus, Konto, Session
  const tenant = bindTenant(slug);
  if (!tenant) return { ok: false, fehler: 'Der Stammtisch konnte ned angelegt werden.', schritt: 3 };
  const memberId = newId('m');
  db.insert(members)
    .values({
      id: memberId,
      name: `${vorname} ${nachname}`,
      vorname,
      nachname,
      email,
      passwordHash: hashPassword(e.passwort),
      role: 'admin',
      status: 'aktiv',
      erstanmeldung: false,
      createdAt: nowIso(),
    })
    .run();
  if (stammhausId) {
    let lat: number | null = null;
    let lng: number | null = null;
    if (stammhausAdresse) {
      const c = await geocodeStadt(`${stammhausAdresse}`);
      lat = c?.lat ?? null;
      lng = c?.lng ?? null;
    }
    db.insert(wirtshaeuser)
      .values({ id: stammhausId, name: stammhausName, adresse: stammhausAdresse, bezirk: stadt, lat, lng, createdAt: nowIso() })
      .run();
  }
  kontoAnlegen(email, slug, memberId);
  await createSession(memberId);
  return { ok: true, gruppeId: slug };
}

export function gruppenName(id: string | null): string | null {
  return id ? (findGruppe(id)?.name ?? null) : null;
}
