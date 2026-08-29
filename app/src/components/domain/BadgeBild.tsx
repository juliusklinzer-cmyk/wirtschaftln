'use client';

import { useState } from 'react';

/**
 * Badge-Grafik aus public/brand/badges/<slug>.png (Julius' eigene Designs).
 * Fällt auf die goldene Emoji-Disc zurück, solange die Datei fehlt.
 * Für Serien-Abzeichen: slug `serie-<n>`.
 */
export function BadgeBild({ slug, icon, name, size = 30 }: { slug: string; icon: string; name: string; size?: number }) {
  const [pngFehlt, setPngFehlt] = useState(false);
  if (!pngFehlt) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/brand/badges/${slug}.png`}
        alt={name}
        title={name}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', flex: 'none' }}
        onError={() => setPngFehlt(true)}
      />
    );
  }
  return (
    <span
      title={name}
      style={{
        width: size, height: size, flex: 'none', borderRadius: '50%',
        background: 'var(--grad-gold)', border: '1.5px solid var(--gold-bright)', boxShadow: 'var(--sh-xs)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55,
      }}
    >
      {icon}
    </span>
  );
}

/**
 * Serien-Abzeichen in einer Reihe: stehen getrennt von den Saison-Badges,
 * ohne Rahmen und ohne Beschriftung, die Zahl steckt schon im Icon.
 */
export function SerienLeiste({
  serien,
  size = 32,
  style = {},
}: {
  serien: Array<{ ab: number; icon: string; name: string }>;
  size?: number;
  style?: React.CSSProperties;
}) {
  if (serien.length === 0) return null;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, flex: 'none',
        ...style,
      }}
    >
      {serien.map((a) => (
        <BadgeBild key={a.ab} slug={`serie-${a.ab}`} icon={a.icon} name={`${a.name}, ${a.ab} Stammtische in Folge`} size={size} />
      ))}
    </span>
  );
}
