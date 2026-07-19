'use client';

// Gemeinsame Typen und Bausteine der Rangliste — der Renderer (Variante B,
// von Julius am 19.07.2026 gewählt) wohnt in rangliste-b.tsx.
import { useState } from 'react';
import { type SteckbriefDaten } from '@/components/domain/Steckbrief';

export type StatsBlock = {
  punkte: number;
  hoiben: number;
  abende: number;
  wirtshaeuser: number;
  organisiert: number;
  runden: number;
  schweinsbraten: number;
  taxi: number;
  streak: number;
  bestStreak: number;
  /** Unentschuldigte Fehltermine in Folge — ab 3 „wackelt" der Spezl. */
  unentschuldigtStreak: number;
  /** Veränderung seit dem letzten Stammtisch */
  deltaPunkte: number;
  /** >0 = Plätze raufgeklettert, <0 = abgerutscht */
  deltaRang: number;
};

export type SpezlBadge = { key: string; icon: string; name: string; tag: string; pflicht: string | null };
export type SerienAbzeichen = { icon: string; name: string; ab: number };

export type SpezlEintrag = {
  id: string;
  name: string;
  /** Zeremonielle volle Form „Da <Nachname> <Vorname>" — für den Urkunden-Kopf im Detail. */
  vollerName: string | null;
  photoUrl: string | null;
  istIch: boolean;
  amt: { titel: string; icon: string } | null;
  badges: SpezlBadge[];
  serien: SerienAbzeichen[];
  steckbrief: SteckbriefDaten;
  saison: StatsBlock;
  allzeit: StatsBlock;
};

export type AmtEintrag = {
  icon: string;
  titel: string;
  /** PNG-Slug der Patron-Grafik (amt-…), null bei eigenen Ämtern ohne Grafik. */
  slug: string | null;
  /** Historischer Patron des Amts (z. B. Prinzregent Luitpold). */
  patron: string | null;
  mode: string;
  duties: string | null;
  holder: { name: string; photoUrl: string | null } | null;
};

export type GalerieBadge = SpezlBadge & { holder: { name: string; photoUrl: string | null } | null };

export type Metrik = 'punkte' | 'hoiben' | 'wirtshaeuser';
export const METRIKEN: { value: Metrik; label: string; einheit: string }[] = [
  { value: 'punkte', label: 'Gesamt', einheit: 'WP' },
  { value: 'hoiben', label: 'Hoibe', einheit: 'Hoibe' },
  { value: 'wirtshaeuser', label: 'Wirtshäuser', einheit: 'Wirtshäuser' },
];

export const VEREIN_FARBE: Record<string, string> = { bayern: '#DC052D', sechzig: '#1E9CD7' };
export const VEREIN_LOGO: Record<string, string> = { bayern: '/brand/vereine/fcb.png', sechzig: '/brand/vereine/1860.png' };
export const MEDAILLE: Record<number, { rand: string; disc: string; fg: string }> = {
  1: { rand: 'var(--gold)', disc: 'linear-gradient(135deg,#F0D9A6,#A6843E)', fg: 'var(--navy-900)' },
  2: { rand: '#C2CAD6', disc: 'linear-gradient(135deg,#EEF2F7,#9AA6B5)', fg: '#3D4A5C' },
  3: { rand: '#C9853F', disc: 'linear-gradient(135deg,#E8B584,#9C6630)', fg: '#fff' },
};

/**
 * Badge-Medaillon: nimmt automatisch das PNG aus public/brand/badges/<key>.png
 * (Julius' eigene Badge-Grafiken); solange die Datei fehlt, greift das
 * geprägte SVG-Siegel mit Fraktur-Initial.
 */
export function Siegel({ badge, size = 48, mitLabel = true }: { badge: SpezlBadge; size?: number; mitLabel?: boolean }) {
  const [pngFehlt, setPngFehlt] = useState(false);
  const initial = badge.name.replace(/^Die /, '')[0];
  return (
    <div title={`${badge.name} — ${badge.tag}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: mitLabel ? size + 16 : size }}>
      {!pngFehlt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/brand/badges/${badge.key}.png`}
          alt={badge.name}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setPngFehlt(true)}
        />
      ) : (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <defs>
          <radialGradient id={`gold-${initial}-${size}`} cx="35%" cy="30%">
            <stop offset="0%" stopColor="#F0D9A6" />
            <stop offset="55%" stopColor="#D0AD66" />
            <stop offset="100%" stopColor="#A6843E" />
          </radialGradient>
        </defs>
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <circle key={i} cx={24 + Math.cos(a) * 22} cy={24 + Math.sin(a) * 22} r={1.6} fill="#A6843E" />;
        })}
        <circle cx="24" cy="24" r="20" fill={`url(#gold-${initial}-${size})`} stroke="#8C6D30" strokeWidth="1" />
        <circle cx="24" cy="24" r="15.5" fill="#0C2B5A" stroke="#E6C684" strokeWidth="1.2" />
        <text x="24" y="31" textAnchor="middle" fontFamily="var(--font-fraktur)" fontSize="19" fill="#E6C684">
          {initial}
        </text>
      </svg>
      )}
      {mitLabel && (
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--gold-700)', textAlign: 'center', lineHeight: 1.2 }}>
          {badge.name}
        </span>
      )}
    </div>
  );
}

export function Delta({ s, gross = false }: { s: StatsBlock; gross?: boolean }) {
  if (s.deltaPunkte === 0 && s.deltaRang === 0) return null;
  return (
    <div className="wn-tnum" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', fontSize: gross ? 13 : 11, fontWeight: 800 }}>
      {s.deltaPunkte !== 0 && (
        <span style={{ color: s.deltaPunkte > 0 ? 'var(--erfolg)' : 'var(--strafe)' }}>
          {s.deltaPunkte > 0 ? '+' : ''}{s.deltaPunkte}
        </span>
      )}
      {s.deltaRang !== 0 && (
        <span style={{ color: s.deltaRang > 0 ? 'var(--erfolg)' : 'var(--strafe)' }}>
          {s.deltaRang > 0 ? `▲${s.deltaRang}` : `▼${-s.deltaRang}`}
        </span>
      )}
    </div>
  );
}
