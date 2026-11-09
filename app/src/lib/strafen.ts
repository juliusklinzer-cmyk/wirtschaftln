import { and, eq } from 'drizzle-orm';
import { db, strafen, kasse, besuche, votes, termine, wirtshaeuser, members } from '@/lib/db';
import { getAktiveMitglieder, getPraesidentId, getStats } from '@/lib/queries';
import { WACKELT_AB_UNENTSCHULDIGT } from '@/lib/punkte';
import { tenantConfig } from '@/lib/tenant-config';
import { pushAn } from '@/lib/push';
import { mailAn } from '@/lib/mail';
import { mailStrafe, mailZahlung, berlinNachUtc } from '@/lib/mail-vorlagen';
import { mailRahmen, rufname, willMail } from '@/lib/mail-rahmen';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';
import { katalog, festeRegel, fehltUnentschuldigt, folgeWort, STRAFEN_KATALOG_AB, type Regel } from '@/lib/strafen-regeln';

/**
 * Strafen buchen (Strafenkatalog, 04.11.2026). WP und Betrag werden beim
 * Buchen eingefroren, ein €-Anteil steht zusätzlich als offene Forderung
 * in der Kasse. Benachrichtigt wird genau einmal pro Buchung.
 */

type Mitglied = typeof members.$inferSelect;
type Buchung = typeof strafen.$inferSelect;

function wirtshausVon(terminId: string | null): string | null {
  if (!terminId) return null;
  const t = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!t?.wirtshausId) return null;
  return db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, t.wirtshausId)).get()?.name ?? null;
}

/** Buchung + ggf. Kassenzeile anlegen. */
function anlegen(d: { regel: Regel; memberId: string; terminId: string | null; wp: number | null; gebuchtVon: string | null; auto?: boolean }): Buchung {
  const jetzt = nowIso();
  const kasseId = d.regel.betragCents > 0 ? newId('k') : null;
  const ort = wirtshausVon(d.terminId);
  const buchung: Buchung = {
    id: newId('st'), regelId: d.regel.id, art: d.regel.art, name: d.regel.name, memberId: d.memberId, terminId: d.terminId,
    wp: d.wp, betragCents: d.regel.betragCents, kasseId, status: 'offen', gebuchtVon: d.gebuchtVon, benachrichtigt: false, auto: !!d.auto, gerichtetVon: null, gerichtetAm: null, createdAt: jetzt,
  };
  // In einer Transaktion: kracht der eindeutige Index (zwei Läufe gleichzeitig), bleibt auch keine Kassenzeile übrig
  db.transaction((tx) => {
    if (kasseId) {
      tx.insert(kasse)
        .values({
          id: kasseId, memberId: d.memberId, terminId: d.terminId,
          grund: ort ? `${d.regel.name} im ${ort}` : d.regel.name,
          betragCents: -d.regel.betragCents, kind: 'strafe', status: 'offen', gemeldetVon: d.gebuchtVon, createdAt: jetzt,
        })
        .run();
    }
    tx.insert(strafen).values(buchung).run();
  });
  return buchung;
}

/** Auto-Buchung anlegen, ein paralleler Lauf war schneller (eindeutiger Index) → nix tun. */
function einmalig(f: () => void) {
  try {
    f();
  } catch (e) {
    if (!String(e).includes('UNIQUE')) throw e;
  }
}

/** Buchung samt offener Kassenzeile löschen, wenn sie schon gemeldet war: Push „zurückgenommen“. */
async function loeschen(b: Buchung): Promise<void> {
  if (b.kasseId) db.delete(kasse).where(eq(kasse.id, b.kasseId)).run();
  db.delete(strafen).where(eq(strafen.id, b.id)).run();
  if (b.benachrichtigt) await pushAn([b.memberId], 'Strafe zurückgenommen', `„${b.name}“ ist wieder weg.`, '/kasse');
}

/** Ist die Buchung schon bezahlt (dann bleibt sie, wie sie ist)? */
function beglichen(b: Buchung): boolean {
  if (!b.kasseId) return false;
  return db.select().from(kasse).where(eq(kasse.id, b.kasseId)).get()?.status === 'beglichen';
}

