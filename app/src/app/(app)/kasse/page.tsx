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
import { strafeBuchenAction, forderungStatus, einzahlung, spenden, auslage, ausgabe, strafeErlassenFormular, strafeZuruecknehmenFormular, richtenAction, zahlungErinnernAction } from './actions';
import { katalog, folgeWort } from '@/lib/strafen-regeln';
import { buchungZurKasse, darfErlassen as darfStrafeErlassen, darfZuruecknehmen, offenePosten, zuletztErinnert } from '@/lib/strafen';

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

  return (
    <div className="wn-eintritt wn-zwei wn-breit" style={{ padding: 'calc(16px + var(--wn-oben)) 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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

      {/* Nur breit: alles Offene auf einen Blick und der Strafenkatalog */}
      {!zeigtOffenKarte && (
      <section className="wn-nur-breit" style={{ order: 4, ...karteBreit }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={breitTitel}>Offen</h2>
          <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{offene.length}</span>
        </div>
        {offene.length === 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Nix offen, alles beglichen.</span>}
        {offene.map(({ eintrag, member }, i) => (
          <div key={eintrag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--ink-50)' : 'none' }}>
            {member ? <Avatar src={member.photoUrl} name={member.name} size={34} verein={member.verein} /> : null}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member ? (member.id === me.id ? 'Du' : vorname(anzeigeName(member))) : 'Vereinskasse'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eintrag.grund}</span>
            </span>
            <span className="wn-tnum" style={{ flex: 'none', fontSize: 14, fontWeight: 800, color: 'var(--strafe)' }}>{euro(Math.abs(eintrag.betragCents))}</span>
          </div>
        ))}
      </section>
      )}
      <section className="wn-nur-breit" style={{ order: 5, ...karteBreit }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={breitTitel}>Strafenkatalog</h2>
          <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{regeln.filter((r) => r.aktiv).length}</span>
        </div>
        {regeln.filter((r) => r.aktiv).slice(0, 6).map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? '1px solid var(--ink-50)' : 'none', fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
            <Gavel size={15} weight="fill" color="var(--gold-700)" style={{ flex: 'none' }} />
            <span style={{ minWidth: 0 }}>{r.name} · <span style={{ color: 'var(--ink-500)' }}>{folgeWort(r.betragCents, -(r.wpStaffel[0] ?? 0))}</span></span>
          </div>
        ))}
        <Link href="/stammtisch" className="wn-press" style={{ minHeight: 42, borderRadius: 12, border: '1.5px solid var(--ink-200)', color: 'var(--navy)', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
          Alle Strafen
          <Icon name="chevron" size={15} />
        </Link>
      </section>
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
