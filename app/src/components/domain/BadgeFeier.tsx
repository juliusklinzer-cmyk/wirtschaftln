'use client';

import { useEffect, useMemo, useState } from 'react';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { Scales } from '@phosphor-icons/react/dist/ssr/Scales';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { Scroll } from '@phosphor-icons/react/dist/ssr/Scroll';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { Urkunde, type UrkundeDaten } from '@/components/domain/Urkunde';

export type FeierInfo = { icon: 'patron' | 'modus' | 'pflicht'; text: string };

export type FeierBadge = {
  key: string;
  /** Saison-Badge groß, Amt groß mit Infos, Serien-Abzeichen kleiner und ruhiger */
  art: 'badge' | 'amt' | 'serie';
  slug: string | null;
  icon: string;
  name: string;
  /** Kleine Zeile über dem Titel, Standard „Servus!“ */
  eyebrow?: string;
  titel1: string;
  titel2: string;
  spruch: string;
  /** Bei Ämtern: Patron und Pflichten, stehen unterm Spruch. */
  infos?: FeierInfo[] | null;
  /** Wen der Spezl damit abgelöst hat („Damit hast du Sepp abgelöst.“) */
  vorherName?: string | null;
  /** Urkunde zum Teilen, null = koa Urkunde (Serien, Heiwong) */
  urkunde?: UrkundeDaten | null;
  /** Eigener Text für den Knopf beim letzten Badge */
  knopf?: string;
};

const FARBEN = ['#E6C684', '#D0AD66', '#DC052D', '#1E9CD7', '#F6F0E2', '#FFD700'];
const INFO_ICON = { patron: CrownSimple, modus: Scales, pflicht: Gavel } as const;

/**
 * Vollbild-Feier (Badge-Feier-Redesign 1a–1d), wenn der Spezl ein neues Badge,
 * Amt oder Serien-Abzeichen gewonnen hat: Feuerwerk, Badge springt rein, Text
 * und Knopf folgen. Mehrere nacheinander mit Punkten. Pro Gerät einmal
 * (localStorage je Termin+Badge). „Urkunde ansehen“ öffnet die Urkunde.
 */