/** Push + Mail für eine Buchung, danach als benachrichtigt markieren. */
async function melden(b: Buchung, opfer: Mitglied, von: string | null): Promise<void> {
  db.update(strafen).set({ benachrichtigt: true }).where(eq(strafen.id, b.id)).run();
  const wpAbzug = b.wp != null ? Math.max(0, -b.wp) : 0;
  const folge = folgeWort(b.betragCents, wpAbzug);
  const paypal = tenantConfig().istGruender;
  const text = `${von ? `${von} hat dir` : 'Die App hat dir'} „${b.name}“ gebucht: ${folge}.${b.betragCents > 0 ? ' Zahlen beim Kassenwart.' : ''}`;
  const mail = mailStrafe(mailRahmen(), { name: rufname(opfer), von, strafe: b.name, folge, zahlen: b.betragCents > 0, paypal });
  await Promise.allSettled([
    pushAn([opfer.id], 'Strafe gebucht', text, '/kasse'),
    willMail(opfer, 'kasse') ? mailAn([opfer.email], mail.betreff, mail.inhalt) : Promise.resolve(),
  ]);
}

/**
 * Feste Strafen eines Abends (neu) buchen: unentschuldigt für alle, die
 * gefehlt und nicht rechtzeitig abgesagt haben, und nach dem Abschluss
 * die Serien-Strafe beim 3. Mal in Folge. Upsert über (termin, art, member):
 * vorhandene bleiben, weggefallene offene werden gelöscht, beglichene und
 * erlassene nie angefasst. Benachrichtigt wird erst nach dem Abschluss.
 */
export async function abendStrafenBuchen(terminId: string): Promise<void> {
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin || termin.datum < STRAFEN_KATALOG_AB) return;
  const regeln = katalog();
  const regelU = festeRegel('unentschuldigt', regeln);
  const regelE = festeRegel('entschuldigt', regeln);
  const regelS = festeRegel('serie', regeln);

  const besuchVon = new Map(db.select().from(besuche).where(eq(besuche.terminId, terminId)).all().map((b) => [b.memberId, b]));
  const voteVon = new Map(db.select().from(votes).where(eq(votes.terminId, terminId)).all().map((v) => [v.memberId, v]));
  const vorhanden = db.select().from(strafen).where(eq(strafen.terminId, terminId)).all().filter((b) => b.art !== 'eigene');
  const mitglieder = getAktiveMitglieder();
  const jobs: Promise<void>[] = [];

  // ── Unentschuldigt (immer gebucht, friert den Status ein) und entschuldigt (nur wenn's Geld kostet) ──
  const soll = new Set<string>();
  const entschuldigtSoll = new Set<string>();
  for (const m of mitglieder) {
    const besuch = besuchVon.get(m.id);
    if (besuch?.anwesend) continue;
    if (!besuch && m.createdAt.slice(0, 10) > termin.datum) continue; // erst danach dazugekommen
    if (fehltUnentschuldigt(voteVon.get(m.id), termin, regelU)) soll.add(m.id);
    else if (regelE?.aktiv && regelE.betragCents > 0) entschuldigtSoll.add(m.id);
  }
  for (const b of vorhanden.filter((x) => x.art === 'entschuldigt')) {
    if (entschuldigtSoll.has(b.memberId)) entschuldigtSoll.delete(b.memberId);
    else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
  }
  for (const memberId of entschuldigtSoll) einmalig(() => anlegen({ regel: regelE!, memberId, terminId, wp: null, gebuchtVon: null }));
  for (const b of vorhanden.filter((x) => x.art === 'unentschuldigt')) {
    if (soll.has(b.memberId)) soll.delete(b.memberId);
    else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
  }
  for (const memberId of soll) einmalig(() => anlegen({ regel: regelU!, memberId, terminId, wp: null, gebuchtVon: null }));

  // ── 3× unentschuldigt in Folge (erst wenn der Abend zu ist, sonst stimmt die Serie noch nicht) ──
  if (termin.phase === 'abgeschlossen') {
    const serieSoll = new Set<string>();
    if (regelS?.aktiv) {
      const unentschuldigtHeute = new Set(
        db.select().from(strafen).where(and(eq(strafen.terminId, terminId), eq(strafen.art, 'unentschuldigt'), eq(strafen.status, 'offen'))).all().map((b) => b.memberId),
      );
      for (const s of getStats()) {
        if (s.unentschuldigtStreak === WACKELT_AB_UNENTSCHULDIGT && unentschuldigtHeute.has(s.member.id)) serieSoll.add(s.member.id);
      }
    }
    for (const b of vorhanden.filter((x) => x.art === 'serie')) {
      if (serieSoll.has(b.memberId)) serieSoll.delete(b.memberId);
      else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
    }
    for (const memberId of serieSoll) einmalig(() => anlegen({ regel: regelS!, memberId, terminId, wp: null, gebuchtVon: null }));

    // Benachrichtigen: nur Buchungen mit Geld (die WP-Abzüge laufen still wie bisher)
    const neu = db.select().from(strafen).where(and(eq(strafen.terminId, terminId), eq(strafen.benachrichtigt, false), eq(strafen.status, 'offen'))).all();
    for (const b of neu) {
      if (b.art === 'eigene' || b.betragCents <= 0) continue;
      const opfer = mitglieder.find((m) => m.id === b.memberId);
      if (opfer) jobs.push(melden(b, opfer, null));
    }
  }
  await Promise.allSettled(jobs);
}

