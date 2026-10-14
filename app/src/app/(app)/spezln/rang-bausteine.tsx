'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Avatar, Icon } from '@/components/ds';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { VEREIN_LOGO, type Metrik, type SpezlEintrag, type StatsBlock } from './rangliste';

/* Gemeinsame Bausteine der Rangliste: Podest-Säule und Listen-Zeile werden
   sowohl statisch als auch in der Rangwechsel-Animation gerendert, drum
   haben sie feste Maße (Zeile 66 px, Podest-Fläche PODEST_H). */

export const STEP = 66;
/** Höhe der Podest-Fläche: Kronen-Platz 22 + Avatar 76 + Name 24 + Amt 12 + Säule 100 + 4 × 6 Abstand */
export const PODEST_H = 22 + 6 + 76 + 6 + 24 + 6 + 12 + 6 + 100;
export const PODEST_HOEHE: Record<number, number> = { 1: 100, 2: 80, 3: 66 };
export const PODEST_AVATAR: Record<number, number> = { 1: 76, 2: 60, 3: 60 };
/** Spalte (1 links, 2 Mitte, 3 rechts) je Rang */
export const PODEST_SPALTE: Record<number, number> = { 1: 2, 2: 1, 3: 3 };

export const RANG_FARBE: Record<number, { bg: string; fg: string }> = {
  1: { bg: 'var(--gold)', fg: 'var(--navy-900)' },
  2: { bg: '#C7D0DA', fg: 'var(--ink-900)' },
  3: { bg: '#C98B5A', fg: 'var(--ink-900)' },
};

export const anzeigeName = (e: SpezlEintrag) => (e.istIch ? 'Du' : e.name.split(' ').length > 1 && e.name.split(' ')[0].length <= 3 ? e.name : e.name.split(' ')[0]);

/** Avatar mit Vereins-Logo unten rechts (oder Brezn), optional mit Ring in Gold/Blau. */
export function SpezlAvatar({ e, size, ring = null }: { e: { photoUrl: string | null; name: string; steckbrief: { verein: string | null } }; size: number; ring?: 'gold' | 'blau' | null }) {
  const logo = e.steckbrief.verein ? VEREIN_LOGO[e.steckbrief.verein] : null;
  const l = Math.round(size * 0.4);
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none', borderRadius: '50%', boxShadow: ring === 'gold' ? '0 0 0 3px var(--gold)' : ring === 'blau' ? '0 0 0 3px var(--muc-blau)' : 'none' }}>
      <Avatar src={e.photoUrl} name={e.name} size={size} verein={e.steckbrief.verein} />
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" style={{ position: 'absolute', right: -3, bottom: -2, width: l, height: l, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      ) : (
        <span style={{ position: 'absolute', right: -3, bottom: -2, width: l, height: l, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(9, l * 0.6), background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>🥨</span>
      )}
    </span>
  );
}

/** ▲1 / ▼1 in Grün/Rot, optional mit ±Punkten davor. */
export function DeltaText({ s, mitPunkten = false, size = 11 }: { s: StatsBlock; mitPunkten?: boolean; size?: number }) {
  if (s.deltaRang === 0 && (!mitPunkten || s.deltaPunkte === 0)) return null;
  const farbe = s.deltaRang > 0 || (s.deltaRang === 0 && s.deltaPunkte > 0) ? 'var(--erfolg)' : 'var(--strafe)';
  const teile: string[] = [];
  if (mitPunkten && s.deltaPunkte !== 0) teile.push(`${s.deltaPunkte > 0 ? '+' : ''}${s.deltaPunkte}`);
  if (s.deltaRang !== 0) teile.push(s.deltaRang > 0 ? `▲${s.deltaRang}` : `▼${-s.deltaRang}`);
  return <span className="wn-tnum" style={{ fontSize: size, fontWeight: 800, color: farbe, whiteSpace: 'nowrap' }}>{teile.join(' · ')}</span>;
}

/** Serie als Chip: Flamme (positiv, Pergament-Gold) oder Schneeflocke (negativ, Info-Blau). */
export function SerieChip({ s }: { s: StatsBlock }) {
  if (s.streak === 0) return null;
  const positiv = s.streak > 0;
  const wackelt = s.unentschuldigtStreak >= 3;
  return (
    <span className="wn-tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: wackelt ? 'var(--strafe-bg)' : positiv ? 'var(--warnung-bg)' : 'var(--info-bg)', color: wackelt ? 'var(--strafe)' : positiv ? 'var(--gold-700)' : 'var(--muc-blau)' }}>
      <Icon name={wackelt ? 'warning' : positiv ? 'flame' : 'snowflake'} size={12} stroke={2.4} />
      {Math.abs(s.streak)}
    </span>
  );
}

/** Delta-Pfeil, in der Animation mit Pop (deltaScale 0 → 1), sonst wie er ist. */
function DeltaPop({ s, scale }: { s: StatsBlock; scale?: number }) {
  if (scale === undefined) return <DeltaText s={s} />;
  return (
    <span style={{ display: 'inline-flex', transform: `scale(${scale})`, transformOrigin: 'right center', opacity: scale > 0 ? 1 : 0 }}>
      <DeltaText s={s} />
    </span>
  );
}

/**
 * Eine Podest-Säule: Krone (Platz), Avatar mit Rang-Marke, Name in Fraktur,
 * Amt, Säule mit Punkten. Maße kommen von außen, damit die Animation
 * zwischen den Plätzen interpolieren kann.
 */
