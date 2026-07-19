'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeBild } from '@/components/domain/BadgeBild';

export type FeierBadge = {
  key: string;
  slug: string | null;
  icon: string;
  name: string;
  spruch: string;
  /** Bei Ämtern: Patron + Pflichten — stehen unterm Spruch. */
  infos?: string[] | null;
  /** Wen der Spezl damit abglöst hat („Damit hast’d n Sepp abglöst"). */
  vorherName?: string | null;
};

const FARBEN = ['#E6C684', '#D0AD66', '#DC052D', '#1E9CD7', '#F6F0E2', '#FFD700'];

/**
 * Vollbild-Feier, wenn der Spezl ein neues Badge/Amt gewonnen hat:
 * Feuerwerk, Badge groß mit Pop, „Servus — du bist jetza da neue …!"
 * Wird pro Gerät nur einmal gezeigt (localStorage je Termin+Badge).
 */
export function BadgeFeier({ terminId, feiern }: { terminId: string; feiern: FeierBadge[] }) {
  const [offen, setOffen] = useState<FeierBadge[]>([]);
  const [index, setIndex] = useState(0);

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

  // Feuerwerk: 7 Raketen mit je 14 Funken, deterministisch gestreut, in Schleife
  const raketen = useMemo(
    () =>
      Array.from({ length: 7 }, (_, r) => ({
        x: 12 + ((r * 37) % 76),
        y: 12 + ((r * 53) % 55),
        delay: r * 0.55,
        farbe: FARBEN[r % FARBEN.length],
        funken: Array.from({ length: 14 }, (_, f) => {
          const winkel = (f / 14) * Math.PI * 2;
          const radius = 55 + ((r * 7 + f * 13) % 40);
          return { dx: Math.cos(winkel) * radius, dy: Math.sin(winkel) * radius };
        }),
      })),
    [],
  );

  if (offen.length === 0) return null;
  const badge = offen[Math.min(index, offen.length - 1)];
  const letzter = index >= offen.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(circle at 50% 38%, #123E78 0%, #07193A 70%)', overflow: 'hidden' }}>
      <style>{`
        @keyframes wnFunke { 0% { transform: translate(0,0) scale(1); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; } }
        @keyframes wnBadgePop { 0% { transform: scale(0) rotate(-25deg); opacity: 0; } 55% { transform: scale(1.25) rotate(8deg); opacity: 1; } 75% { transform: scale(0.94) rotate(-3deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes wnStrahlen { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wnRein { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Feuerwerk */}
      {raketen.map((rakete, r) => (
        <div key={r} style={{ position: 'absolute', left: `${rakete.x}%`, top: `${rakete.y}%`, pointerEvents: 'none' }}>
          {rakete.funken.map((funke, f) => (
            <span
              key={f}
              style={{
                position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                background: rakete.farbe, boxShadow: `0 0 6px ${rakete.farbe}`,
                ['--dx' as never]: `${funke.dx}px`,
                ['--dy' as never]: `${funke.dy}px`,
                animation: `wnFunke 1.6s ease-out ${rakete.delay}s infinite`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      ))}

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 340 }}>
        {/* Strahlenkranz hinterm Badge */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%', width: 300, height: 300,
              marginLeft: -150, marginTop: -150, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(230,198,132,0.22) 0deg 12deg, transparent 12deg 30deg, rgba(230,198,132,0.22) 30deg 42deg, transparent 42deg 60deg, rgba(230,198,132,0.22) 60deg 72deg, transparent 72deg 90deg, rgba(230,198,132,0.22) 90deg 102deg, transparent 102deg 120deg, rgba(230,198,132,0.22) 120deg 132deg, transparent 132deg 150deg, rgba(230,198,132,0.22) 150deg 162deg, transparent 162deg 180deg, rgba(230,198,132,0.22) 180deg 192deg, transparent 192deg 210deg, rgba(230,198,132,0.22) 210deg 222deg, transparent 222deg 240deg, rgba(230,198,132,0.22) 240deg 252deg, transparent 252deg 270deg, rgba(230,198,132,0.22) 270deg 282deg, transparent 282deg 300deg, rgba(230,198,132,0.22) 300deg 312deg, transparent 312deg 330deg, rgba(230,198,132,0.22) 330deg 342deg, transparent 342deg 360deg)',
              animation: 'wnStrahlen 24s linear infinite',
            }}
          />
          <div key={badge.key} style={{ animation: 'wnBadgePop 900ms cubic-bezier(0.22, 1, 0.36, 1) both', position: 'relative' }}>
            {badge.slug ? (
              <BadgeBild slug={badge.slug} icon={badge.icon} name={badge.name} size={190} />
            ) : (
              <span style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--grad-gold)', border: '4px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 76 }}>
                {badge.icon}
              </span>
            )}
          </div>
        </div>

        <div key={`t-${badge.key}`} style={{ animation: 'wnRein 500ms 250ms ease-out both' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.75 }}>
            Servus!
          </div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 38, color: 'var(--gold-bright)', lineHeight: 1.1, marginTop: 8 }}>
            Du bist jetza
            <br />
            da neue {badge.name}!
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--pergament)', opacity: 0.9, marginTop: 14, lineHeight: 1.5 }}>
            {badge.spruch}
          </div>
          {badge.vorherName && (
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-bright)', marginTop: 10 }}>
              Damit hast’d n <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 17 }}>{badge.vorherName}</span> abglöst.
            </div>
          )}
          {badge.infos && badge.infos.length > 0 && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(230,198,132,0.35)', borderRadius: 'var(--r-md)', textAlign: 'left' }}>
              {badge.infos.map((zeile, i) => (
                <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--pergament)', lineHeight: 1.5, marginTop: i === 0 ? 0 : 6 }}>
                  {zeile}
                </div>
              ))}
            </div>
          )}
          {badge.key !== 'heiwong' && (
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold-bright)', marginTop: 10 }}>Gratuliere! 🍻</div>
          )}

          <button
            onClick={() => (letzter ? setOffen([]) : setIndex(index + 1))}
            style={{
              marginTop: 22, padding: '14px 34px', minHeight: 52, border: 'none', borderRadius: 'var(--r-md)',
              background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, color: 'var(--navy-900)',
            }}
          >
            {letzter ? 'Passt — eini geht’s! 🍺' : `Weiter (${index + 1}/${offen.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
