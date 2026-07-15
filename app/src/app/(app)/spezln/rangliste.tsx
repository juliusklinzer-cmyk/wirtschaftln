'use client';

import { useState } from 'react';
import { Avatar, Card, SegmentedTabs, Badge, Icon } from '@/components/ds';

export type RanglisteEintrag = {
  id: string;
  name: string;
  photoUrl: string | null;
  hoiben: number;
  abende: number;
  wirtshaeuser: number;
  streak: number;
  istIch: boolean;
  amt: { titel: string; icon: string } | null;
};

const METRIKEN = [
  { value: 'hoiben', label: 'Hoibe', einheit: '🍺' },
  { value: 'abende', label: 'Abende', einheit: '🌙' },
  { value: 'wirtshaeuser', label: 'Wirtshäuser', einheit: '📍' },
] as const;

type Metrik = (typeof METRIKEN)[number]['value'];

export function Rangliste({ eintraege }: { eintraege: RanglisteEintrag[] }) {
  const [metrik, setMetrik] = useState<Metrik>('hoiben');
  const einheit = METRIKEN.find((m) => m.value === metrik)!.einheit;
  const sortiert = [...eintraege].sort((a, b) => b[metrik] - a[metrik]);
  const podium = sortiert.slice(0, 3);
  const rest = sortiert.slice(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SegmentedTabs tabs={[...METRIKEN]} value={metrik} onChange={(v) => setMetrik(v as Metrik)} />
      </div>

      {/* Podium */}
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 18, padding: '22px 16px 20px' }}>
          {[1, 0, 2].map((idx, pos) => {
            const e = podium[idx];
            if (!e) return <div key={pos} style={{ width: 78 }} />;
            const erster = idx === 0;
            return (
              <div key={e.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 84 }}>
                <span style={{ fontSize: erster ? 22 : 16 }}>{['🥇', '🥈', '🥉'][idx]}</span>
                <Avatar src={e.photoUrl} name={e.name} size={erster ? 64 : 50} ring={erster} />
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pergament)', textAlign: 'center', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}
                </div>
                <div className="wn-tnum" style={{ fontSize: erster ? 22 : 17, fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1 }}>
                  {e[metrik]} <span style={{ fontSize: 12 }}>{einheit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Restliche Ränge */}
      {rest.length > 0 && (
        <Card pad={12}>
          {rest.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                borderBottom: i < rest.length - 1 ? '1px solid var(--ink-100)' : 'none',
                background: e.istIch ? 'var(--info-bg)' : 'transparent',
                borderRadius: e.istIch ? 'var(--r-sm)' : 0,
              }}
            >
              <span className="wn-tnum" style={{ width: 24, fontWeight: 800, fontSize: 14, color: 'var(--ink-300)' }}>
                {i + 4}.
              </span>
              <Avatar src={e.photoUrl} name={e.name} size={36} ring={!!e.amt} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
                  {e.name}
                  {e.istIch && <Badge tone="blau" style={{ marginLeft: 8 }}>du</Badge>}
                </div>
                {e.amt && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)' }}>
                    {e.amt.icon} {e.amt.titel}
                  </div>
                )}
              </div>
              {e.streak > 1 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: 'var(--gold-700)' }}>
                  <Icon name="flame" size={14} /> {e.streak}
                </span>
              )}
              <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--muc-blau)', minWidth: 44, textAlign: 'right' }}>
                {e[metrik]} {einheit}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