export function PodestSpalte({
  e, rang, s, metrik, einheit, groesse, hoehe, krone, punkte, deltaScale, stil, onClick, extra, oben,
}: {
  e: SpezlEintrag;
  rang: number;
  s: StatsBlock;
  metrik: Metrik;
  einheit: string;
  groesse: number;
  hoehe: number;
  /** Krone über dem Avatar zeigen (statisch: Platz 1) */
  krone: boolean;
  /** Angezeigte Punkte, falls abweichend (Hochzählen) */
  punkte?: number;
  deltaScale?: number;
  stil?: CSSProperties;
  onClick?: () => void;
  /** Zusatz im Avatar-Kasten (Ring) */
  extra?: ReactNode;
  /** Zusatz oben rechts in der Säule (WP-Pille) */
  oben?: ReactNode;
}) {
  const erster = rang === 1;
  const farbe = RANG_FARBE[rang] ?? RANG_FARBE[3];
  const nameGroesse = 20 + (groesse - 60) / 16 * 4; // 60 → 20, 76 → 24
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: onClick ? 'pointer' : 'default', minWidth: 0, position: 'relative', ...stil }}>
      {oben}
      <span style={{ height: 22, display: 'inline-flex', alignItems: 'center', opacity: krone ? 1 : 0 }}>
        <Icon name="crown" size={22} color="var(--gold-bright)" stroke={2.4} />
      </span>
      <div style={{ position: 'relative' }}>
        <SpezlAvatar e={e} size={groesse} ring={erster ? 'gold' : e.istIch ? 'blau' : null} />
        <span className="wn-tnum" style={{ position: 'absolute', left: -4, top: -4, width: 24, height: 24, borderRadius: '50%', background: farbe.bg, color: farbe.fg, border: '2px solid var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{rang}</span>
        {extra}
      </div>
      <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: nameGroesse, lineHeight: '24px', height: 24, color: e.istIch ? 'var(--gold-bright)' : 'var(--pergament)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anzeigeName(e)}</span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold)', height: 12, lineHeight: '12px', whiteSpace: 'nowrap' }}>{e.amt?.titel ?? ''}</span>
      <div style={{ alignSelf: 'stretch', height: Math.max(0, hoehe), overflow: 'hidden', borderRadius: '14px 14px 0 0', background: erster ? 'rgba(208,173,102,0.25)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(208,173,102,0.35)', borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 2 }}>
        <span className="wn-tnum" style={{ fontSize: erster ? 26 : 22, fontWeight: 800, lineHeight: 1, color: 'var(--pergament)' }}>{punkte ?? s[metrik]}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(246,240,226,0.6)' }}>{einheit}</span>
        {metrik === 'punkte' && <DeltaPop s={s} scale={deltaScale} />}
      </div>
    </div>
  );
}

/** Eine Zeile ab Platz 4, die eigene navy-gold. Feste Höhe STEP, damit die Animation die Plätze kennt. */
export function ListenZeile({
  e, rang, s, metrik, einheit, letzte, punkte, deltaScale, rangDimm, stil, onClick, onBadge, extra,
}: {
  e: SpezlEintrag;
  rang: number;
  s: StatsBlock;
  metrik: Metrik;
  einheit: string;
  letzte: boolean;
  punkte?: number;
  deltaScale?: number;
  /** Rangzahl kurz ausblenden, während die Zeile den Platz wechselt */
  rangDimm?: boolean;
  stil?: CSSProperties;
  onClick?: () => void;
  onBadge?: (key: string) => void;
  extra?: ReactNode;
}) {
  const meine = e.istIch;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, height: STEP, padding: meine ? '0 12px' : 0, cursor: onClick ? 'pointer' : 'default',
        margin: meine ? '0 -8px' : 0, borderRadius: meine ? 16 : 0,
        background: meine ? 'var(--grad-navy)' : 'transparent', border: meine ? '1.5px solid var(--gold)' : 'none',
        borderBottom: meine ? '1.5px solid var(--gold)' : letzte ? 'none' : '1px solid var(--ink-50)',
        position: 'relative',
        ...stil,
      }}
    >
      <span className="wn-tnum" style={{ width: 24, textAlign: 'center', fontSize: 15, fontWeight: 800, color: meine ? 'rgba(246,240,226,0.6)' : 'var(--ink-300)', flex: 'none', opacity: rangDimm ? 0.2 : 1 }}>{rang}</span>
      <SpezlAvatar e={e} size={metrik === 'punkte' ? 42 : 38} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: meine ? 'var(--gold-bright)' : 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anzeigeName(e)}</span>
        {metrik === 'punkte' && (e.amt || s.streak !== 0 || e.badges.length > 0) && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            {e.amt && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{e.amt.titel}</span>}
            <SerieChip s={s} />
            {e.badges.map((b) => (
              <span key={b.key} onClick={(ev) => { ev.stopPropagation(); onBadge?.(b.key); }} style={{ display: 'inline-flex' }}>
                <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={26} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flex: 'none' }}>
        <span className="wn-tnum" style={{ fontSize: metrik === 'punkte' ? 20 : 18, fontWeight: 800, lineHeight: 1, color: meine ? 'var(--pergament)' : 'var(--navy)' }}>
          {punkte ?? s[metrik]}{metrik !== 'punkte' && <span style={{ fontSize: 10, color: 'var(--gold-700)' }}> {einheit}</span>}
        </span>
        {metrik === 'punkte' && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--gold-700)' }}>WP</span>}
        {metrik === 'punkte' && <DeltaPop s={s} scale={deltaScale} />}
      </div>
      {extra}
    </div>
  );
}