/** Eigene Strafe buchen (Zettel oder Kasse), darf jeder. Der Spezl kriegt sofort Bescheid. */
export async function strafeBuchen(me: Mitglied, memberId: string, regelId: string, terminId: string | null): Promise<{ ok: boolean; meldung: string }> {
  const regel = katalog().find((r) => r.id === regelId);
  if (!regel || regel.art !== 'eigene' || !regel.aktiv) return { ok: false, meldung: 'Diese Strafe gibt’s nicht (mehr).' };
  if (regel.ausloeser) return { ok: false, meldung: 'Die bucht die App von allein.' };
  const opfer = getAktiveMitglieder().find((m) => m.id === memberId);
  if (!opfer) return { ok: false, meldung: 'Den Spezl gibt’s nicht.' };
  if (terminId && !db.select().from(termine).where(eq(termine.id, terminId)).get()) return { ok: false, meldung: 'Den Termin gibt’s nicht.' };
  const wp = regel.wpStaffel[0] ?? 0;
  const b = anlegen({ regel, memberId, terminId, wp: wp || null, gebuchtVon: me.id });
  await melden(b, opfer, anzeigeName(me));
  return { ok: true, meldung: `${anzeigeName(opfer)}: ${regel.name}, ${folgeWort(regel.betragCents, Math.max(0, -wp))}.` };
}

/** Darf `me` diese Buchung zurücknehmen? Wer gebucht hat, Präsident, Admin; solange der Abend offen bzw. die Forderung offen ist. */
export function darfZuruecknehmen(me: Mitglied, b: Buchung): boolean {
  if (b.art !== 'eigene' || b.status !== 'offen' || beglichen(b)) return false;
  if (b.terminId) {
    const t = db.select().from(termine).where(eq(termine.id, b.terminId)).get();
    if (t?.phase === 'abgeschlossen') return false;
  }
  return b.gebuchtVon === me.id || me.role === 'admin' || me.id === getPraesidentId();
}

export async function strafeZuruecknehmen(me: Mitglied, strafeId: string): Promise<boolean> {
  const b = db.select().from(strafen).where(eq(strafen.id, strafeId)).get();
  if (!b || !darfZuruecknehmen(me, b)) return false;
  await loeschen(b);
  return true;
}

/**
 * Darf `me` erlassen? Admin immer. Präsident nur, wenn die Regel erlassbar
 * ist und es nicht seine eigene Strafe ist. Bezahlte Strafen erst zurück auf offen.
 */
