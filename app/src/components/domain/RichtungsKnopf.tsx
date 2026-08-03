'use client';

import { Icon } from '@/components/ds';
import { navigationsUrl } from '@/lib/google-maps';

/**
 * Runder Gold-Knopf mit dem Wegbeschreibungs-Symbol — öffnet Google Maps
 * im Routen-Modus zum Wirtshaus (am Handy direkt die Maps-App).
 */
export function RichtungsKnopf({
  ziel,
  size = 40,
  style,
}: {
  ziel: { name: string; adresse?: string | null; lat?: number | null; lng?: number | null };
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={navigationsUrl(ziel)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Navigation zum ${ziel.name}`}
      title="Zum Wirtshaus navigieren"
      onClick={(e) => e.stopPropagation()}
      style={{
        width: size, height: size, flex: 'none', borderRadius: '50%',
        background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)',
        color: 'var(--navy-900)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none',
        ...style,
      }}
    >
      <Icon name="richtung" size={Math.round(size * 0.52)} stroke={2} />
    </a>
  );
}
