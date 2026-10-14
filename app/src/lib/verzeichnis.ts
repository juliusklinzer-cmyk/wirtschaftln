import { and, desc, eq, sql } from 'drizzle-orm';
import { db, members, termine, runWithTenant } from '@/lib/db';
import {
  alleGruppen,
  alleTokens,
  anfragenFuerGruppe,
  findGruppe,
  gruenderGruppeId,
  offeneAnfragen,
  tokenFuerGegruendeteGruppe,
  type Gruppe,
  type GruendungsToken,
  type TokenAnfrage,
} from '@/lib/db/directory';
import { anzeigeName } from '@/lib/namen';
import { tokenAnspruch } from '@/lib/gruendung';

/** Kein Abend seit 90 Tagen (oder nie) → „inaktiv“ (nur Anzeige, koa Status) */
const INAKTIV_TAGE = 90;

export type GruppenUebersicht = {
  gruppe: Gruppe;
  gruender: { name: string; email: string } | null;
  /** Woher kam der Token, mit dem der Stammtisch gegründet wurde */
  eingeladenVon: { gruppeId: string; gruppeName: string; vonName: string; widmung: string | null } | null;
  aktiveMitglieder: number;
  abende: number;
  letzterAbend: string | null;
  inaktiv: boolean;
  tokensOffen: number;
  tokensEingeloest: number;
  anfragenOffen: number;
  naechsterToken: string | null;
};

export type Mitgliedszeile = { id: string; name: string; email: string; admin: boolean; erstanmeldung: boolean; photoUrl: string | null };

/** Name eines Mitglieds in einem beliebigen (auch gesperrten) Mandanten, mit Cache je Aufruf. */
function namenLeser() {
  const cache = new Map<string, string>();
  return (gruppeId: string, memberId: string): string => {
    const key = `${gruppeId}/${memberId}`;
    const c = cache.get(key);
    if (c) return c;
    let name = '—';
    try {
      runWithTenant(gruppeId, () => {
        const m = db.select().from(members).where(eq(members.id, memberId)).get();
        if (m) name = anzeigeName(m);
      }, { auchGesperrt: true });
    } catch { /* DB fehlt */ }
    cache.set(key, name);
    return name;
  };
}

/** Einlader-Zeile für einen gegründeten Stammtisch (null = ohne Token angelegt). */
export function eingeladenVon(gruppeId: string, nameVon = namenLeser()): GruppenUebersicht['eingeladenVon'] {
  const t = tokenFuerGegruendeteGruppe(gruppeId);
  if (!t) return null;
  const besitzer = t.gruppeId ?? gruenderGruppeId();
  const g = findGruppe(besitzer);
  return { gruppeId: besitzer, gruppeName: g?.name ?? besitzer, vonName: nameVon(besitzer, t.memberId), widmung: t.widmung };
}

/** Kennzahlen aus der Mandanten-DB (Mitglieder, Abende); fehlende DB → Nullen. */
function mandantenZahlen(gruppeId: string): { aktiveMitglieder: number; abende: number; letzterAbend: string | null; gruender: GruppenUebersicht['gruender'] } {
  try {
    return runWithTenant(gruppeId, () => {
      const aktiveMitglieder = db.select({ n: sql<number>`count(*)` }).from(members).where(eq(members.status, 'aktiv')).get()?.n ?? 0;
      const abende = db.select({ n: sql<number>`count(*)` }).from(termine).where(eq(termine.phase, 'abgeschlossen')).get()?.n ?? 0;
      const letzter = db.select({ datum: termine.datum }).from(termine).where(eq(termine.phase, 'abgeschlossen')).orderBy(desc(termine.datum)).get();
      const admin = db.select().from(members).where(and(eq(members.role, 'admin'), eq(members.status, 'aktiv'))).orderBy(members.createdAt).get();
      return { aktiveMitglieder, abende, letzterAbend: letzter?.datum ?? null, gruender: admin ? { name: anzeigeName(admin), email: admin.email } : null };
    }, { auchGesperrt: true });
  } catch {
    return { aktiveMitglieder: 0, abende: 0, letzterAbend: null, gruender: null };
  }
}