export function darfErlassen(me: Mitglied, b: Pick<Buchung, 'regelId' | 'memberId' | 'status' | 'kasseId'> & { id?: string }): boolean {
  if (b.status !== 'offen') return false;
  if (b.kasseId && db.select().from(kasse).where(eq(kasse.id, b.kasseId)).get()?.status !== 'offen') return false;
  if (me.role === 'admin') return true;
  if (me.id !== getPraesidentId() || b.memberId === me.id) return false;
  const regel = b.regelId ? katalog().find((r) => r.id === b.regelId) : null;
  return regel ? regel.erlassbar : true;
}

/** Erlassen: WP und € zurück. Bei „unentschuldigt“ zählt das Fehlen danach als entschuldigt. */
export async function strafeErlassen(me: Mitglied, strafeId: string): Promise<boolean> {
  const b = db.select().from(strafen).where(eq(strafen.id, strafeId)).get();
  if (!b || !darfErlassen(me, b)) return false;
  // Vermerk, wer erlassen hat (WIR-009)
  const gericht = { gerichtetVon: me.id, gerichtetAm: nowIso() };
  db.update(strafen).set({ status: 'erlassen', ...gericht }).where(eq(strafen.id, b.id)).run();
  if (b.kasseId) db.update(kasse).set({ status: 'aufgehoben', ...gericht }).where(eq(kasse.id, b.kasseId)).run();
  // Ohne das Unentschuldigt fällt evtl. die Serien-Strafe weg
  if (b.terminId && b.art === 'unentschuldigt') await abendStrafenBuchen(b.terminId);
  // Wer von der Strafe nix wusste (stiller WP-Abzug, Abend no offen), kriegt auch koa Push
  if (b.memberId !== me.id && (b.benachrichtigt || abendZu(b.terminId))) {
    await pushAn([b.memberId], '👑 Strafe erlassen', `${anzeigeName(me)} hat dir „${b.name}“ erlassen.`, '/kasse');
  }
  return true;
}

/** Abend abgeschlossen (oder Strafe ohne Abend)? */
function abendZu(terminId: string | null): boolean {
  if (!terminId) return true;
  return db.select().from(termine).where(eq(termine.id, terminId)).get()?.phase === 'abgeschlossen';
}

/** Alte Forderung ohne Katalog-Buchung erlassen (Präsident oder Admin), mit Vermerk und Push. */
export async function forderungErlassen(me: Mitglied, kasseId: string): Promise<boolean> {
  if (me.role !== 'admin' && me.id !== getPraesidentId()) return false;
  const k = db.select().from(kasse).where(eq(kasse.id, kasseId)).get();
  if (!k || k.kind !== 'strafe' || k.status !== 'offen') return false;
  if (buchungZurKasse(kasseId)) return false;
  if (k.memberId === me.id && me.role !== 'admin') return false;
  db.update(kasse).set({ status: 'aufgehoben', gerichtetVon: me.id, gerichtetAm: nowIso() }).where(eq(kasse.id, kasseId)).run();
  if (k.memberId && k.memberId !== me.id) await pushAn([k.memberId], '👑 Strafe erlassen', `${anzeigeName(me)} hat dir „${k.grund}“ erlassen.`, '/kasse');
  return true;
}

/**
 * Präsident richtet (WIR-009): alle offenen Strafen, je mit Entscheidung.
 * `bleibt` = schon gerichtet (bleibt bestehen), `darfRichten` = Knöpfe für `me`.
 */
export type RichtPosten = {
  typ: 'buchung' | 'kasse';
  id: string;
  memberId: string;
  grund: string;
  folge: string;
  cents: number;
  datum: string;
  bleibtVon: string | null;
  darfRichten: boolean;
};