export function BadgeFeier({ terminId, feiern }: { terminId: string; feiern: FeierBadge[] }) {
  const [offen, setOffen] = useState<FeierBadge[]>([]);
  const [index, setIndex] = useState(0);
  const [raus, setRaus] = useState(false);
  const [wechsel, setWechsel] = useState(false);
  const [urkundeOffen, setUrkundeOffen] = useState(false);

  useEffect(() => {
    if (feiern.length === 0) return;
    const key = `wn_gfeiert_${terminId}`;
    let gfeiert: string[] = [];
    try {
      gfeiert = JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
      gfeiert = [];
    }
    const neue = feiern.filter((f) => !gfeiert.includes(f.key));
    if (neue.length > 0) {
      setOffen(neue);
      localStorage.setItem(key, JSON.stringify([...gfeiert, ...neue.map((f) => f.key)]));
    }
  }, [terminId, feiern]);

  const badge = offen[Math.min(index, offen.length - 1)];
  const klein = badge?.art === 'serie';

  // Feuerwerk: Raketen mit je 14 Funken, deterministisch gestreut, in Schleife (3 statt 7 beim Serien-Abzeichen)
  const raketen = useMemo(
    () =>
      Array.from({ length: klein ? 3 : 7 }, (_, r) => ({
        x: 12 + ((r * 37) % 76),
        y: 8 + ((r * 53) % 50),
        delay: 0.2 + r * 0.55,
        farbe: FARBEN[r % FARBEN.length],
        funken: Array.from({ length: 14 }, (_, f) => {
          const winkel = (f / 14) * Math.PI * 2;
          const radius = 55 + ((r * 7 + f * 13) % 40);
          return { dx: Math.cos(winkel) * radius, dy: Math.sin(winkel) * radius };
        }),
      })),
    [klein],
  );

  if (!badge) return null;
  const letzter = index >= offen.length - 1;
  const groesse = klein ? 140 : 190;

  const weiter = () => {
    if (letzter) {
      setRaus(true);
      setTimeout(() => setOffen([]), 420);
      return;
    }
    setWechsel(true);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setWechsel(false);
    }, 260);
  };

  const knopfText = letzter ? (badge.knopf ?? 'Gratuliere, weiter geht’s!') : `Weiter (${index + 1}/${offen.length})`;

  return (
    <div
      className="wn-feier"
      style={{
        position: 'fixed', inset: 0, zIndex: 90, maxWidth: 'var(--container-app)', margin: '0 auto', overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 36%, #123E78 0%, #07193A 70%)', fontFamily: 'var(--font-ui)',
        animation: 'wnFeierAuf 300ms ease-out both', opacity: raus ? 0 : 1, transition: 'opacity 400ms ease',
      }}
    >
      <style>{`
        @keyframes wnFeierAuf { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wnFunke { 0% { transform: translate(0,0) scale(1); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; } }
        @keyframes wnBadgePop { 0% { transform: scale(0) rotate(-25deg); opacity: 0; } 55% { transform: scale(1.25) rotate(8deg); opacity: 1; } 75% { transform: scale(0.94) rotate(-3deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes wnStrahlen { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wnRein { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .wn-feier * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; } }
      `}</style>

      {/* Feuerwerk */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {raketen.map((rakete, r) => (
          <div key={`${badge.key}-${r}`} style={{ position: 'absolute', left: `${rakete.x}%`, top: `${rakete.y}%` }}>
            {rakete.funken.map((funke, f) => (
              <span
                key={f}
                style={{
                  position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                  background: rakete.farbe, boxShadow: `0 0 6px ${rakete.farbe}`,
                  ['--dx' as never]: `${funke.dx}px`,
                  ['--dy' as never]: `${funke.dy}px`,
                  animation: `wnFunke 1.8s ease-out ${rakete.delay}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Inhalt: mittig, bei wenig Platz scrollbar */}
      <div
        className="wn-scroll-still"
        style={{
          position: 'absolute', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'calc(24px + env(safe-area-inset-top)) 28px calc(24px + env(safe-area-inset-bottom))', textAlign: 'center',
          opacity: wechsel ? 0 : 1, transition: 'opacity 250ms ease',
        }}
      >
        {/* Strahlenkranz und Badge */}
        <div style={{ position: 'relative', width: 300, maxWidth: '100%', height: klein ? 220 : 260, flex: 'none', display: 'grid', placeItems: 'center', marginBottom: 6 }}>
          <div
            aria-hidden
            style={{
              position: 'absolute', left: '50%', top: '50%', width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(230,198,132,0.22) 0deg 12deg, transparent 12deg 30deg)',
              WebkitMaskImage: 'radial-gradient(circle, #000 40%, transparent 70%)', maskImage: 'radial-gradient(circle, #000 40%, transparent 70%)',
              opacity: klein ? 0.6 : 1, animation: 'wnStrahlen 24s linear infinite',
            }}
          />
          <div key={badge.key} style={{ position: 'relative', animation: 'wnBadgePop 900ms 300ms cubic-bezier(0.22, 1, 0.36, 1) both', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))' }}>
            {badge.slug ? (
              <BadgeBild slug={badge.slug} icon={badge.icon} name={badge.name} size={groesse} />
            ) : (
              <span style={{ width: groesse - 30, height: groesse - 30, borderRadius: '50%', background: 'var(--grad-gold)', border: '4px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: (groesse - 30) * 0.48 }}>
                {badge.icon}
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <div key={`t-${badge.key}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'wnRein 500ms 1100ms ease-out both', maxWidth: 340, width: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.75)' }}>{badge.eyebrow ?? 'Servus!'}</span>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 38, lineHeight: 1.05, color: 'var(--gold-bright)' }}>
            {badge.titel1}
            <br />
            {badge.titel2}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.9)', maxWidth: 320 }}>{badge.spruch}</span>
          {badge.vorherName && (
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-bright)' }}>
              Damit hast du <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 18 }}>{badge.vorherName}</span> abgelöst.
            </span>
          )}
          {badge.infos && badge.infos.length > 0 && (
            <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(230,198,132,0.35)', textAlign: 'left' }}>
              {badge.infos.map((z, i) => {
                const IconK = INFO_ICON[z.icon];
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, color: 'var(--pergament)' }}>
                    <IconK size={15} weight="fill" color="var(--gold)" style={{ flex: 'none', marginTop: 1 }} />
                    <span>{z.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Punkte, Knopf, Urkunde */}
        <div key={`k-${badge.key}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 24, alignSelf: 'stretch', maxWidth: 340, width: '100%', marginLeft: 'auto', marginRight: 'auto', animation: 'wnRein 500ms 1500ms ease-out both' }}>
          {offen.length > 1 && (
            <div style={{ display: 'flex', gap: 6 }} aria-label={`${index + 1} von ${offen.length}`}>
              {offen.map((f, i) => (
                <span key={f.key} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 999, background: i === index ? 'var(--gold-bright)' : 'rgba(246,240,226,0.3)', transition: 'width 250ms ease' }} />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={weiter}
            className="wn-press"
            style={{
              alignSelf: 'stretch', height: 54, border: 'none', borderRadius: 14, cursor: 'pointer',
              background: 'var(--grad-gold)', boxShadow: '0 8px 22px rgba(166,132,62,0.35)',
              fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, color: 'var(--navy-900)',
            }}
          >
            {knopfText}
          </button>
          {badge.urkunde && (
            <button
              type="button"
              onClick={() => setUrkundeOffen(true)}
              className="wn-press"
              style={{ border: 'none', background: 'none', padding: '6px 10px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'var(--gold-bright)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Scroll size={17} />
              Urkunde ansehen
            </button>
          )}
        </div>
      </div>

      {urkundeOffen && badge.urkunde && <Urkunde daten={badge.urkunde} onClose={() => setUrkundeOffen(false)} />}
    </div>
  );
}
