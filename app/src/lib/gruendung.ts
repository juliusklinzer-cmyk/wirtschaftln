import { randomInt } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { bindTenant, currentTenant, db, members, wirtshaeuser, runWithTenant } from '@/lib/db';
import {
  anfrageAnlegen,
  anfragenFuerGruppe,
  codeFrei,
  findGruppe,
  findToken,
  gruenderGruppeId,
  gruppeGruendenMitToken,
  kontoAnlegen,
  slugFrei,
  tokenAnlegen,
  tokenFuerMitglied,
  tokensFuerGruppe,
  tokensFuerMitglied,
  tokenWidmen,
  type Gruppe,
  type GruendungsToken,
  type TokenAnfrage,
  type TokenQuelle,
} from '@/lib/db/directory';
import { mailAn } from '@/lib/mail';
import { pushAn } from '@/lib/push';
import { istGueltigerSlug } from '@/lib/db/core';
import { hashPassword } from '@/lib/password';
import { newId, nowIso } from '@/lib/ids';
import { appUrl } from '@/lib/tenant-config';
import { createSession } from '@/lib/session';
import { logoNormieren } from '@/lib/logo';

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
  return neuerToken(memberId, gruenderGruppeId(), 'mitglied');
}

/** Alle Tokens des Gründer-Mitglieds (Admin derf beliebig viele; mindestens einer wird gemünzt). */
export function tokensFuerGruenderMitglied(memberId: string): GruendungsToken[] {
  if (!currentTenant().gruppe.istGruender) return [];
  const alle = tokensFuerMitglied(memberId);
  return alle.length > 0 ? alle : [neuerToken(memberId, gruenderGruppeId(), 'mitglied')];
}

/** Freien Token-String finden (WIRT-XXXX-XXXX). */
export function freierTokenString(): string {
  for (let i = 0; i < 5; i += 1) {
    const token = `WIRT-${zufall(4)}-${zufall(4)}`;
    if (!findToken(token)) return token;
  }
  throw new Error('Koa freier Token gfunden (Zufall streikt).');
}

/** Frischen Token münzen (Aufrufer prüft, ob der Stammtisch bzw. das Mitglied einen kriegen derf). */
export function neuerToken(memberId: string, gruppeId: string, quelle: TokenQuelle): GruendungsToken {
  return tokenAnlegen(freierTokenString(), memberId, gruppeId, quelle);
}

/* ── Tokens für neue Stammtische: nach 2 und 6 Monaten je einer, dazu Anfragen ── */

export const ANSPRUCH_MONATE = [2, 6] as const;

/** Freischalt-Datum: Gründung + n Monate (Monatsende läuft über, 31.12. + 2 → 3.3., passt für uns). */
export function freigeschaltetAb(createdAt: string, monate: number): Date {
  const d = new Date(createdAt);
  d.setMonth(d.getMonth() + monate);
  return d;
}

/** Wie viele Anspruch-Tokens stehen dem Stammtisch zu, welche Fristen sind no zu? */
export function tokenAnspruch(gruppe: Gruppe, jetzt = new Date()): { faellig: number; gesperrt: Array<{ nr: number; monate: number; ab: string }> } {
  if (gruppe.istGruender) return { faellig: 0, gesperrt: [] };
  let faellig = 0;
  const gesperrt: Array<{ nr: number; monate: number; ab: string }> = [];
  ANSPRUCH_MONATE.forEach((monate, i) => {
    const ab = freigeschaltetAb(gruppe.createdAt, monate);
    if (ab <= jetzt) faellig += 1;
    else gesperrt.push({ nr: i + 1, monate, ab: ab.toISOString() });
  });
  return { faellig, gesperrt };
}

