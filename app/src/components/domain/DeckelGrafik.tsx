'use client';

import type { Deckel } from '@/lib/bierdeckel';

/**
 * Der Deckel selbst (264×264): beim Augustiner unser echter Scan, sonst a
 * Papp-Deckel in Brauereifarbe — grauer Karton mit leichter Körnung, dünner
 * Außenring + kräftiger Innenring wia beim Original, Brauerei-Logo in der
 * Mitte, Schriftzug in Fraktur drunter. Die Striche kritzelt der Bierdeckel
 * drüber, deshalb liegt hier nix Interaktives drin.
 */
export function DeckelGrafik({ deckel }: { deckel: Deckel }) {
  if (deckel.art === 'augustiner') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/bierdeckel.webp"
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', userSelect: 'none', pointerEvents: 'none' }}
      />
    );
  }

  const farbe = deckel.art === 'marke' ? deckel.farbe : '#0C2B5A';
  const name = deckel.art === 'marke' ? deckel.name : (deckel.name ?? 'Wirtschaftln');
  const zeilen = umbrechen(name, 16);
  const id = `deckel-${deckel.art === 'marke' ? deckel.slug : 'neutral'}`;

  return (
    <svg
      viewBox="0 0 264 264"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }}
    >
      <defs>
        {/* Karton-Körnung: Rauschen, ganz leicht drübergelegt */}
        <filter id={`${id}-korn`} x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.28  0 0 0 0.16 0" />
        </filter>
        <radialGradient id={`${id}-papp`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#E8E4D8" />
          <stop offset="75%" stopColor="#D9D4C6" />
          <stop offset="100%" stopColor="#C9C3B3" />
        </radialGradient>
        <clipPath id={`${id}-rund`}>
          <circle cx="132" cy="132" r="131" />
        </clipPath>
      </defs>

      {/* Karton */}
      <circle cx="132" cy="132" r="131" fill={`url(#${id}-papp)`} />
      <g clipPath={`url(#${id}-rund)`}>
        <rect x="0" y="0" width="264" height="264" filter={`url(#${id}-korn)`} />
      </g>
      {/* Ringe wia am Original: dünn außen, kräftig innen */}
      <circle cx="132" cy="132" r="121" fill="none" stroke={farbe} strokeWidth="2.2" opacity="0.9" />
      <circle cx="132" cy="132" r="112" fill="none" stroke={farbe} strokeWidth="5" opacity="0.92" />

      {/* Brauerei-Logo in der Mitte */}
      {deckel.art === 'marke' ? (
        <image href={deckel.logo} x="72" y="46" width="120" height="104" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <text x="132" y="112" textAnchor="middle" fontSize="58" style={{ fontFamily: 'var(--font-ui)' }}>
          🍺
        </text>
      )}

      {/* Schriftzug */}
      {zeilen.map((z, i) => (
        <text
          key={z}
          x="132"
          y={172 + i * 24}
          textAnchor="middle"
          fill={farbe}
          fontSize={zeilen.length > 1 ? 21 : 24}
          style={{ fontFamily: 'var(--font-fraktur)', letterSpacing: '0.01em' }}
          opacity="0.95"
        >
          {z}
        </text>
      ))}
      {/* Zierlinie wie „gegründet …" am Original */}
      <path d="M 92 214 Q 132 224 172 214" fill="none" stroke={farbe} strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

/** Schriftzug auf max. zwei Zeilen umbrechen (Wortgrenzen), damit's am Deckel ned aus'm Ring läuft. */
function umbrechen(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const woerter = text.split(' ');
  const zeilen: string[] = [];
  let aktuell = '';
  for (const w of woerter) {
    if (aktuell && (aktuell + ' ' + w).length > max) {
      zeilen.push(aktuell);
      aktuell = w;
    } else {
      aktuell = aktuell ? `${aktuell} ${w}` : w;
    }
  }
  if (aktuell) zeilen.push(aktuell);
  return zeilen.slice(0, 2);
}
