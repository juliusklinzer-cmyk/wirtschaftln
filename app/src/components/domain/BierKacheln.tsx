'use client';

import { useEffect, useRef } from 'react';
import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import type { Bier, BierOption } from '@/lib/biersorten';
import { useTenantConfig } from '@/components/shell/TenantProvider';

const istBier = (o: BierOption): o is Bier => 'name' in o;

/**
 * Bier-Auswahl als Logo-Kacheln in einer Wischreihe (Profil-Redesign 1b):
 * 76 px breit, gewählt in Blau. Ohne Brauerei-Logos (andere Stammtische)
 * steht a Krug drin. Erste Kachel = „keins".
 */
export function BierKacheln({ label, biere, value, onChange }: { label: string; biere: BierOption[]; value: string; onChange: (v: string) => void }) {
  const logos = useTenantConfig().features.brauereiLogos;
  const reihe = useRef<HTMLDivElement>(null);
  // Gewählte Kachel beim Öffnen ins Bild holen
  useEffect(() => {
    const el = reihe.current?.querySelector<HTMLElement>('[data-aktiv="1"]');
    if (el && reihe.current) reihe.current.scrollLeft = Math.max(0, el.offsetLeft - 12);
  }, []);
  // „Brauerei – Sorte": Brauerei fett oben, Sorte drunter, jede Zeile für sich gekürzt
  const kachel = (key: string, aktiv: boolean, bild: React.ReactNode, text: string, onClick: () => void) => {
    const [brauerei, sorte] = text.split(' – ');
    return (
    <button
      key={key}
      type="button"
      data-aktiv={aktiv ? '1' : undefined}
      onClick={onClick}
      style={{ flex: 'none', width: 86, padding: '10px 4px 8px', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: aktiv ? '2px solid var(--muc-blau)' : '1.5px solid var(--ink-100)', background: aktiv ? 'var(--info-bg)' : 'var(--weiss)' }}
    >
      <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', filter: aktiv ? 'none' : 'grayscale(0.5)' }}>{bild}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%', minHeight: 24, color: aktiv ? 'var(--muc-blau)' : 'var(--ink-500)' }}>
        <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brauerei}</span>
        {sorte && <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sorte}</span>}
      </span>
    </button>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{label}</span>
      <div ref={reihe} className="wn-scroll-still" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px' }}>
        {kachel('keins', !value, <BeerStein size={28} color="var(--ink-300)" />, 'Keins', () => onChange(''))}
        {biere.filter(istBier).map((b) =>
          kachel(
            b.name,
            b.name === value,
            logos ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : (
              <BeerStein size={28} color={b.name === value ? 'var(--muc-blau)' : 'var(--gold-700)'} />
            ),
            b.name,
            () => onChange(b.name),
          ),
        )}
      </div>
    </div>
  );
}