/** Fällige Anspruch-Tokens nachmünzen (lazy, beim Öffnen des Profils durch an Admin). */
export function anspruchTokensSicherstellen(gruppe: Gruppe, memberId: string): void {
  if (gruppe.istGruender) return;
  const { faellig } = tokenAnspruch(gruppe);
  const da = tokensFuerGruppe(gruppe.id).filter((t) => t.quelle === 'anspruch').length;
  for (let i = da; i < faellig; i += 1) neuerToken(memberId, gruppe.id, 'anspruch');
}

export type TokenProfil = {
  tokens: GruendungsToken[];
  /** Noch zu Fristen (nur fremde Stammtische) */
  gesperrt: Array<{ nr: number; monate: number; ab: string }>;
  anfragen: TokenAnfrage[];
  /** Admin eines fremden Stammtischs ohne offene Anfrage */
  darfAnfragen: boolean;
  /** Gründer-Admin: beliebig viele münzen */
  darfMuenzen: boolean;
};

/**
 * Was der Spezl im Profil unter „Gründungs-Token“ sieht: beim Gründer die
 * eigenen Tokens, sonst (nur Admins) die Tokens des Stammtischs samt Fristen
 * und Anfragen. Mitglieder fremder Stammtische sehen nix.
 */
export function tokensFuerProfil(me: { id: string; role: string }): TokenProfil {
  const gruppe = currentTenant().gruppe;
  const admin = me.role === 'admin';
  if (gruppe.istGruender) {
    return { tokens: tokensFuerGruenderMitglied(me.id), gesperrt: [], anfragen: [], darfAnfragen: false, darfMuenzen: admin };
  }
  if (!admin) return { tokens: [], gesperrt: [], anfragen: [], darfAnfragen: false, darfMuenzen: false };
  anspruchTokensSicherstellen(gruppe, me.id);
  const anfragen = anfragenFuerGruppe(gruppe.id);
  return {
    tokens: tokensFuerGruppe(gruppe.id),
    gesperrt: tokenAnspruch(gruppe).gesperrt,
    anfragen,
    darfAnfragen: !anfragen.some((a) => a.status === 'offen'),
    darfMuenzen: false,
  };
}

/** Darf der Spezl diesen Token widmen/teilen? (eigener Gründer-Token oder Admin des Besitzer-Stammtischs) */
export function darfTokenNutzen(me: { id: string; role: string }, token: GruendungsToken): boolean {
  const gruppe = currentTenant().gruppe;
  if (token.gruppeId !== gruppe.id) return false;
  if (gruppe.istGruender) return token.memberId === me.id || me.role === 'admin';
  return me.role === 'admin';
}

/** Widmung setzen; liefert Fehlertext oder null. */
export function tokenWidmenFuer(me: { id: string; role: string }, tokenRoh: string, widmungRoh: string): string | null {
  const token = findToken(normalisiereToken(tokenRoh) ?? '');
  if (!token || !darfTokenNutzen(me, token)) return 'Der Token gehört ned dir.';
  if (token.status !== 'offen') return 'Der Token is scho eingelöst.';
  const widmung = widmungRoh.trim().replace(/\s+/g, ' ').slice(0, 60);
  if (widmung.length < 2) return 'Für wen is der Token? Schreib an Namen rein.';
  return tokenWidmen(token.token, widmung, me.id) ? null : 'Des hat grad ned klappt.';
}

/** Weiteren Token anfragen (Admin eines fremden Stammtischs, eine offene Anfrage auf einmal). */
export function anfrageStellen(me: { id: string; role: string }, grundRoh: string): string | null {
  const gruppe = currentTenant().gruppe;
  if (gruppe.istGruender || me.role !== 'admin') return 'Anfragen derf nur der Admin von am Stammtisch.';
  const grund = grundRoh.trim().slice(0, 300);
  if (grund.length < 10) return 'Schreib bitte in a paar Worten, wen ihr einladen wollts und warum.';
  if (anfragenFuerGruppe(gruppe.id).some((a) => a.status === 'offen')) return 'Es läuft scho a Anfrage, wart bis die entschieden is.';
  anfrageAnlegen({ id: newId('ta'), gruppeId: gruppe.id, memberId: me.id, grund });
  return null;
}