export function offenePosten(me: Mitglied): RichtPosten[] {
  const mitglieder = getAktiveMitglieder();
  const name = (id: string | null) => { const m = id ? mitglieder.find((x) => x.id === id) : null; return m ? anzeigeName(m) : id ? '?' : null; };
  const posten: RichtPosten[] = [];
  const mitBuchung = new Set<string>();
  for (const b of db.select().from(strafen).where(eq(strafen.status, 'offen')).all()) {
    if (b.kasseId) mitBuchung.add(b.kasseId);
    if (beglichen(b) || !(b.benachrichtigt || abendZu(b.terminId))) continue;
    const wp = b.wp != null ? Math.max(0, -b.wp) : 0;
    if (b.betragCents <= 0 && wp <= 0) continue;
    const ort = wirtshausVon(b.terminId);
    posten.push({
      typ: 'buchung', id: b.id, memberId: b.memberId, grund: ort ? `${b.name} im ${ort}` : b.name, folge: folgeWort(b.betragCents, wp),
      cents: b.betragCents, datum: b.createdAt, bleibtVon: b.gerichtetVon ? name(b.gerichtetVon) : null, darfRichten: darfErlassen(me, b),
    });
  }
  const istRichter = me.role === 'admin' || me.id === getPraesidentId();
  for (const k of db.select().from(kasse).where(and(eq(kasse.kind, 'strafe'), eq(kasse.status, 'offen'))).all()) {
    if (mitBuchung.has(k.id) || !k.memberId) continue;
    const cents = Math.abs(k.betragCents);
    posten.push({
      typ: 'kasse', id: k.id, memberId: k.memberId, grund: k.grund, folge: folgeWort(cents, 0),
      cents, datum: k.createdAt, bleibtVon: k.gerichtetVon ? name(k.gerichtetVon) : null,
      darfRichten: istRichter && (k.memberId !== me.id || me.role === 'admin'),
    });
  }
  return posten.filter((p) => mitglieder.some((m) => m.id === p.memberId)).sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Präsident richtet: erlassen (WP und € zurück) oder bleibt (Vermerk, Spezl kriegt Bescheid). */
export async function richten(me: Mitglied, typ: 'buchung' | 'kasse', id: string, urteil: 'erlassen' | 'bleibt'): Promise<{ ok: boolean; meldung: string }> {
  const posten = offenePosten(me).find((p) => p.typ === typ && p.id === id);
  if (!posten || !posten.darfRichten) return { ok: false, meldung: 'Da darfst du nicht richten.' };
  const opfer = getAktiveMitglieder().find((m) => m.id === posten.memberId);
  const wer = opfer ? anzeigeName(opfer) : 'Der Spezl';
  if (urteil === 'erlassen') {
    const ok = typ === 'buchung' ? await strafeErlassen(me, id) : await forderungErlassen(me, id);
    return ok ? { ok: true, meldung: `${wer} ist „${posten.grund}“ los.` } : { ok: false, meldung: 'Erlassen hat nicht geklappt.' };
  }
  const gericht = { gerichtetVon: me.id, gerichtetAm: nowIso() };
  if (typ === 'buchung') {
    const b = db.select().from(strafen).where(eq(strafen.id, id)).get()!;
    db.update(strafen).set(gericht).where(eq(strafen.id, id)).run();
    if (b.kasseId) db.update(kasse).set(gericht).where(eq(kasse.id, b.kasseId)).run();
  } else {
    db.update(kasse).set(gericht).where(eq(kasse.id, id)).run();
  }
  if (posten.memberId !== me.id) {
    await pushAn([posten.memberId], '👑 Strafe bleibt', `${anzeigeName(me)} hat gerichtet: „${posten.grund}“ bleibt, ${posten.folge}.${posten.cents > 0 ? ' Zahlen beim Kassenwart.' : ''}`, '/kasse');
  }
  return { ok: true, meldung: `„${posten.grund}“ bleibt bei ${wer}.` };
}

/** Kassenwart erinnert ans Zahlen höchstens einmal am Tag je Spezl. */
const ERINNERN_PAUSE_MS = 20 * 60 * 60 * 1000;

/** Wann der Spezl zuletzt erinnert wurde (über alle offenen Forderungen). */
export function zuletztErinnert(memberId: string): string | null {
  const offen = db.select().from(kasse).where(and(eq(kasse.kind, 'strafe'), eq(kasse.status, 'offen'), eq(kasse.memberId, memberId))).all();
  return offen.map((k) => k.erinnertAm).filter((x): x is string => !!x).sort().pop() ?? null;
}

/**
 * Zahlungsaufforderung (WIR-011): Push plus Mail (wenn „Kasse und Strafen“
 * an ist) mit allen offenen Forderungen, Summe und Kassenwart.
 */
export async function zahlungErinnern(me: Mitglied, memberId: string, kassenwartId: string | null): Promise<{ ok: boolean; meldung: string }> {
  if (me.role !== 'admin' && me.id !== kassenwartId) return { ok: false, meldung: 'Erinnern darf nur der Kassenwart.' };
  const opfer = getAktiveMitglieder().find((m) => m.id === memberId);
  if (!opfer) return { ok: false, meldung: 'Den Spezl gibt’s nicht.' };
  const offen = db.select().from(kasse).where(and(eq(kasse.kind, 'strafe'), eq(kasse.status, 'offen'), eq(kasse.memberId, memberId))).all();
  const summe = offen.reduce((s, k) => s + Math.abs(k.betragCents), 0);
  if (summe <= 0) return { ok: false, meldung: `Bei ${anzeigeName(opfer)} ist nix offen.` };
  const zuletzt = zuletztErinnert(memberId);
  if (zuletzt && Date.now() - Date.parse(zuletzt) < ERINNERN_PAUSE_MS) return { ok: false, meldung: `${anzeigeName(opfer)} wurde heute schon erinnert.` };
  const jetzt = nowIso();
  for (const k of offen) db.update(kasse).set({ erinnertAm: jetzt }).where(eq(kasse.id, k.id)).run();
  const kassenwart = kassenwartId ? getAktiveMitglieder().find((m) => m.id === kassenwartId) ?? null : null;
  const summeText = folgeWort(summe, 0);
  const paypal = tenantConfig().istGruender;
  const mail = mailZahlung(mailRahmen(), {
    name: rufname(opfer),
    kassenwart: kassenwart ? rufname(kassenwart) : null,
    posten: offen.map((k) => [k.grund, folgeWort(Math.abs(k.betragCents), 0)] as [string, string]),
    summe: summeText,
    paypal,
  });
  await Promise.allSettled([
    pushAn([opfer.id], '💶 Bitte zahlen', `Bei dir sind noch ${summeText} offen. Zahlen ${kassenwart ? `bar bei ${anzeigeName(kassenwart)}` : 'beim Kassenwart'}${paypal ? ' oder per PayPal' : ''}.`, '/kasse'),
    willMail(opfer, 'kasse') ? mailAn([opfer.email], mail.betreff, mail.inhalt) : Promise.resolve(),
  ]);
  return { ok: true, meldung: `${anzeigeName(opfer)} ist erinnert${willMail(opfer, 'kasse') ? ', per Push und Mail' : ', per Push'}.` };
}

/** Buchung zu einer Kassenzeile (für die Erlassen-Rechte im Kassenbuch). */
export function buchungZurKasse(kasseId: string): Buchung | undefined {
  return db.select().from(strafen).where(eq(strafen.kasseId, kasseId)).get();
}

/** Kassenwart setzt eine Forderung zurück auf offen: eine erlassene Buchung lebt wieder auf. */
export function buchungStatusAusKasse(kasseId: string, status: 'offen' | 'beglichen' | 'aufgehoben') {
  const b = buchungZurKasse(kasseId);
  if (!b) return;
  db.update(strafen).set({ status: status === 'aufgehoben' ? 'erlassen' : 'offen' }).where(eq(strafen.id, b.id)).run();
}

/** Zeitpunkt „bis 24 Uhr am Tag `datum` + `tage`“ (Berliner Zeit) als UTC-Millisekunden. */
function tagesEnde(datum: string, tage: number): number {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage + 1);
  return berlinNachUtc(d.toISOString().slice(0, 10), '00:00').getTime();
}

