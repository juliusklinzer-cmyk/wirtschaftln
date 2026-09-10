'use client';

import { Icon } from '@/components/ds';
import { navigationsUrl, ortsUrl } from '@/lib/google-maps';
import { useTenantConfig } from '@/components/shell/TenantProvider';

/**
 * Runder Gold-Knopf mit dem Wegbeschreibungs-Symbol, öffnet Google Maps
 * (am Handy direkt die Maps-App): Modus „route" navigiert hin, Modus „ort"
 * zeigt das Wirtshaus mit Fotos, Bewertungen und Öffnungszeiten.
 */
export function RichtungsKnopf({
  ziel,
  size = 40,
  modus = 'route',
  style,
}: {
  ziel: { name: string; adresse?: string | null; lat?: number | null; lng?: number | null };
  size?: number;
  modus?: 'route' | 'ort';
  style?: React.CSSProperties;
}) {
  const ort = useTenantConfig().geo?.suchSuffix ?? null;
  return (
    <a
      href={modus === 'ort' ? ortsUrl(ziel, ort) : navigationsUrl(ziel, ort)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={modus === 'ort' ? `${ziel.name} in Google Maps anschauen` : `Navigation zum ${ziel.name}`}
      title={modus === 'ort' ? 'In Google Maps anschauen' : 'Zum Wirtshaus navigieren'}
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