export function tokenLink(token: string): string {
  return appUrl(`/gruenden/${token}`);
}

/** „wirt-abcd-1234" / „WIRT ABCD 1234" → „WIRT-ABCD-1234", sonst null */
export function normalisiereToken(roh: string): string | null {
  const t = roh.trim().toUpperCase().replace(/[\s_]+/g, '-');
  return TOKEN_RE.test(t) ? t : null;
}

/** Wer hat eingladen? Name des Mitglieds hinter dem Token. */
export function einladerName(token: GruendungsToken): string | null {
  return einlader(token)?.name ?? null;
}

/** Einlader mit Herkunft und Stammtisch für die Einladungs-Chips („Für Sepp“ · „Von Hansi · Wirtschaftln, München“). */
export function einlader(token: GruendungsToken): { name: string; herkunft: string | null; gruppeName: string; stadt: string | null; istGruender: boolean } | null {
  const gruppeId = token.gruppeId ?? gruenderGruppeId();
  const gruppe = findGruppe(gruppeId);
  if (!gruppe) return null;
  try {
    return runWithTenant(gruppeId, () => {
      const m = db.select().from(members).where(eq(members.id, token.memberId)).get();
      if (!m) return null;
      return { name: m.spitzname || m.vorname || m.name, herkunft: m.herkunft?.trim() || null, gruppeName: gruppe.name, stadt: gruppe.stadt, istGruender: gruppe.istGruender };
    }, { auchGesperrt: true });
  } catch {
    return null;
  }
}

/**
 * Nach der Gründung: Push + Mail an die Wirtschaftln-Admins (→ /verzeichnis)
 * und an den, der den Token gewidmet hat (→ /profil). Darf nie die Gründung
 * scheitern lassen, Fehler werden nur geloggt.
 */