/**
 * Automatische eigene Strafen (Julius, 04.11.2026): läuft alle paar Minuten
 * im Hintergrund. Gebucht wird nur, wenn die Frist NACH dem Anlegen bzw.
 * Ändern der Regel abgelaufen ist (nix rückwirkend), je Termin, Regel und
 * Spezl genau einmal.
 */
export async function autoStrafenPruefen(jetztIso = nowIso()): Promise<number> {
  const jetzt = Date.parse(jetztIso);
  const regeln = katalog().filter((r) => r.art === 'eigene' && r.aktiv && r.ausloeser);
  if (regeln.length === 0) return 0;
  const alleTermine = db.select().from(termine).all().filter((t) => t.datum >= STRAFEN_KATALOG_AB);
  const mitglieder = getAktiveMitglieder();
  const neu: Array<{ b: Buchung; opfer: Mitglied }> = [];
  const buchen = (regel: Regel, terminId: string, memberId: string) => {
    const opfer = mitglieder.find((m) => m.id === memberId);
    if (!opfer) return;
    einmalig(() => {
      const wp = regel.wpStaffel[0] ?? 0;
      neu.push({ b: anlegen({ regel, memberId, terminId, wp: wp || null, gebuchtVon: null, auto: true }), opfer });
    });
  };
  const schonGebucht = new Set(db.select().from(strafen).all().filter((b) => b.auto).map((b) => `${b.terminId}:${b.regelId}:${b.memberId}`));

  for (const r of regeln) {
    const ab = Date.parse(r.geaendertAm ?? r.erstelltAm);
    const x = Math.max(0, r.ausloeserWert);
    const faellig = (frist: number) => jetzt >= frist && frist >= ab;
    for (const t of alleTermine) {
      const offen = (memberId: string) => !schonGebucht.has(`${t.id}:${r.id}:${memberId}`);
      if (r.ausloeser === 'reservierung') {
        // „bis x Tage vorher reserviert“: Frist = 24 Uhr, x Tage vor dem Termin
        if (t.phase === 'planung' && t.planerId && faellig(tagesEnde(t.datum, -x)) && offen(t.planerId)) buchen(r, t.id, t.planerId);
      } else if (r.ausloeser === 'abstimmen') {
        if (t.phase === 'abgeschlossen' || !faellig(tagesEnde(t.datum, -x))) continue;
        const gestimmt = new Set(db.select().from(votes).where(eq(votes.terminId, t.id)).all().filter((v) => v.wert !== 'vielleicht').map((v) => v.memberId));
        for (const m of mitglieder) if (!gestimmt.has(m.id) && m.createdAt.slice(0, 10) <= t.datum && offen(m.id)) buchen(r, t.id, m.id);
      } else if (r.ausloeser === 'bewertung') {
        if (t.phase !== 'abgeschlossen' || !faellig(tagesEnde(t.datum, x))) continue;
        for (const b of db.select().from(besuche).where(eq(besuche.terminId, t.id)).all()) {
          const bewertet = b.sterne != null || !!b.kommentar?.trim() || b.kaiserSterne != null || b.brodnSterne != null;
          if (b.anwesend && !bewertet && offen(b.memberId)) buchen(r, t.id, b.memberId);
        }
      } else if (r.ausloeser === 'orga_flop') {
        if (t.phase !== 'abgeschlossen' || !t.planerId || !t.abgeschlossenAm) continue;
        if (!faellig(Date.parse(t.abgeschlossenAm) + 7 * 86_400_000)) continue;
        const sterne = db.select().from(besuche).where(eq(besuche.terminId, t.id)).all().filter((b) => b.anwesend && b.sterne != null).map((b) => b.sterne!);
        if (sterne.length < 2) continue;
        const schnitt = sterne.reduce((a, b) => a + b, 0) / sterne.length;
        if (schnitt < x && offen(t.planerId)) buchen(r, t.id, t.planerId);
      }
    }
  }
  await Promise.allSettled(neu.map(({ b, opfer }) => melden(b, opfer, null)));
  return neu.length;
}
