import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { getSaldo, getKasseEintraege, getOffeneStrafen, getAktiveMitglieder, getKassenwartId, getPraesidentId } from '@/lib/queries';
import { tenantConfig } from '@/lib/tenant-config';
import { euro, datumMitJahr } from '@/lib/format';
import Link from 'next/link';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { Avatar, Icon, ZeilenKarte } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { KasseAktionen } from '@/components/domain/KasseAktionen';
import { goldKnopfStil, bereichHinweisStil } from '@/components/domain/hero-stil';
import { OffenKarte, type OffenPerson } from '@/components/domain/OffenKarte';
import { strafeBuchenAction, forderungStatus, einzahlung, spenden, auslage, ausgabe, strafeErlassenFormular, strafeZuruecknehmenFormular, richtenAction, zahlungErinnernAction, alleErinnernAction } from './actions';
import { katalog, folgeWort } from '@/lib/strafen-regeln';
import { buchungZurKasse, darfErlassen as darfStrafeErlassen, darfZuruecknehmen, offenePosten, zuletztErinnert } from '@/lib/strafen';
import { aktuelleSaison } from '@/lib/saison';
import { KassenbuchBreit, type KassenbuchZeile, type KassenbuchKnopf } from '@/components/domain/KasseBreit';
import { BellRinging } from '@phosphor-icons/react/dist/ssr/BellRinging';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';

export const metadata = { title: 'Kasse · Wirtschaftln' };

// Der PayPal-Pool gehört dem Gründer-Stammtisch (Env, ned pro Mandant)
const GRUENDER_PAYPAL_URL = process.env.NEXT_PUBLIC_PAYPAL_POOL_URL;

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/** Status-Chip: offen (Bernstein), beglichen (Grün), erlassen (Grau). */
function StatusChip({ status }: { status: 'offen' | 'beglichen' | 'aufgehoben' }) {
  const [bg, fg, text] = status === 'offen' ? ['var(--warnung-bg)', '#B7791F', 'offen'] : status === 'beglichen' ? ['var(--erfolg-bg)', 'var(--erfolg)', 'beglichen'] : ['var(--ink-50)', 'var(--ink-500)', 'erlassen'];
  return <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: bg, color: fg, whiteSpace: 'nowrap', flex: 'none' }}>{text}</span>;
}

/**
 * Kasse (Redesign 14.10.2026): Kassenstand mit Kassenwart und Maßeinheit,
 * eigene offene Forderung, Aktionen als Kacheln mit Sheets, Kassenbuch als
 * Zeilen aus Sicht der Kasse. Ohne Kopfleiste wia Karte und Rang.
 */