/** Alle Stammtische mit Kennzahlen (Verzeichnis 3a), Gründer zuerst. */
export function verzeichnisUebersicht(): GruppenUebersicht[] {
  const tokens = alleTokens();
  const nameVon = namenLeser();
  const heute = new Date();
  return alleGruppen().map((gruppe) => {
    const zahlen = mandantenZahlen(gruppe.id);
    const eigene = tokens.filter((t) => t.gruppeId === gruppe.id);
    const letzterTag = zahlen.letzterAbend ? new Date(`${zahlen.letzterAbend}T12:00:00`) : null;
    const inaktiv = !letzterTag || (heute.getTime() - letzterTag.getTime()) / 864e5 > INAKTIV_TAGE;
    const naechster = tokenAnspruch(gruppe).gesperrt[0]?.ab ?? null;
    return {
      gruppe,
      ...zahlen,
      eingeladenVon: eingeladenVon(gruppe.id, nameVon),
      inaktiv,
      tokensOffen: eigene.filter((t) => t.status === 'offen').length,
      tokensEingeloest: eigene.filter((t) => t.status === 'eingeloest').length,
      anfragenOffen: anfragenFuerGruppe(gruppe.id).filter((a) => a.status === 'offen').length,
      naechsterToken: naechster,
    };
  });
}

export type StammbaumKnoten = { gruppe: Gruppe; vonName: string | null; widmung: string | null; ohneToken: boolean; kinder: StammbaumKnoten[] };

/** Stammbaum: wer hat wen eingeladen, ab dem Gründer. Ohne Token angelegte hängen am Gründer („ohne Token“). */
export function stammbaum(): StammbaumKnoten | null {
  const gruppen = alleGruppen();
  const wurzel = gruppen.find((g) => g.istGruender);
  if (!wurzel) return null;
  const nameVon = namenLeser();
  const eltern = new Map<string, { elternId: string; vonName: string; widmung: string | null }>();
  for (const t of alleTokens()) {
    if (t.status !== 'eingeloest' || !t.eingeloestVonGruppeId) continue;
    const elternId = t.gruppeId ?? wurzel.id;
    eltern.set(t.eingeloestVonGruppeId, { elternId, vonName: nameVon(elternId, t.memberId), widmung: t.widmung });
  }
  const bauen = (g: Gruppe, tiefe: number): StammbaumKnoten => {
    const info = eltern.get(g.id);
    const kinder = gruppen
      .filter((k) => !k.istGruender && k.id !== g.id && (eltern.get(k.id)?.elternId ?? wurzel.id) === g.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((k) => (tiefe < 12 ? bauen(k, tiefe + 1) : { gruppe: k, vonName: null, widmung: null, ohneToken: true, kinder: [] }));
    return { gruppe: g, vonName: info?.vonName ?? null, widmung: info?.widmung ?? null, ohneToken: !g.istGruender && !info, kinder };
  };
  return bauen(wurzel, 0);
}

/** Offene Anfragen mit Stammtisch und Antragsteller (für die Freigabe-Karten). */
export function offeneAnfragenMitNamen(): Array<{ anfrage: TokenAnfrage; gruppe: Gruppe | null; vonName: string }> {
  const nameVon = namenLeser();
  return offeneAnfragen().map((anfrage) => ({ anfrage, gruppe: findGruppe(anfrage.gruppeId), vonName: nameVon(anfrage.gruppeId, anfrage.memberId) }));
}

/** Mitglieder eines Stammtischs (nur lesend, Detailseite). */
export function mitgliederVon(gruppeId: string): Mitgliedszeile[] {
  try {
    return runWithTenant(gruppeId, () =>
      db.select().from(members).where(eq(members.status, 'aktiv')).orderBy(members.createdAt).all()
        .map((m) => ({ id: m.id, name: anzeigeName(m), email: m.email, admin: m.role === 'admin', erstanmeldung: m.erstanmeldung, photoUrl: m.photoUrl })),
    { auchGesperrt: true });
  } catch {
    return [];
  }
}

/** Tokens eines Stammtischs mit Namen der Widmenden (Detailseite). */
export function tokensMitNamen(gruppeId: string, tokens: GruendungsToken[]): Array<GruendungsToken & { vonName: string; eingeloestName: string | null }> {
  const nameVon = namenLeser();
  return tokens.map((t) => ({ ...t, vonName: nameVon(gruppeId, t.memberId), eingeloestName: t.eingeloestVonGruppeId ? (findGruppe(t.eingeloestVonGruppeId)?.name ?? null) : null }));
}
