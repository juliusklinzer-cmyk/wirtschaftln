'use client';

import { Avatar } from '@/components/ds';
import { BadgeBild } from '@/components/domain/BadgeBild';

export type HallOfFameEintrag = { name: string; photoUrl: string | null; zeitraum: string; aktiv: boolean };

export type BadgeInfoDaten = {
  key: string;
  art: 'badge' | 'amt';
  /** PNG-Slug für BadgeBild (Ämter: Patron-Grafik amt-…) — null = goldene Icon-Disc. */
  slug: string | null;
  icon: string;
  name: string;
  untertitel: string;
  text: string;
  pflicht: string | null;
  duties: string | null;
  hallOfFame: HallOfFameEintrag[];
};

/** Amts-Titel → Schlüssel in den badgeInfos (eigene Ämter haben kein Info-Fenster). */
export function amtKey(titel: string): string | null {
  if (titel === 'Präsident') return 'amt:praesident';
  if (titel === 'Schriftführer') return 'amt:schriftfuehrer';
  if (titel.startsWith('Kassenwart')) return 'amt:kassenwart';
  return null;
}

/** Info-Fenster zu Badge oder Amt: Grafik groß, G'schichtl und Hall of Fame. */
export function BadgeInfo({ info, onClose }: { info: BadgeInfoDaten; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,25,58,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 340, maxHeight: '86dvh', overflowY: 'auto', background: 'var(--weiss)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-lg)' }}>
        {/* Badge groß auf Pergament */}
        <div style={{ position: 'relative', background: 'var(--pergament)', borderBottom: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', padding: '26px 20px 18px', textAlign: 'center' }}>
          <button onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(7,25,58,0.08)', color: 'var(--ink-700)', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            ×
          </button>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {info.slug ? (
              <BadgeBild slug={info.slug} icon={info.icon} name={info.name} size={132} />
            ) : (
              <span style={{ width: 108, height: 108, borderRadius: '50%', background: 'var(--grad-gold)', border: '3px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                {info.icon}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, color: 'var(--navy)', marginTop: 12, lineHeight: 1.1 }}>{info.name}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)', marginTop: 5 }}>
            {info.untertitel}
          </div>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-700)', lineHeight: 1.6 }}>{info.text}</div>

          {info.duties && (
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.5 }}>{info.duties}</div>
          )}
          {info.pflicht && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', background: '#F6ECD4', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--gold-700)' }}>
              ⚖️ {info.pflicht}
            </div>
          )}

          {/* Hall of Fame */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0 10px' }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 20, color: 'var(--navy)', lineHeight: 1 }}>Hall of Fame</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>· wer’s wia lang g’halten hat</span>
          </div>
          {info.hallOfFame.length === 0 ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', padding: '10px 0 4px' }}>
              No koaner — vielleicht du beim nächsten Stammtisch? 🍺
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {info.hallOfFame.map((h, i) => (
                <div
                  key={`${h.name}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: h.aktiv ? 'var(--pergament)' : 'transparent',
                    border: h.aktiv ? '1px solid var(--gold)' : '1px solid var(--ink-100)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <Avatar src={h.photoUrl} name={h.name} size={30} ring={h.aktiv} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.name}
                  </span>
                  <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 700, color: h.aktiv ? 'var(--gold-700)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                    {h.zeitraum}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