export async function benachrichtigeGruendung(token: GruendungsToken, neue: { id: string; name: string; stadt: string | null }, gruenderName: string): Promise<void> {
  const wer = einlader(token);
  const von = wer ? `${wer.name} (${wer.gruppeName})` : 'unbekannt';
  const text = `Der ${neue.name}${neue.stadt ? ` (${neue.stadt})` : ''} wurde gegründet. Gründer: ${gruenderName}. Eingeladen von ${von}${token.widmung ? `, Widmung „${token.widmung}“` : ''}.`;
  const titel = '🍻 Neuer Stammtisch gegründet';
  const mailText = (pfad: string) => `Servus!\n\n${text}\n\n→ ${appUrl(pfad)}\n\nDeine Wirtschaftln-App`;
  const schonMail = new Set<string>();
  const jobs: Promise<unknown>[] = [];
  try {
    runWithTenant(gruenderGruppeId(), () => {
      const admins = db.select().from(members).where(and(eq(members.role, 'admin'), eq(members.status, 'aktiv'))).all();
      admins.forEach((m) => schonMail.add(m.email.toLowerCase()));
      jobs.push(pushAn(admins.map((m) => m.id), titel, text, '/verzeichnis'));
      jobs.push(mailAn(admins.map((m) => m.email), `Neuer Stammtisch: ${neue.name}`, mailText('/verzeichnis')));
    });
  } catch (err) {
    console.error('Gründungs-Benachrichtigung (Admins) fehlgeschlagen:', err);
  }
  const besitzer = token.gruppeId ?? gruenderGruppeId();
  try {
    runWithTenant(besitzer, () => {
      const m = db.select().from(members).where(eq(members.id, token.memberId)).get();
      if (!m) return;
      jobs.push(pushAn([m.id], titel, text, '/profil'));
      if (!schonMail.has(m.email.toLowerCase())) jobs.push(mailAn([m.email], `Neuer Stammtisch: ${neue.name}`, mailText('/profil')));
    }, { auchGesperrt: true });
  } catch (err) {
    console.error('Gründungs-Benachrichtigung (Einlader) fehlgeschlagen:', err);
  }
  await Promise.allSettled(jobs);
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
  stammhausBezirk: string;
  stammhausTelefon: string;
  stammhausLat: string;
  stammhausLng: string;
  bierName: string;
  hoibePreis: string;
  code: string;
  /** Logo als Data-URL aus dem Logo-Wähler, leer = koa Logo */
  logoData: string;
  /** Schnapselt ihr? → Feature schnaps */
  schnaps: boolean;
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
  if (tokenZeile.gruppeId && findGruppe(tokenZeile.gruppeId)?.status === 'gesperrt') return { ok: false, fehler: 'Der Gründungs-Link is ned mehr gültig.', schritt: 1 };

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
  if (!Number.isInteger(jahr) || jahr < 1) return { ok: false, fehler: 'Des Gründungsjahr is koa Jahreszahl.', schritt: 2 };
  if (jahr > new Date().getFullYear()) return { ok: false, fehler: 'In der Zukunft gründen geht ned.', schritt: 2 };
  if (typ === 'stammhaus' && stammhausName.length < 2) return { ok: false, fehler: 'Wia hoaßt euer Stammhaus?', schritt: 2 };
  if (!Number.isInteger(hoibePreisCents) || hoibePreisCents < 50 || hoibePreisCents > 5000) return { ok: false, fehler: 'Der Hoibe-Preis muss zwischen 0,50 € und 50 € liegen.', schritt: 2 };

  // Schritt 3: eigener Gründungscode
  const code = e.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) return { ok: false, fehler: 'Der Gründungscode: 3–40 Zeichen, nur Buchstaben, Ziffern, Bindestrich.', schritt: 3 };
  if (!codeFrei(code)) return { ok: false, fehler: 'Den Code hat scho a anderer Stammtisch, nimm an eigenen.', schritt: 3 };

  const center = await geocodeStadt(stadt);
  const logo = e.logoData ? await logoNormieren(e.logoData) : null;
  const slug = freierSlug(name);
  const stammhausId = typ === 'stammhaus' ? newId('w') : null;
  const config = {
    bierName,
    hoibePreisCents,
    saisonEpocheJahr: new Date().getFullYear(),
    geo: center ? { center, boundsKm: 40, suchSuffix: stadt } : null,
    ...(stammhausId ? { stammhausWirtshausId: stammhausId } : {}),
    ...(logo ? { logo } : {}),
    ...(e.schnaps ? { features: { schnaps: true } } : {}),
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
    // Koordinaten aus der Google-Suche; ohne Treffer Adresse/Name geocoden
    let lat: number | null = Number(e.stammhausLat) || null;
    let lng: number | null = Number(e.stammhausLng) || null;
    if (lat == null || lng == null) {
      const c = await geocodeStadt(stammhausAdresse ? `${stammhausAdresse}` : `${stammhausName}, ${stadt}`);
      lat = c?.lat ?? null;
      lng = c?.lng ?? null;
    }
    db.insert(wirtshaeuser)
      .values({
        id: stammhausId,
        name: stammhausName,
        adresse: stammhausAdresse,
        bezirk: e.stammhausBezirk.trim().slice(0, 60) || stadt,
        telefon: e.stammhausTelefon.trim().slice(0, 40) || null,
        lat,
        lng,
        createdAt: nowIso(),
      })
      .run();
  }
  kontoAnlegen(email, slug, memberId);
  await createSession(memberId);
  try {
    await benachrichtigeGruendung(tokenZeile, { id: slug, name, stadt }, `${vorname} ${nachname}`);
  } catch (err) {
    console.error('Gründungs-Benachrichtigung fehlgeschlagen:', err);
  }
  return { ok: true, gruppeId: slug };
}

export function gruppenName(id: string | null): string | null {
  return id ? (findGruppe(id)?.name ?? null) : null;
}
