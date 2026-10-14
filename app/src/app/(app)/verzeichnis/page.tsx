import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { HandWaving } from '@phosphor-icons/react/dist/ssr/HandWaving';
import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { LockSimple } from '@phosphor-icons/react/dist/ssr/LockSimple';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { tenantConfig } from '@/lib/tenant-config';
import { verzeichnisUebersicht, stammbaum, offeneAnfragenMitNamen, type StammbaumKnoten } from '@/lib/verzeichnis';
import { datumKurz, datumMitJahr } from '@/lib/format';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { AnfrageKnoepfe } from './knoepfe';
import { chipStil } from './stil';

export const metadata = { title: 'Verzeichnis · Wirtschaftln' };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };


/** Monat kurz mit Jahr („Okt. 2026“) für den Stammbaum. */
function monatJahr(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

/**
 * Verzeichnis (Token-Verzeichnis-Redesign 3a): nur für Admins des Gründer-
 * Stammtischs. Oben die Zahlen, dann offene Token-Anfragen, der Stammbaum
 * (wer wen eingeladen hat) und die Liste aller Stammtische. Aktionen gibt's
 * auf der Detailseite.
 */
export default async function VerzeichnisPage() {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  erzwingeProfil(me);
  if (me.role !== 'admin' || !tenantConfig().istGruender) redirect('/');

  const liste = verzeichnisUebersicht();
  const baum = stammbaum();
  const anfragen = offeneAnfragenMitNamen();
  const aktiv = liste.filter((g) => g.gruppe.status === 'aktiv' && !g.inaktiv).length;
  const mitglieder = liste.reduce((s, g) => s + g.aktiveMitglieder, 0);
  const tokensOffen = liste.reduce((s, g) => s + g.tokensOffen, 0);

  const kachel = (wert: number, label: string, gold = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 6px', borderRadius: 14, background: gold ? 'rgba(230,198,132,0.18)' : 'rgba(255,255,255,0.07)', border: gold ? '1px solid rgba(230,198,132,0.5)' : 'none', alignItems: 'center', textAlign: 'center' }}>
      <span className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: gold ? 'var(--gold-bright)' : 'var(--pergament)' }}>{wert}</span>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.65)' }}>{label}</span>
    </div>
  );

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Kopf: Navy-Karte mit den Zahlen */}
      <div style={{ borderRadius: 24, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', boxShadow: '0 14px 36px rgba(12,43,90,0.22)' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
        <div style={{ padding: '18px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Betreiber</span>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 36, lineHeight: 1, color: 'var(--gold-bright)' }}>Alle Stammtische</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {kachel(liste.length, 'Stammtische')}{kachel(aktiv, 'aktiv')}{kachel(mitglieder, 'Mitglieder')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {kachel(tokensOffen, 'offene Tokens')}{kachel(anfragen.length, 'offene Anfragen', anfragen.length > 0)}
          </div>
        </div>
      </div>

      {/* Offene Anfragen */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>{anfragen.length}</span>}>Offene Anfragen</HoamTitel>
        {anfragen.length === 0 && (
          <div style={{ ...karteStil, padding: 16, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Grad keine. Stammtisch-Admins können im Profil einen weiteren Token anfragen.</div>
        )}
        {anfragen.map(({ anfrage, gruppe, vonName }) => (
          <div key={anfrage.id} style={{ ...karteStil, border: '1.5px solid var(--gold)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: '#FBF1D6', color: '#B7791F', display: 'grid', placeItems: 'center', flex: 'none' }}><HandWaving size={20} weight="fill" /></span>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{gruppe?.name ?? anfrage.gruppeId}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{[vonName, gruppe?.stadt, `seit ${datumKurz(anfrage.createdAt.slice(0, 10))}`].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--ink-700)', padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)' }}>„{anfrage.grund}“</span>
            <AnfrageKnoepfe id={anfrage.id} />
          </div>
        ))}
      </section>

      {/* Stammbaum */}
      {baum && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>wer wen eingeladen hat</span>}>Stammbaum</HoamTitel>
          <div style={{ ...karteStil, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Ast knoten={baum} tiefe={0} letzter />
          </div>
        </section>
      )}

      {/* Liste */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>{liste.length}</span>}>Alle Stammtische</HoamTitel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {liste.map((g) => {
            const gesperrt = g.gruppe.status === 'gesperrt';
            return (
              <Link key={g.gruppe.id} href={`/verzeichnis/${g.gruppe.id}`} className="wn-press" style={{ ...karteStil, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none', color: 'inherit', opacity: gesperrt ? 0.75 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, lineHeight: 1.05, color: 'var(--navy)' }}>{g.gruppe.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
                      {[g.gruppe.stadt, g.gruppe.typ === 'stammhaus' ? 'Stammhaus' : 'wandernd', g.gruppe.istGruender ? (g.gruppe.gruendungsjahr ? `seit ${g.gruppe.gruendungsjahr}` : null) : `seit ${datumMitJahr(g.gruppe.createdAt.slice(0, 10))}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  {gesperrt ? (
                    <span style={chipStil('strafe')}><Prohibit size={13} weight="fill" />gesperrt</span>
                  ) : g.inaktiv && !g.gruppe.istGruender ? (
                    <span style={chipStil('grau')}>inaktiv</span>
                  ) : (
                    <CaretRight size={18} color="var(--ink-300)" style={{ flex: 'none' }} />
                  )}
                </div>
                {g.gruender && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', minWidth: 0 }}>
                    <CrownSimple size={14} weight="fill" color="var(--gold-700)" style={{ flex: 'none' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.gruender.name} · {g.gruender.email}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={chipStil('blau')}>{g.aktiveMitglieder} Spezln</span>
                  <span style={chipStil('blau')}>{g.abende} Abende</span>
                  {g.letzterAbend && <span style={chipStil('grau')}>letzter {datumKurz(g.letzterAbend)}</span>}
                  {(g.tokensOffen > 0 || g.tokensEingeloest > 0) && (
                    <span style={chipStil('gold')}><Ticket size={13} weight="fill" />{g.tokensOffen} offen · {g.tokensEingeloest} eingelöst</span>
                  )}
                  {g.tokensOffen === 0 && g.naechsterToken && (
                    <span style={chipStil('gold')}><LockSimple size={13} weight="fill" />nächster Token {datumKurz(g.naechsterToken.slice(0, 10))}</span>
                  )}
                  {g.anfragenOffen > 0 && <span style={chipStil('amber')}>{g.anfragenOffen} Anfrage offen</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Ein Ast im Stammbaum: Knoten-Karte, Kinder eingerückt mit goldener Linie. */
function Ast({ knoten, tiefe, letzter }: { knoten: StammbaumKnoten; tiefe: number; letzter: boolean }) {
  const g = knoten.gruppe;
  const wurzel = g.istGruender;
  const unter = wurzel
    ? [g.stadt, g.gruendungsjahr ? `seit ${g.gruendungsjahr}` : null].filter(Boolean).join(' · ')
    : [g.stadt, `seit ${monatJahr(g.createdAt)}`, knoten.vonName ? `von ${knoten.vonName}` : null].filter(Boolean).join(' · ');
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'stretch', paddingLeft: tiefe * 22 }}>
        {tiefe > 0 && (
          <span style={{ width: 16, flex: 'none', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: -12, bottom: letzter ? '50%' : -12, borderLeft: '2px solid var(--gold)' }} />
            <span style={{ position: 'absolute', left: 0, top: '50%', width: 12, borderTop: '2px solid var(--gold)' }} />
          </span>
        )}
        <Link href={`/verzeichnis/${g.id}`} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: wurzel ? 'var(--navy)' : 'var(--weiss)', border: wurzel ? 'none' : '1px solid var(--ink-100)', textDecoration: 'none', color: 'inherit', opacity: g.status === 'gesperrt' ? 0.6 : 1 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: wurzel ? 'rgba(255,255,255,0.12)' : 'var(--info-bg)', display: 'grid', placeItems: 'center', flex: 'none' }}>
            {wurzel ? <Image src="/brand/rauten-app.svg" alt="" width={22} height={22} style={{ height: 22, width: 'auto' }} /> : <BeerStein size={15} weight="fill" color="var(--muc-blau)" />}
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: wurzel ? 20 : 18, lineHeight: 1.05, color: wurzel ? 'var(--gold-bright)' : 'var(--navy)' }}>{g.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: wurzel ? 'rgba(246,240,226,0.7)' : 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unter}</span>
          </span>
          {knoten.ohneToken && <span style={chipStil('grau')}>ohne Token</span>}
          {g.status === 'gesperrt' && <span style={chipStil('strafe')}>gesperrt</span>}
        </Link>
      </div>
      {knoten.kinder.map((k, i) => <Ast key={k.gruppe.id} knoten={k} tiefe={tiefe + 1} letzter={i === knoten.kinder.length - 1} />)}
    </>
  );
}