export default async function KassePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const saldo = getSaldo();
  // Kassenbuch: alle Geldbewegungen, Strafen mit Geld mittendrin. Strafen, die nur WP kosten, stehen in der Abend-Auswertung auf Hoam.
  const eintraege = getKasseEintraege().map((e) => ({ ...e, buchung: buchungZurKasse(e.eintrag.id) ?? null }));
  const offene = getOffeneStrafen();
  const mitglieder = getAktiveMitglieder();
  const offeneSumme = offene.reduce((sum, o) => sum + Math.abs(o.eintrag.betragCents), 0);
  const kassenwartId = getKassenwartId();
  const kassenwart = mitglieder.find((m) => m.id === kassenwartId) ?? null;
  // Rollen: der Kassenwart wahrt d'Kasse (buchen, eintreiben), der Präsident erlässt Schulden
  const darfKasse = me.role === 'admin' || me.id === kassenwartId;
  // Präsident und Admin: Strafenkatalog pflegen und erlassen (bei Katalog-Strafen nach dessen Regeln)
  const darfErlassen = me.role === 'admin' || me.id === getPraesidentId();
  const regeln = katalog();
  const erlassbarIm = (kasseId: string) => {
    const b = buchungZurKasse(kasseId);
    return b ? darfStrafeErlassen(me, b) : darfErlassen;
  };
  const config = tenantConfig();
  const paypal = config.istGruender ? GRUENDER_PAYPAL_URL : undefined;
  const meineOffenen = offene.filter((o) => o.eintrag.memberId === me.id);
  const meineSumme = meineOffenen.reduce((sum, o) => sum + Math.abs(o.eintrag.betragCents), 0);
  const nameVon = (id: string | null) => { const m = id ? mitglieder.find((x) => x.id === id) : null; return m ? vorname(anzeigeName(m)) : null; };
  const kassenwartName = kassenwart ? vorname(anzeigeName(kassenwart)) : null;
  // Präsident richtet, Kassenwart erinnert ans Zahlen (WIR-009, WIR-011): offene Strafen je Spezl
  const zeigtOffenKarte = darfKasse || darfErlassen;
  const posten = zeigtOffenKarte ? offenePosten(me) : [];
  const personen: OffenPerson[] = mitglieder
    .map((m) => {
      const eigene = posten.filter((p) => p.memberId === m.id);
      const zuletzt = zuletztErinnert(m.id);
      return {
        spezl: { id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein },
        posten: eigene.map(({ memberId: _m, ...p }) => p),
        summeCents: eigene.reduce((s, p) => s + p.cents, 0),
        heuteErinnert: !!zuletzt && Date.now() - Date.parse(zuletzt) < 20 * 60 * 60 * 1000,
      };
    })
    .filter((p) => p.posten.length > 0)
    .sort((a, b) => b.summeCents - a.summeCents);

  /* ---------- Ab Tablet (Responsive Redesign 4a/4b): Saison-Verlauf, Kassenbuch-Zeilen, Offenes ---------- */
  const saison = aktuelleSaison();
  const tagVon = (e: (typeof eintraege)[number]) => (e.termin?.datum ?? e.eintrag.createdAt).slice(0, 10);
  // Aus Sicht der Kasse wia getSaldo: Forderungen zählen plus (auch offene), Erlassenes gar ned
  const kassenCents = (e: (typeof eintraege)[number]) => (e.eintrag.status === 'aufgehoben' ? 0 : e.eintrag.kind === 'strafe' ? Math.abs(e.eintrag.betragCents) : e.eintrag.betragCents);
  const heuteTag = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const heuerMonat = heuteTag.slice(0, 7);
  // Kassenstand am Ende jedes Saison-Monats (höchstens 6 Balken)
  const monate: { key: string; label: string; stand: number }[] = [];
  {
    let [jahr, monat] = saison.start.split('-').map(Number);
    while (monate.length < 6) {
      const key = `${jahr}-${String(monat).padStart(2, '0')}`;
      if (key > heuerMonat) break;
      monate.push({
        key,
        label: new Date(`${key}-01T12:00:00`).toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''),
        stand: eintraege.filter((e) => tagVon(e) <= `${key}-31`).reduce((s, e) => s + kassenCents(e), 0),
      });
      monat += 1;
      if (monat > 12) { monat = 1; jahr += 1; }
    }
  }
  const maxStand = Math.max(1, ...monate.map((m) => m.stand));
  const monatDelta = eintraege.filter((e) => tagVon(e).startsWith(heuerMonat)).reduce((s, e) => s + kassenCents(e), 0);
  const monatName = new Date().toLocaleDateString('de-DE', { month: 'long', timeZone: 'Europe/Berlin' });
  // Rein und raus in dieser Saison
  const inSaison = eintraege.filter((e) => tagVon(e) >= saison.start && e.eintrag.status !== 'aufgehoben');
  const summe = (f: (e: (typeof eintraege)[number]) => boolean) => inSaison.filter(f).reduce((s, e) => s + Math.abs(e.eintrag.betragCents), 0);
  const reinStrafen = summe((e) => e.eintrag.kind === 'strafe');
  const reinSpenden = summe((e) => e.eintrag.kind === 'einzahlung' && e.eintrag.grund.startsWith('Spende'));
  const reinEinzahlungen = summe((e) => e.eintrag.kind === 'einzahlung' && !e.eintrag.grund.startsWith('Spende'));
  const rausAusgaben = summe((e) => e.eintrag.kind === 'ausgabe' && !e.member);
  const rausAuslagen = summe((e) => e.eintrag.kind === 'ausgabe' && !!e.member);
  const vz = (cents: number) => (cents < 0 ? `−${euro(Math.abs(cents))}` : `+${euro(Math.abs(cents))}`);
  // Kassenbuch-Zeilen fürs breite Kassenbuch, Knöpfe nach Rolle wia am Handy
  const buchZeilen: KassenbuchZeile[] = eintraege.map((e) => {
    const { eintrag, member, melder, buchung } = e;
    const istForderung = eintrag.kind === 'strafe';
    const erlassen = eintrag.status === 'aufgehoben';
    const darfWeg = !!buchung && darfZuruecknehmen(me, buchung);
    const darfErl = buchung ? darfStrafeErlassen(me, buchung) : darfErlassen && erlassbarIm(eintrag.id);
    const knoepfe: KassenbuchKnopf[] = [];
    if (istForderung && !erlassen) {
      if (darfKasse && eintrag.status === 'offen') knoepfe.push({ art: 'beglichen', id: eintrag.id });
      if (darfKasse && eintrag.status === 'beglichen') knoepfe.push({ art: 'offen', id: eintrag.id });
      if (darfErl && eintrag.status === 'offen') knoepfe.push(buchung ? { art: 'erlassen', id: buchung.id } : { art: 'aufgehoben', id: eintrag.id });
      if (darfWeg && buchung) knoepfe.push({ art: 'zuruecknehmen', id: buchung.id });
    }
    const wer = member ? (member.id === me.id ? 'Du' : vorname(anzeigeName(member))) : 'Vereinskasse';
    const von = melder && melder.id !== eintrag.memberId ? ` · gebucht von ${vorname(anzeigeName(melder))}` : istForderung && !melder ? ' · von der App' : '';
    return {
      id: eintrag.id,
      art: istForderung ? 'strafe' : eintrag.kind === 'ausgabe' ? (member ? 'auslage' : 'ausgabe') : eintrag.grund.startsWith('Spende') ? 'spende' : 'einzahlung',
      titel: eintrag.grund,
      person: `${wer}${von}`,
      datum: tagVon(e),
      cents: istForderung ? Math.abs(eintrag.betragCents) : eintrag.betragCents,
      status: istForderung ? eintrag.status : null,
      vermerk: istForderung && erlassen
        ? (eintrag.gerichtetVon ? `erlassen von ${nameVon(eintrag.gerichtetVon) ?? '?'}` : 'erlassen')
        : istForderung && eintrag.status === 'offen' && eintrag.gerichtetVon
          ? `bleibt, gerichtet von ${nameVon(eintrag.gerichtetVon) ?? '?'}`
          : null,
      knoepfe,
    };
  });
  // Nach Tag sortiert (Termin-Datum vor Buchungstag), sonst springen die Monatsgruppen
  buchZeilen.sort((a, b) => b.datum.localeCompare(a.datum));
  const offeneSortiert = [...offene].sort((a, b) => (a.eintrag.createdAt < b.eintrag.createdAt ? 1 : -1));
  const aktiveRegeln = regeln.filter((r) => r.aktiv);
  const kasseAktionenProps = {
    mitglieder: mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein })),
    meId: me.id,
    regeln: regeln.filter((r) => r.art === 'eigene' && r.aktiv && !r.ausloeser).map((r) => ({ id: r.id, name: r.name, detail: r.detail, folge: folgeWort(r.betragCents, -(r.wpStaffel[0] ?? 0)) })),
    darfKasse,
    darfKatalog: darfErlassen,
    actions: { strafeBuchen: strafeBuchenAction, spenden, auslage, einzahlung, ausgabe },
  };
  const kartenKopf = (titel: string, rechts: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 24, lineHeight: 1, color: 'var(--navy)' }}>{titel}</h2>
      {rechts}
    </div>
  );
  const outlineKnopf: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' };
  const blauLink: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' };

  return (
    <>
    {/* Am Handy: die Kasse wia bisher (Kasse-Redesign 14.10.2026) */}
    <div className="wn-eintritt wn-nur-handy" style={{ padding: 'calc(16px + var(--wn-oben)) 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Kassenstand (ab Tablet über die ganze Breite) */}
      <div className="wn-zwei-voll" style={{ borderRadius: 22, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', border: '1.5px solid var(--gold)', overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Kassenstand</span>
          <span className="wn-tnum" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--gold-bright)' }}>{euro(saldo)}</span>
          {offene.length > 0 && (
            <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.8)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Icon name="hourglass" size={15} style={{ flex: 'none', marginTop: 1 }} />
              <span>noch einzutreiben: {offene.length} {offene.length === 1 ? 'Forderung' : 'Forderungen'} · <span style={{ whiteSpace: 'nowrap' }}>{euro(offeneSumme)}</span></span>
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(208,173,102,0.3)' }}>
            {kassenwart ? (
              <>
                <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: '0 0 0 2px var(--gold)', flex: 'none' }}>
                  <Avatar src={kassenwart.photoUrl} name={kassenwart.name} size={30} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.9)' }}>{kassenwart.id === me.id ? 'Du wahrst die Kasse' : `${kassenwartName} wahrt die Kasse`}</span>
              </>
            ) : (
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.7)' }}>Noch kein Kassenwart gewählt</span>
            )}
          </div>
        </div>
      </div>

      {/* Ab Tablet: links das Kassenbuch, rechts Eigenes, Aktionen, Offenes und der Katalog (Responsive 4a) */}
      <div className="wn-spalte wn-spalte--r">
      {/* Eigene offene Forderung oder „sauber“ */}
      <div style={{ order: 1 }}>
      {meineOffenen.length > 0 ? (
        <div style={{ borderRadius: 20, background: 'var(--strafe-bg)', border: '1.5px solid rgba(192,57,43,0.35)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 12, background: 'var(--strafe)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="warning" size={20} stroke={2.2} />
            </span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--strafe)' }}>Du hast {meineOffenen.length} offene {meineOffenen.length === 1 ? 'Forderung' : 'Forderungen'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7A3B33', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meineOffenen[0].eintrag.grund}{meineOffenen[0].eintrag.gemeldetVon ? ` · gebucht von ${nameVon(meineOffenen[0].eintrag.gemeldetVon) ?? '?'}` : ' · von der App'}
                {meineOffenen.length > 1 ? ` · +${meineOffenen.length - 1} weitere` : ''}
              </span>
            </div>
            <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--strafe)', flex: 'none' }}>{euro(meineSumme)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: paypal ? '1fr 1fr' : '1fr', gap: 8 }}>
            {paypal && (
              <a href={paypal} target="_blank" rel="noopener noreferrer" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>PayPal</a>
            )}
            <span style={{ height: 52, borderRadius: 14, border: '1.5px solid rgba(192,57,43,0.35)', background: 'var(--weiss)', color: 'var(--strafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textAlign: 'center', padding: '0 10px' }}>
              {kassenwartName ? `Bar bei ${kassenwartName}` : 'Bar beim Kassenwart'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <Icon name="check-circle" size={24} color="var(--erfolg)" stroke={2.2} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>Du bist sauber, nichts offen.</span>
        </div>
      )}
      </div>

      <div style={{ order: 2 }}>
      <KasseAktionen
        mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein }))}
        meId={me.id}
        regeln={regeln.filter((r) => r.art === 'eigene' && r.aktiv && !r.ausloeser).map((r) => ({ id: r.id, name: r.name, detail: r.detail, folge: folgeWort(r.betragCents, -(r.wpStaffel[0] ?? 0)) }))}
        darfKasse={darfKasse}
        darfKatalog={darfErlassen}
        actions={{ strafeBuchen: strafeBuchenAction, spenden, auslage, einzahlung, ausgabe }}
      />
      </div>

      {/* Präsident und Kassenwart: Offenes je Spezl, richten und erinnern (auch am Handy) */}
      {zeigtOffenKarte && (
        <div style={{ order: 2 }}>
          <OffenKarte
            personen={personen}
            meId={me.id}
            darfRichten={darfErlassen}
            darfErinnern={darfKasse}
            actions={{ richten: richtenAction, erinnern: zahlungErinnernAction }}
          />
        </div>
      )}

      </div>

      <div className="wn-spalte wn-spalte--l">
      {/* Kassenbuch: alles aus Sicht der Kasse */}
      <section style={{ order: 3, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>aus Sicht der Kasse</span>}>Kassenbuch</HoamTitel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 4px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--erfolg-bg)', color: 'var(--erfolg)', whiteSpace: 'nowrap' }}>+ kommt rein</span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--strafe-bg)', color: 'var(--strafe)', whiteSpace: 'nowrap' }}>− geht raus</span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--warnung-bg)', color: '#B7791F', whiteSpace: 'nowrap' }}>offen = noch einzutreiben</span>
        </div>
        <ZeilenKarte>
          {eintraege.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0', textAlign: 'center' }}>
              <Icon name="book-open" size={32} color="var(--ink-200)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-500)' }}>Noch keine Bewegungen, brav seid’s.</span>
            </div>
          )}
          {eintraege.map(({ eintrag, member, melder, termin, wirtshaus, buchung }, i) => {
            const istForderung = eintrag.kind === 'strafe';
            const erlassen = eintrag.status === 'aufgehoben';
            // Kassen-Perspektive: a Forderung is a Plus für d'Kasse, „offen" heißt nur, da Kassenwart hat's no ned kassiert
            const anzeigeCents = istForderung ? Math.abs(eintrag.betragCents) : eintrag.betragCents;
            const darfWeg = !!buchung && darfZuruecknehmen(me, buchung);
            const darfErl = buchung ? darfStrafeErlassen(me, buchung) : darfErlassen && erlassbarIm(eintrag.id);
            const betragFarbe = erlassen ? 'var(--ink-300)' : istForderung ? (eintrag.status === 'beglichen' ? 'var(--erfolg)' : '#B7791F') : anzeigeCents < 0 ? 'var(--strafe)' : 'var(--erfolg)';
            const meta = [
              datumMitJahr((termin?.datum ?? eintrag.createdAt).slice(0, 10)).replace(/ \d{4}$/, ''),
              wirtshaus?.name ?? null,
              istForderung
                ? (melder ? `gebucht von ${vorname(anzeigeName(melder))}` : 'von der App')
                : eintrag.kind === 'ausgabe' && member
                  ? 'Auslage'
                  : melder && melder.id !== eintrag.memberId
                    ? `gebucht von ${vorname(anzeigeName(melder))}`
                    : null,
            ].filter(Boolean);
            return (
              <div key={eintrag.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < eintraege.length - 1 ? '1px solid var(--ink-50)' : 'none', opacity: erlassen ? 0.6 : 1 }}>
                {member ? (
                  <Avatar src={member.photoUrl} name={member.name} size={38} verein={member.verein} />
                ) : (
                  <span style={{ width: 38, height: 38, flex: 'none', borderRadius: '50%', background: 'var(--ink-50)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="bank" size={18} />
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {member ? (member.id === me.id ? 'Du' : vorname(anzeigeName(member))) : 'Vereinskasse'}
                    </span>
                    {/* Strafen auf einen Blick (Julius, 04.11.2026) */}
                    {istForderung && <span style={{ flex: 'none', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: 'var(--strafe-bg)', color: 'var(--strafe)' }}>Strafe</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eintrag.grund}</span>
                  <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.join(' · ')}</span>
                  {istForderung && erlassen && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-700)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="crown" size={12} stroke={2.4} />
                      {eintrag.gerichtetVon ? `erlassen von ${nameVon(eintrag.gerichtetVon) ?? '?'}` : 'erlassen'}
                    </span>
                  )}
                  {istForderung && eintrag.status === 'offen' && eintrag.gerichtetVon && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-700)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="crown" size={12} stroke={2.4} />
                      bleibt, gerichtet von {nameVon(eintrag.gerichtetVon) ?? '?'}
                    </span>
                  )}
                  {istForderung && !erlassen && (darfKasse || darfErl || darfWeg) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {darfKasse && eintrag.status === 'offen' && <StatusKnopf id={eintrag.id} status="beglichen" label="✓ beglichen" farbe="var(--erfolg)" />}
                      {darfKasse && eintrag.status === 'beglichen' && <StatusKnopf id={eintrag.id} status="offen" label="wieder offen" farbe="#B7791F" />}
                      {darfErl && eintrag.status === 'offen' && (buchung ? <KleinKnopf action={strafeErlassenFormular.bind(null, buchung.id)} label="Erlassen" farbe="var(--gold-700)" /> : <StatusKnopf id={eintrag.id} status="aufgehoben" label="Erlassen" farbe="var(--gold-700)" />)}
                      {darfWeg && buchung && <KleinKnopf action={strafeZuruecknehmenFormular.bind(null, buchung.id)} label="Zurücknehmen" farbe="var(--ink-500)" />}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flex: 'none' }}>
                  <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: betragFarbe, textDecoration: erlassen ? 'line-through' : undefined, whiteSpace: 'nowrap' }}>
                    {anzeigeCents > 0 ? '+' : ''}{euro(anzeigeCents).replace('-', '−')}
                  </span>
                  {istForderung && <StatusChip status={eintrag.status} />}
                </div>
              </div>
            );
          })}
        </ZeilenKarte>
      </section>
      </div>
    </div>

    {/* Ab Tablet (Responsive Redesign 4a/4b, 12.11.2026): links Kassenstand und Saison,
        in der Mitte das Kassenbuch mit Filtern, rechts Offenes und der Strafenkatalog */}
    <div className="wn-eintritt wn-breit wn-nur-breit wn-kasse-breit">
      <div className="wn-kasse-links">
        {/* Kassenstand (4a): Navy mit Goldrand, Kassenwart oben rechts, Melden und Spenden */}
        <div style={{ borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', boxShadow: '0 14px 36px rgba(12,43,90,0.2)' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
          <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Kassenstand</span>
              {kassenwart ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.85)' }}>
                  <Avatar src={kassenwart.photoUrl} name={kassenwart.name} size={22} verein={kassenwart.verein} />
                  {kassenwart.id === me.id ? 'Du wahrst die Kasse' : kassenwartName}
                </span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.6)' }}>Kein Kassenwart gewählt</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="wn-tnum" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--gold-bright)' }}>{euro(saldo)}</span>
              <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.8)' }}>
                Stand heute · <span style={{ color: monatDelta < 0 ? '#F4A09A' : '#9FE2B8' }}>{vz(monatDelta)} im {monatName}</span>
              </span>
              {offene.length > 0 && (
                <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="hourglass" size={14} style={{ flex: 'none' }} />
                  noch einzutreiben: {offene.length} {offene.length === 1 ? 'Forderung' : 'Forderungen'} · {euro(offeneSumme)}
                </span>
              )}
            </div>
            <KasseAktionen {...kasseAktionenProps} variante="knoepfe" />
          </div>
        </div>

        {/* Saison (4a): Kassenstand je Monat, rein und raus, der eigene Stand */}
        <section style={{ ...karteBreit, padding: '18px 20px', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ ...breitTitel, fontSize: 24 }}>{saison.label.replace(/^Saison \d+ · /, '')}</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>Kassenstand je Monat</span>
          </div>
          <div role="img" aria-label={`Kassenstand je Monat: ${monate.map((m) => `${m.label} ${euro(m.stand)}`).join(', ')}`} style={{ display: 'flex', gap: 8, height: 160, alignItems: 'flex-end' }}>
            {monate.map((m, i) => {
              const letzter = i === monate.length - 1;
              return (
                <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, justifyContent: 'flex-end', height: '100%' }}>
                  <span className="wn-tnum" style={{ fontSize: 10, fontWeight: 800, color: letzter ? 'var(--navy)' : 'var(--ink-500)' }}>{(m.stand / 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })}</span>
                  <div style={{ width: '100%', maxWidth: 34, height: Math.max(4, Math.round((Math.max(0, m.stand) / maxStand) * 110)), borderRadius: '8px 8px 3px 3px', background: letzter ? 'var(--grad-gold)' : 'var(--ink-100)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: letzter ? 'var(--navy)' : 'var(--ink-500)' }}>{m.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { titel: 'Rein', summe: reinStrafen + reinSpenden + reinEinzahlungen, farbe: 'var(--erfolg)', zeilen: [['Strafen', reinStrafen], ['Spenden', reinSpenden], ['Einzahlungen', reinEinzahlungen]] as [string, number][] },
              { titel: 'Raus', summe: -(rausAusgaben + rausAuslagen), farbe: 'var(--strafe)', zeilen: [['Ausgaben', rausAusgaben], ['Auslagen', rausAuslagen]] as [string, number][] },
            ].map((k) => (
              <div key={k.titel} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 14, background: 'var(--ink-50)' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{k.titel}</span>
                <span className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: k.farbe }}>{k.titel === 'Raus' ? `−${euro(Math.abs(k.summe))}` : vz(k.summe)}</span>
                {k.zeilen.filter(([, c]) => c > 0).map(([name, c]) => (
                  <div key={name} className="wn-tnum" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
                    <span>{name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--ink-700)' }}>{euro(c)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {meineOffenen.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--strafe-bg)' }}>
              <Icon name="warning" size={20} color="var(--strafe)" stroke={2.2} style={{ flex: 'none' }} />
              <span className="wn-tnum" style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
                Du hast {meineOffenen.length === 1 ? 'eine offene Forderung' : `${meineOffenen.length} offene Forderungen`} · {euro(meineSumme)}
              </span>
              {paypal ? (
                <a href={paypal} target="_blank" rel="noopener noreferrer" className="wn-press" style={{ ...goldKnopfStil, minHeight: 34, padding: '0 14px', fontSize: 13, borderRadius: 10 }}>PayPal</a>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)', whiteSpace: 'nowrap' }}>{kassenwartName ? `Bar bei ${kassenwartName}` : 'Bar beim Kassenwart'}</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--erfolg-bg)' }}>
              <Icon name="check-circle" size={20} color="var(--erfolg)" stroke={2.2} style={{ flex: 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--erfolg)' }}>Keine offene Strafe bei dir</span>
            </div>
          )}
        </section>

        <KasseAktionen {...kasseAktionenProps} variante="weitere" />
      </div>

      <div className="wn-kasse-mitte">
        <KassenbuchBreit zeilen={buchZeilen} actions={{ status: forderungStatus, erlassen: strafeErlassenFormular, zuruecknehmen: strafeZuruecknehmenFormular }} />
      </div>

      <div className="wn-kasse-rechts">
        {/* Offen (4a): je Forderung eine Zeile, Kassenwart hakt ab, Präsident erlässt, unten „Alle erinnern“ */}
        <section style={{ ...karteBreit, padding: '18px 20px 14px', gap: 2 }}>
          {kartenKopf('Offen', offene.length > 0
            ? <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--strafe-bg)', color: 'var(--strafe)' }}>{euro(offeneSumme)}</span>
            : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>nix</span>)}
          {offene.length === 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', padding: '8px 0' }}>Nix offen, alles beglichen.</span>}
          {offeneSortiert.map(({ eintrag, member }) => {
            const buchung = buchungZurKasse(eintrag.id);
            const darfErl = buchung ? darfStrafeErlassen(me, buchung) : darfErlassen;
            return (
              <div key={eintrag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--ink-50)' }}>
                {member ? <Avatar src={member.photoUrl} name={member.name} size={36} verein={member.verein} /> : <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink-50)', flex: 'none' }} />}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member ? (member.id === me.id ? 'Du' : vorname(anzeigeName(member))) : 'Vereinskasse'} <span className="wn-tnum" style={{ color: 'var(--strafe)' }}>· {euro(Math.abs(eintrag.betragCents))}</span>
                  </span>
                  <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eintrag.grund} · seit {datumMitJahr(eintrag.createdAt.slice(0, 10)).replace(/ \d{4}$/, '')}
                  </span>
                </div>
                {darfKasse && (
                  <form action={forderungStatus.bind(null, eintrag.id, 'beglichen')} style={{ flex: 'none' }}>
                    <button type="submit" className="wn-press" style={outlineKnopf}>Beglichen</button>
                  </form>
                )}
                {darfErl && !darfKasse && (
                  <form action={buchung ? strafeErlassenFormular.bind(null, buchung.id) : forderungStatus.bind(null, eintrag.id, 'aufgehoben')} style={{ flex: 'none' }}>
                    <button type="submit" className="wn-press" style={{ ...outlineKnopf, color: 'var(--gold-700)', borderColor: 'var(--gold)' }}>Erlassen</button>
                  </form>
                )}
              </div>
            );
          })}
          {darfKasse && offene.length > 0 && (
            <form action={alleErinnernAction} style={{ paddingTop: 10 }}>
              <button type="submit" className="wn-press" style={blauLink}>
                <BellRinging size={16} weight="bold" />
                Alle erinnern
              </button>
            </form>
          )}
        </section>

        {/* Strafenkatalog (4a) */}
        <section style={{ ...karteBreit, padding: '18px 20px 14px', gap: 0 }}>
          {kartenKopf('Strafenkatalog', <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{aktiveRegeln.length === 1 ? '1 Vergehen' : `${aktiveRegeln.length} Vergehen`}</span>)}
          {aktiveRegeln.slice(0, 6).map((r) => {
            const wp = -(r.wpStaffel[0] ?? 0);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--ink-50)' }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--pergament)', color: 'var(--gold-700)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Gavel size={15} weight="fill" />
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>{r.name}</span>
                  {(r.betragCents > 0 && wp < 0) ? <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>dazu {wp} WP</span> : r.detail ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>{r.detail}</span> : null}
                </div>
                <span className="wn-tnum" style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{r.betragCents > 0 ? euro(r.betragCents) : folgeWort(r.betragCents, wp)}</span>
              </div>
            );
          })}
          <Link href="/stammtisch" style={{ ...blauLink, display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
            Alle Strafen
            <ArrowRight size={16} weight="bold" />
          </Link>
        </section>
      </div>
    </div>
    </>
  );
}

const karteBreit: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 18, display: 'flex', flexDirection: 'column', gap: 6 };
const breitTitel: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 26, lineHeight: 1, color: 'var(--navy)' };

function KleinKnopf({ action, label, farbe }: { action: () => Promise<void>; label: string; farbe: string }) {
  return (
    <form action={action}>
      <button type="submit" className="wn-press" style={{ padding: '5px 10px', borderRadius: 999, border: `1.5px solid ${farbe}`, background: 'transparent', color: farbe, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
        {label}
      </button>
    </form>
  );
}

function StatusKnopf({ id, status, label, farbe }: { id: string; status: 'offen' | 'beglichen' | 'aufgehoben'; label: string; farbe: string }) {
  return (
    <form action={forderungStatus.bind(null, id, status)}>
      <button type="submit" className="wn-press" style={{ padding: '5px 10px', borderRadius: 999, border: `1.5px solid ${farbe}`, background: 'transparent', color: farbe, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
        {label}
      </button>
    </form>
  );
}
