'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { TrendDown } from '@phosphor-icons/react/dist/ssr/TrendDown';
import { Icon } from '@/components/ds';
import type { SpezlEintrag } from './rangliste';
import { anzeigeName, ListenZeile, PodestSpalte, PODEST_AVATAR, PODEST_HOEHE, PODEST_SPALTE, STEP } from './rang-bausteine';

/* ──────────────────────────────────────────────────────────────────────────
   Rangwechsel-Animation (Rang-Redesign 3a–3d, 14.10.2026)

   Läuft einmal pro Gerät beim ersten Öffnen von „Rang" nach dem letzten
   abgeschlossenen Abend, wenn sich der eigene Platz verändert hat.
   Zeitachse in Sekunden ab Start:
     0.8–1.6  Punkte zählen hoch, „+n WP" schwebt auf
     1.9–2.8  Zeilen/Säulen tauschen den Platz (Aufsteiger hebt sich)
     2.6–3.1  Krone hüpft (wenn's an neue Nummer 1 gibt)
     2.9–3.35 Pfeil-Chip ploppt auf
     3.1–3.5  Hinweis fährt von unten rein, ab 6.2 wieder raus
   Ab ENDE_EBENE übernimmt wieder das statische Layout (gleiche Maße, koa Sprung).
   ────────────────────────────────────────────────────────────────────────── */

export const ENDE_EBENE = 3.4;
const ENDE = 6.8;

const cl = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const L = (a: number, b: number, p: number) => a + (b - a) * p;

export type WechselZeile = { e: SpezlEintrag; von: number; nach: number; punkteVor: number; punkteNach: number };
export type WechselInfo = { rauf: boolean; icon: 'trophy' | 'medal' | 'krone' | 'runter'; titel: string; text: string };

function namenListe(zeilen: WechselZeile[]): string {
  const n = zeilen.map((z) => anzeigeName(z.e));
  if (n.length <= 1) return n[0] ?? '';
  return `${n.slice(0, -1).join(', ')} und ${n[n.length - 1]}`;
}

/** Vorher-/Nachher-Plätze aus deltaRang/deltaPunkte (Saison, WP) und der Text für den Hinweis. */
export function wechselBerechnen(eintraege: SpezlEintrag[]): { zeilen: WechselZeile[]; info: WechselInfo } | null {
  const ranked = [...eintraege].sort((a, b) => b.saison.punkte - a.saison.punkte);
  const zeilen: WechselZeile[] = ranked.map((e, i) => ({
    e,
    von: i + 1 + e.saison.deltaRang,
    nach: i + 1,
    punkteVor: e.saison.punkte - e.saison.deltaPunkte,
    punkteNach: e.saison.punkte,
  }));
  const ich = zeilen.find((z) => z.e.istIch);
  if (!ich || ich.von === ich.nach) return null;
  const alt = ich.von, neu = ich.nach;
  const rauf = neu < alt;
  let info: WechselInfo;
  if (rauf) {
    const alteEins = zeilen.find((z) => !z.e.istIch && z.von === 1);
    const rausAusPodest = zeilen.find((z) => !z.e.istIch && z.von <= 3 && z.nach > 3);
    const ueberholt = zeilen.filter((z) => !z.e.istIch && z.von < alt && z.nach > neu);
    if (neu === 1) info = { rauf, icon: 'krone', titel: 'Neue Nummer 1!', text: alteEins ? `Du hast ${anzeigeName(alteEins.e)} vom Thron gestoßen.` : 'Du führst die Saison an.' };
    else if (alt > 3 && neu <= 3) info = { rauf, icon: 'medal', titel: 'Aufs Podest!', text: rausAusPodest ? `Platz ${neu}, ${anzeigeName(rausAusPodest.e)} ist raus.` : `Platz ${neu}!` };
    else info = { rauf, icon: 'trophy', titel: `Platz ${neu}!`, text: ueberholt.length ? `Du hast ${namenListe(ueberholt)} überholt.` : `Du bist ${alt - neu} ${alt - neu === 1 ? 'Platz' : 'Plätze'} raufgeklettert.` };
  } else {
    const vorbei = zeilen.filter((z) => !z.e.istIch && z.von > alt && z.nach < neu);
    const vorMir = zeilen.find((z) => z.nach === neu - 1);
    const rueckstand = vorMir ? vorMir.punkteNach - ich.punkteNach : 0;
    const raufAufsPodest = zeilen.find((z) => !z.e.istIch && z.von > 3 && z.nach <= 3);
    if (alt <= 3 && neu > 3) info = { rauf, icon: 'runter', titel: 'Vom Podest gerutscht', text: raufAufsPodest ? `Jetzt Platz ${neu}, ${anzeigeName(raufAufsPodest.e)} ist oben.` : `Jetzt Platz ${neu}.` };
    else info = { rauf, icon: 'runter', titel: vorbei.length ? `${namenListe(vorbei)} ${vorbei.length > 1 ? 'haben' : 'hat'} dich überholt` : `Platz ${neu}`, text: `Jetzt Platz ${neu}${rueckstand > 0 ? `, ${rueckstand} WP Rückstand.` : '.'}` };
  }
  return { zeilen, info };
}

