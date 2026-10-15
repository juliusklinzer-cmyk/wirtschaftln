'use client';

import { Flame } from '@phosphor-icons/react/dist/ssr/Flame';
import { Snowflake } from '@phosphor-icons/react/dist/ssr/Snowflake';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { amtKey } from '@/components/domain/BadgeInfo';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { SERIEN_ABZEICHEN } from '@/lib/serien';

/** Ein Amt, das wer grad trägt, mit Patron-Grafik (slug null = eigenes Amt ohne Grafik). */
export type AmtKurz = { titel: string; icon: string; slug: string | null; patron: string | null };
export type AuszeichnungBadge = { key: string; slug: string | null; icon: string; name: string; tag: string };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };

/**
 * Auszeichnungen und Serie (eigenes Profil und Spezl-Detail im Rang):
 * Ämter groß mit Patron, darunter die Saison-Badges, dann die Serie mit
 * allen Abzeichen (grau = no ned gschafft), aktueller Serie und Rekord.
 */
export function Auszeichnungen({ aemter, badges, streak, bestStreak, du, onInfo }: { aemter: AmtKurz[]; badges: AuszeichnungBadge[]; streak: number; bestStreak: number; /** eigenes Profil: „Du“-Texte */ du: boolean; onInfo?: (key: string) => void }) {
  const naechstes = SERIEN_ABZEICHEN.find((a) => bestStreak < a.ab) ?? null;
  const geschafft = SERIEN_ABZEICHEN.filter((a) => bestStreak >= a.ab).length;
  const fehlen = naechstes ? naechstes.ab - Math.max(streak, 0) : 0;
  return (
    <>
      {(aemter.length > 0 || badges.length > 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel>Auszeichnungen</HoamTitel>
          <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {aemter.map((a) => {
              const key = amtKey(a.titel);
              const klickbar = !!(onInfo && key);
              return (
                <div key={a.titel} onClick={klickbar ? () => onInfo!(key!) : undefined} style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: klickbar ? 'pointer' : 'default' }}>
                  {a.slug ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/brand/badges/${a.slug}.png`} alt={a.patron ?? a.titel} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', flex: 'none' }} />
                  ) : (
                    <span style={{ width: 96, height: 96, flex: 'none', borderRadius: '50%', background: 'var(--grad-gold)', border: '2.5px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{a.icon}</span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>{a.titel}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Amt in dieser Saison</span>
                    {a.patron && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Patron · {a.patron}</span>}
                  </div>
                </div>
              );
            })}
            {badges.map((b, i) => (
              <div key={b.key} onClick={onInfo ? () => onInfo(b.key) : undefined} style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: onInfo ? 'pointer' : 'default', paddingTop: i === 0 && aemter.length > 0 ? 16 : 0, borderTop: i === 0 && aemter.length > 0 ? '1px solid var(--ink-50)' : 'none' }}>
                <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={96} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Saison-Badge · {b.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>Abzeichen bleiben für immer</span>}>Serie</HoamTitel>
        <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="wn-tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 32, fontWeight: 800, lineHeight: 1, color: streak < 0 ? 'var(--muc-blau)' : 'var(--navy)' }}>
                {streak > 0 ? <Flame size={26} weight="fill" color="#E8833A" /> : streak < 0 ? <Snowflake size={26} weight="fill" color="#8EC5E8" /> : null}
                {Math.abs(streak)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{streak < 0 ? 'in Folge gefehlt' : 'in Folge dabei'}</span>
            </div>
            <span style={{ width: 1, background: 'var(--ink-100)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="wn-tnum" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--gold-700)' }}>{bestStreak}</span>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Rekord</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SERIEN_ABZEICHEN.length}, 1fr)`, gap: 4, paddingTop: 14, borderTop: '1px solid var(--ink-50)' }}>
            {SERIEN_ABZEICHEN.map((a) => {
              const hab = bestStreak >= a.ab;
              return (
                <div key={a.ab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center' }}>
                  <div style={{ filter: hab ? 'none' : 'grayscale(1)', opacity: hab ? 1 : 0.4 }}>
                    <BadgeBild slug={`serie-${a.ab}`} icon={a.icon} name={a.name} size={56} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.2, color: hab ? 'var(--navy)' : 'var(--ink-300)' }}>{a.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-300)' }}>{a.ab} in Folge</span>
                </div>
              );
            })}
          </div>
          <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)', textAlign: 'center' }}>
            {geschafft} von {SERIEN_ABZEICHEN.length} Abzeichen
            {naechstes ? ` · noch ${fehlen} ${fehlen === 1 ? 'Abend' : 'Abende'} in Folge bis ${naechstes.name}` : du ? ' · du hast alle!' : ' · alle gschafft!'}
          </span>
        </div>
      </section>
    </>
  );
}