/**
 * Startet die Animation, wenn's was zu zeigen gibt und sie auf dem Gerät für
 * diesen Abend noch ned gelaufen ist. Liefert die Zeit t (null = statisch).
 */
export function useRangWechsel(eintraege: SpezlEintrag[], terminId: string | null, aktivierbar: boolean) {
  const [t, setT] = useState<number | null>(null);
  const [daten, setDaten] = useState<{ zeilen: WechselZeile[]; info: WechselInfo } | null>(null);
  const laeuft = useRef(false);

  useEffect(() => {
    if (!terminId || !aktivierbar || laeuft.current) return;
    const key = `wn_rang_gsehn_${terminId}`;
    let gesehen = false;
    try { gesehen = localStorage.getItem(key) === '1'; } catch { gesehen = true; }
    if (gesehen) return;
    const berechnet = wechselBerechnen(eintraege);
    try {
      // Alte Marker früherer Abende aufräumen, es zählt nur der letzte
      for (const k of Object.keys(localStorage)) if (k.startsWith('wn_rang_gsehn_') && k !== key) localStorage.removeItem(k);
      localStorage.setItem(key, '1');
    } catch { /* egal */ }
    if (!berechnet) return;
    laeuft.current = true;
    const reduziert = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setDaten(berechnet);
    setT(0); // Vorher-Stand sofort zeigen, die Uhr läuft erst nach der Startpause los
    let raf = 0;
    let timer = 0;
    const t0 = performance.now() + (reduziert ? -3100 : 400);
    const loop = (now: number) => {
      const s = (now - t0) / 1000;
      if (s >= ENDE) { setT(null); setDaten(null); return; }
      setT(Math.max(0, s));
      raf = requestAnimationFrame(loop);
    };
    timer = window.setTimeout(() => { raf = requestAnimationFrame(loop); }, reduziert ? 0 : 400);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminId, aktivierbar]);

  const stopp = () => { setT(null); setDaten(null); };
  return { t: daten ? t : null, zeilen: daten?.zeilen ?? [], info: daten?.info ?? null, stopp };
}

/** „+n WP" schwebt beim Hochzählen auf. Minus nur bei der eigenen Zeile, sonst wird's a Pillen-Wald. */
function plusPille(z: WechselZeile, p1: number, p2: number, stil: CSSProperties) {
  const d = z.punkteNach - z.punkteVor;
  if (d === 0 || (d < 0 && !z.e.istIch)) return null;
  const op = p1 > 0 ? Math.min(p1 * 3, 1 - p2) : 0;
  return (
    <span className="wn-tnum" style={{ position: 'absolute', opacity: op, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', pointerEvents: 'none', background: d > 0 ? 'var(--grad-gold)' : 'var(--strafe-bg)', color: d > 0 ? 'var(--navy-900)' : 'var(--strafe)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', ...stil }}>
      {d > 0 ? '+' : '−'}{Math.abs(d)} WP
    </span>
  );
}

/** Podest in Bewegung: Säulen absolut in den drei Spalten, Maße interpoliert. */
export function PodestWechsel({ zeilen, t, einheit }: { zeilen: WechselZeile[]; t: number; einheit: string }) {
  const p1 = io(cl((t - 0.8) / 0.8)), p2 = io(cl((t - 1.9) / 0.9)), p3 = cl((t - 2.9) / 0.45);
  const pOut = io(cl((t - 1.9) / 0.6)), pRise = cl((t - 2.3) / 0.7);
  const neueEins = zeilen.some((z) => z.nach === 1 && z.von !== 1);
  const hop = neueEins ? cl((t - 2.6) / 0.5) : 0;
  const mitte = zeilen.find((z) => z.nach === 1);
  // Krone sitzt über der Mitte, Höhe folgt der Säule, die dort hinkommt
  let kroneUnten = PODEST_HOEHE[1] + 6 + 12 + 6 + 24 + 6 + PODEST_AVATAR[1] + 6;
  if (mitte && mitte.von <= 3) {
    const ph = L(PODEST_HOEHE[mitte.von], PODEST_HOEHE[1], p2), av = L(PODEST_AVATAR[mitte.von], PODEST_AVATAR[1], p2);
    kroneUnten = ph + 6 + 12 + 6 + 24 + 6 + av + 6;
  }
  return (
    <>
      {zeilen.filter((z) => z.von <= 3 || z.nach <= 3).map((z) => {
        const vonP = z.von <= 3, nachP = z.nach <= 3;
        let spalte: number, hoehe: number, groesse: number, op = 1, dy = 0, rang: number;
        if (vonP && nachP) {
          spalte = L(PODEST_SPALTE[z.von], PODEST_SPALTE[z.nach], p2);
          hoehe = L(PODEST_HOEHE[z.von], PODEST_HOEHE[z.nach], p2);
          groesse = L(PODEST_AVATAR[z.von], PODEST_AVATAR[z.nach], p2);
          rang = p2 < 0.5 ? z.von : z.nach;
        } else if (vonP) {
          spalte = PODEST_SPALTE[z.von]; hoehe = PODEST_HOEHE[z.von] * (1 - pOut); groesse = PODEST_AVATAR[z.von]; op = 1 - pOut; rang = z.von;
        } else {
          spalte = PODEST_SPALTE[z.nach]; hoehe = PODEST_HOEHE[z.nach] * Math.min(1, back(pRise)); groesse = PODEST_AVATAR[z.nach]; op = cl(pRise * 2); dy = -30 * (1 - io(pRise)); rang = z.nach;
        }
        const punkte = Math.round(L(z.punkteVor, z.punkteNach, p1));
        const ring = z.e.istIch && !vonP && p3 > 0 ? (
          <span style={{ position: 'absolute', left: '50%', top: '50%', width: groesse, height: groesse, marginLeft: -groesse / 2, marginTop: -groesse / 2, borderRadius: '50%', border: '3px solid var(--gold-bright)', transform: `scale(${1 + p3 * 1.1})`, opacity: 1 - p3, pointerEvents: 'none' }} />
        ) : null;
        return (
          <PodestSpalte
            key={z.e.id}
            e={z.e}
            rang={rang}
            s={z.e.saison}
            metrik="punkte"
            einheit={einheit}
            groesse={groesse}
            hoehe={hoehe}
            krone={false}
            punkte={punkte}
            deltaScale={z.e.istIch ? (p3 ? back(p3) : 0) : p3 >= 1 ? 1 : 0}
            stil={{ position: 'absolute', bottom: 0, left: `calc((100% + 8px) * ${(spalte - 1) / 3})`, width: 'calc((100% - 16px) / 3)', opacity: op, transform: `translateY(${dy}px)`, zIndex: z.e.istIch ? 3 : 1 }}
            extra={ring}
            oben={plusPille(z, p1, p2, { top: 2 - 10 * p1, right: 0, zIndex: 4 })}
          />
        );
      })}
      <span style={{ position: 'absolute', left: '50%', marginLeft: -11, bottom: kroneUnten, height: 22, display: 'inline-flex', alignItems: 'center', transform: `translateY(${-Math.sin(Math.PI * hop) * 26}px) rotate(${Math.sin(Math.PI * hop) * -14}deg)`, zIndex: 4, pointerEvents: 'none' }}>
        <Icon name="crown" size={22} color="var(--gold-bright)" stroke={2.4} />
      </span>
    </>
  );
}

/** Liste ab Platz 4 in Bewegung: Zeilen absolut, Platz interpoliert, Aufsteiger hebt sich. */
export function ListeWechsel({ zeilen, t, einheit }: { zeilen: WechselZeile[]; t: number; einheit: string }) {
  const p1 = io(cl((t - 0.8) / 0.8)), p2 = io(cl((t - 1.9) / 0.9)), p3 = cl((t - 2.9) / 0.45);
  const pIn = io(cl((t - 2.3) / 0.5)), pUp = io(cl((t - 1.9) / 0.5));
  const inListe = zeilen.filter((z) => z.von > 3 || z.nach > 3);
  const anzahlNach = zeilen.filter((z) => z.nach > 3).length;
  return (
    <div style={{ position: 'relative', height: anzahlNach * STEP, clipPath: 'inset(0 -40px)' }}>
      {inListe.map((z) => {
        const vonL = z.von > 3, nachL = z.nach > 3;
        let y: number, op = 1, lift = 0, rang: number, dimm = false;
        if (vonL && nachL) {
          y = L(z.von - 4, z.nach - 4, p2) * STEP;
          const bewegt = z.von !== z.nach;
          lift = bewegt && z.punkteNach > z.punkteVor ? Math.sin(Math.PI * p2) : 0;
          rang = p2 < 0.5 ? z.von : z.nach;
          dimm = bewegt && p2 > 0.35 && p2 < 0.65;
        } else if (vonL) {
          y = (z.von - 4) * STEP - 70 * pUp; op = 1 - pUp; rang = z.von; lift = Math.sin(Math.PI * pUp) * 0.5;
        } else {
          y = (z.nach - 4) * STEP - 50 * (1 - pIn); op = pIn; rang = z.nach;
        }
        const punkte = Math.round(L(z.punkteVor, z.punkteNach, p1));
        const bewegt = z.von !== z.nach;
        return (
          <ListenZeile
            key={z.e.id}
            e={z.e}
            rang={rang}
            s={z.e.saison}
            metrik="punkte"
            einheit={einheit}
            letzte={z.nach - 3 >= anzahlNach}
            punkte={punkte}
            deltaScale={z.e.istIch ? (p3 ? back(p3) : 0) : p3 >= 1 ? 1 : 0}
            rangDimm={dimm}
            stil={{
              position: 'absolute', left: 0, right: 0, top: y, opacity: op,
              transform: `scale(${1 + 0.04 * lift})`,
              boxShadow: lift > 0 ? `0 ${2 + 16 * lift}px ${6 + 24 * lift}px rgba(12,43,90,${0.08 + 0.2 * lift})` : 'none',
              background: z.e.istIch ? 'var(--grad-navy)' : lift > 0 ? 'var(--weiss)' : 'transparent',
              borderRadius: z.e.istIch || lift > 0 ? 16 : 0,
              zIndex: bewegt ? (z.punkteNach > z.punkteVor ? 3 : 2) : 1,
            }}
            extra={plusPille(z, p1, p2, { right: 64, top: `calc(50% - ${10 + 18 * p1}px)` })}
          />
        );
      })}
    </div>
  );
}

/** Hinweis unten: Gold bei Aufstieg, weiß mit rotem Rand bei Abstieg. Tippen schließt. */
export function RangToast({ info, t, onClose }: { info: WechselInfo; t: number; onClose: () => void }) {
  const rein = io(cl((t - 3.1) / 0.4)), raus = cl((t - 6.2) / 0.4);
  const p = rein * (1 - raus);
  if (p <= 0) return null;
  const Ikon = info.icon === 'krone' ? CrownSimple : info.icon === 'medal' ? Medal : info.icon === 'trophy' ? Trophy : TrendDown;
  return (
    <div
      onClick={onClose}
      role="status"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 50, maxWidth: 'var(--container-app)', margin: '0 auto', padding: '0 16px', pointerEvents: p > 0.5 ? 'auto' : 'none',
      }}
    >
      <div style={{ opacity: p, transform: `translateY(${24 * (1 - p)}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, cursor: 'pointer', background: info.rauf ? 'var(--grad-gold)' : 'var(--weiss)', border: info.rauf ? 'none' : '1.5px solid rgba(192,57,43,0.35)', color: info.rauf ? 'var(--navy-900)' : 'var(--strafe)', boxShadow: '0 10px 28px rgba(12,43,90,0.25)' }}>
        <Ikon size={26} weight="fill" style={{ flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{info.titel}</span>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{info.text}</span>
        </div>
      </div>
    </div>
  );
}
