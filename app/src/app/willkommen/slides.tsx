'use client';

import { useRef, useState, useTransition } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr/CalendarPlus';
import { CheckSquare } from '@phosphor-icons/react/dist/ssr/CheckSquare';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { Notebook } from '@phosphor-icons/react/dist/ssr/Notebook';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { BowlFood } from '@phosphor-icons/react/dist/ssr/BowlFood';
import { Cake } from '@phosphor-icons/react/dist/ssr/Cake';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { Flame } from '@phosphor-icons/react/dist/ssr/Flame';
import { PlusCircle } from '@phosphor-icons/react/dist/ssr/PlusCircle';
import { Coins } from '@phosphor-icons/react/dist/ssr/Coins';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { HandCoins } from '@phosphor-icons/react/dist/ssr/HandCoins';
import { Heart } from '@phosphor-icons/react/dist/ssr/Heart';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/dist/lib/types';
import { Tinte } from '@/components/domain/Bierdeckel';
import { onboardingFertig } from './actions';

type Punkt = { Icon: PhosphorIcon; titel: string; text: string };
type Slide = { eyebrow: string; titel: string; punkte: Punkt[]; bild: React.ReactNode };

const HINTERGRUND = 'radial-gradient(120% 70% at 50% 25%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)';
const KARTE: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 18, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' };
const SCHWELLE = 48;

/**
 * Die fünf Slides: oben ein Bild aus echten App-Bausteinen, unten drei Sätze.
 * Wischen (Touch) oder „Weiter“, Punkte unten links, „Überspringen“ oben rechts.
 */
export function OnboardingSlides({ stammhaus, schnaps, hoibePreis, ersterLogin }: { stammhaus: boolean; schnaps: boolean; hoibePreis: string; ersterLogin: boolean }) {
  const [i, setI] = useState(0);
  const [zug, setZug] = useState(0);
  const [wischt, setWischt] = useState(false);
  const start = useRef<{ x: number; y: number; waagrecht: boolean | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const slides = slidesBauen({ stammhaus, schnaps, hoibePreis });
  const letzter = i === slides.length - 1;

  const fertig = () => startTransition(() => onboardingFertig());
  const weiter = () => (letzter ? fertig() : setI((n) => Math.min(slides.length - 1, n + 1)));

  const touchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, waagrecht: null };
  };
  const touchMove = (e: React.TouchEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    if (s.waagrecht === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.waagrecht = Math.abs(dx) > Math.abs(dy);
    if (!s.waagrecht) return;
    // An den Enden zäh wia a Gummiband
    const rand = (dx > 0 && i === 0) || (dx < 0 && letzter);
    setZug(rand ? dx * 0.3 : dx);
    setWischt(true);
  };
  const touchEnd = () => {
    const s = start.current;
    start.current = null;
    setWischt(false);
    if (!s || !s.waagrecht) { setZug(0); return; }
    if (zug < -SCHWELLE && !letzter) setI((n) => n + 1);
    else if (zug > SCHWELLE && i > 0) setI((n) => n - 1);
    setZug(0);
  };

  return (
    <div
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={touchEnd}
      onTouchCancel={touchEnd}
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: HINTERGRUND, fontFamily: 'var(--font-ui)', overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}
    >
      <div className="wn-raute wn-raute--sm" style={{ height: 8, flex: 'none' }} />
      {!letzter && (
        <button type="button" onClick={fertig} disabled={pending} className="wn-press" style={{ position: 'absolute', right: 12, top: 'calc(14px + env(safe-area-inset-top))', zIndex: 2, border: 'none', background: 'transparent', padding: '8px', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'rgba(246,240,226,0.75)', cursor: 'pointer' }}>
          Überspringen
        </button>
      )}

      {/* Schiene mit allen fünf Slides, wird geschoben */}
      <div
        style={{
          flex: 1, display: 'flex', width: `${slides.length * 100}%`,
          transform: `translateX(calc(${-i * (100 / slides.length)}% + ${zug}px))`,
          transition: wischt ? 'none' : 'transform 320ms cubic-bezier(.32,.72,0,1)',
        }}
      >
        {slides.map((s, n) => (
          <div key={s.eyebrow} aria-hidden={n !== i} style={{ width: `${100 / slides.length}%`, flex: 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 'clamp(250px, 40dvh, 380px)', flex: 'none', display: 'grid', placeItems: 'center', padding: 'calc(28px + env(safe-area-inset-top)) 0 10px' }}>
              <div style={{ width: 300, maxWidth: 'calc(100vw - 48px)' }}>{s.bild}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--weiss)', borderRadius: '28px 28px 0 0', padding: '26px 24px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 -10px 40px rgba(7,25,58,0.35)' }}>
              <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{s.eyebrow}</span>
                  <h1 style={{ fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 34, lineHeight: 1, color: 'var(--navy)', margin: 0 }}>{s.titel}</h1>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {s.punkte.map((p) => (
                    <div key={p.titel} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--info-bg)', color: 'var(--muc-blau)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                        <p.Icon size={18} weight="fill" />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{p.titel}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>{p.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 6 }} aria-label={`Slide ${i + 1} von ${slides.length}`}>
                    {slides.map((_, k) => (
                      <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 99, background: k === i ? 'var(--navy)' : 'var(--ink-200)', transition: 'width 250ms ease, background 250ms ease' }} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={weiter}
                    disabled={pending}
                    tabIndex={n === i ? 0 : -1}
                    className="wn-press"
                    style={{ height: 52, padding: '0 24px', borderRadius: 14, border: 'none', background: 'var(--grad-gold)', color: 'var(--navy-900)', boxShadow: 'var(--sh-gold)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: pending ? 0.6 : 1 }}
                  >
                    {n === slides.length - 1 ? (ersterLogin ? 'Los geht’s' : 'Passt') : 'Weiter'}
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function slidesBauen({ stammhaus, schnaps, hoibePreis }: { stammhaus: boolean; schnaps: boolean; hoibePreis: string }): Slide[] {
  return [
    {
      eyebrow: '1 · Der Termin',
      titel: 'So läuft ein Abend',
      bild: <BildTermin />,
      punkte: [
        { Icon: CalendarPlus, titel: 'Einer organisiert', text: stammhaus ? 'Reihum stellt einer den Termin ein und reserviert im Stammhaus.' : 'Reihum sucht einer das Wirtshaus, stellt den Termin ein und reserviert.' },
        { Icon: CheckSquare, titel: 'Abstimmen und zusagen', text: 'Die Runde stimmt ab, ein Tipp auf „Bin dabei“ reicht. Am Abend kurz einchecken.' },
        stammhaus
          ? { Icon: House, titel: 'Euer Stammhaus', text: 'Immer dasselbe Wirtshaus. Ausflüge woanders hin gehen trotzdem.' }
          : { Icon: Prohibit, titel: 'Kein Wirtshaus zweimal', text: 'Jedes Mal ein neues. Die Karte merkt sich, wo ihr schon wart.' },
      ],
    },
    {
      eyebrow: '2 · Am Tisch',
      titel: 'Bierdeckel und Wertung',
      bild: <BildDeckel schnaps={schnaps} />,
      punkte: [
        { Icon: BeerStein, titel: 'Stricheln wie die Bedienung', text: schnaps ? 'Unten die Hoibe, oben der Schnaps. Jeder führt seinen eigenen Deckel.' : 'Strich für Strich, jede Hoibe. Jeder führt seinen eigenen Deckel.' },
        { Icon: Star, titel: 'Danach bewerten', text: 'Wirtshaus, Schweinsbraten und Kaiserschmarrn, gern mit einem Satz dazu.' },
        { Icon: Notebook, titel: 'Einer schließt ab', text: 'Der Schriftführer trägt den Abend ein und bekommt 3 WP dafür.' },
      ],
    },
    {
      eyebrow: '3 · Das Lexikon',
      titel: 'Jeder Besuch zählt',
      bild: <BildLexikon />,
      punkte: [
        { Icon: MapPin, titel: 'Alles auf der Karte', text: 'Jedes Wirtshaus, in dem ihr wart, bekommt einen Pin, mit Datum und Wertung.' },
        { Icon: Star, titel: 'Bewertet von allen', text: 'Sterne für Wirtshaus, Schweinsbraten und Kaiserschmarrn, dazu ein Satz.' },
        { Icon: Medal, titel: 'Die Besten der Liste', text: 'Bester Braten, bester Kaiserschmarrn: So findet ihr die Favoriten wieder.' },
      ],
    },
    {
      eyebrow: '4 · Ruhm und Ehre',
      titel: 'Punkte, Ämter, Badges',
      bild: <BildRang />,
      punkte: [
        { Icon: Trophy, titel: 'Wirtschaftln-Punkte (WP)', text: 'Fürs Dabeisein, Organisieren und das Ausmachen vom nächsten Termin. Daraus wird die Rangliste.' },
        { Icon: CrownSimple, titel: 'Ämter und Badges', text: 'Wer vorne liegt, wird Präsident. Maximator, Taxler und Co. gibt’s pro Saison.' },
        { Icon: Flame, titel: 'Serie halten', text: 'Abende in Folge bringen Abzeichen für immer. Dreimal unentschuldigt, und du wackelst.' },
      ],
    },
    {
      eyebrow: '5 · Die Kasse',
      titel: 'Eure Stammtischkasse',
      bild: <BildKasse hoibePreis={hoibePreis} />,
      punkte: [
        { Icon: Coins, titel: 'Eine Kasse für alle', text: 'Kassenstand, Einnahmen und Ausgaben sieht jeder.' },
        { Icon: Gavel, titel: 'Strafen und Spenden', text: 'Landen direkt in der Kasse, gerechnet in Hoibe.' },
        { Icon: HandCoins, titel: 'Einfach bezahlen', text: 'Per PayPal oder bar beim Kassenwart.' },
      ],
    },
  ];
}

/* ── Bilder aus App-Bausteinen ───────────────────────────────────────── */

function Kuerzel({ text, ton, groesse = 30 }: { text: string; ton: 'gold' | 'blau' | 'navy'; groesse?: number }) {
  const farben = ton === 'gold' ? { background: 'var(--gold)', color: 'var(--navy-900)' } : ton === 'navy' ? { background: 'var(--navy)', color: 'var(--gold-bright)' } : { background: 'var(--info-bg)', color: 'var(--muc-blau)' };
  return <span style={{ width: groesse, height: groesse, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: Math.round(groesse / 3), fontWeight: 800, boxShadow: '0 0 0 2px #fff', flex: 'none', ...farben }}>{text}</span>;
}

function BildTermin() {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...KARTE, overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 6 }} />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Do · 2. Juli · 19 Uhr</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 99, background: 'var(--erfolg-bg)', color: 'var(--erfolg)', whiteSpace: 'nowrap' }}><CheckCircle size={14} weight="fill" />reserviert</span>
          </div>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>Augustiner-Keller</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <span style={{ height: 40, borderRadius: 12, background: 'var(--erfolg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 800 }}><Check size={16} weight="bold" />Bin dabei</span>
            <span style={{ height: 40, borderRadius: 12, border: '1.5px solid var(--ink-200)', color: 'var(--ink-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>Kann nicht</span>
          </div>
        </div>
      </div>
      <div style={{ alignSelf: 'flex-end', marginRight: -8, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 99, background: 'var(--grad-gold)', color: 'var(--navy-900)', boxShadow: '0 10px 24px rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 800 }}>
        <CalendarPlus size={18} weight="fill" />Organisiert von Resi
      </div>
      <div style={{ position: 'absolute', left: -10, bottom: 6, display: 'flex' }}>
        <Kuerzel text="HH" ton="gold" /><Kuerzel text="RG" ton="blau" /><Kuerzel text="VM" ton="blau" /><Kuerzel text="+4" ton="navy" />
      </div>
    </div>
  );
}

function BildDeckel({ schnaps }: { schnaps: boolean }) {
  return (
    <div style={{ position: 'relative', width: 300, height: 290, margin: '0 auto' }}>
      <div style={{ position: 'absolute', left: 24, top: 0, width: 252, height: 252 }}>
        <div style={{ position: 'absolute', inset: 5, borderRadius: '50%', boxShadow: '0 16px 30px rgba(0,0,0,0.45)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bierdeckel.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: 'rotate(-6deg)' }} />
        <div style={{ position: 'absolute', inset: 0 }}><Tinte hoiben={7} schnaps={2} sterne={0} schnapsAn={schnaps} /></div>
      </div>
      <div style={{ position: 'absolute', right: -6, bottom: 0, ...KARTE }}>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-500)' }}>Deine Wertung</span>
          <div style={{ display: 'flex', gap: 2, color: 'var(--gold)' }}>
            {[0, 1, 2, 3].map((k) => <Star key={k} size={16} weight="fill" />)}<Star size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BildLexikon() {
  const pin = (left: number, top: number, gold = false) => (
    <MapPin key={`${left}-${top}`} size={gold ? 34 : 26} weight="fill" color={gold ? 'var(--gold)' : 'var(--navy)'} style={{ position: 'absolute', left, top, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))' }} />
  );
  const zeile = (Icon: PhosphorIcon, eyebrow: string, name: string, wert: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--weiss)', boxShadow: '0 10px 24px rgba(0,0,0,0.3)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--grad-gold)', color: 'var(--navy-900)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon size={17} weight="fill" /></span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{eyebrow}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{name}</span>
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}><Star size={14} weight="fill" color="var(--gold)" />{wert}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative', height: 170, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E9EEF2', backgroundImage: 'linear-gradient(rgba(12,43,90,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(12,43,90,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}>
        <span style={{ position: 'absolute', left: -20, top: 96, width: 360, height: 18, background: '#C9DCEB', transform: 'rotate(-12deg)' }} />
        {pin(40, 30)}{pin(96, 74)}{pin(150, 22)}{pin(214, 62, true)}{pin(250, 120)}{pin(96, 118)}{pin(176, 118, true)}
        <span style={{ position: 'absolute', left: 10, bottom: 10, fontSize: 11, fontWeight: 800, color: 'var(--navy)', background: '#fff', padding: '4px 9px', borderRadius: 99 }}>23 Wirtshäuser besucht</span>
      </div>
      {zeile(BowlFood, 'Bester Braten', 'Wirtshaus in der Au', '4,8')}
      {zeile(Cake, 'Bester Kaiserschmarrn', 'Augustiner-Keller', '4,6')}
    </div>
  );
}

function BildRang() {
  const stufe = (kuerzel: string, platz: number, hoehe: number, erster = false) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <Kuerzel text={kuerzel} ton={erster ? 'gold' : 'blau'} groesse={erster ? 54 : 44} />
      <div style={{ alignSelf: 'stretch', height: hoehe, borderRadius: '12px 12px 0 0', background: erster ? 'linear-gradient(180deg, rgba(230,198,132,0.4), rgba(230,198,132,0.1))' : 'rgba(246,240,226,0.12)', borderTop: erster ? '1.5px solid var(--gold)' : '1.5px solid rgba(246,240,226,0.3)', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, color: 'var(--pergament)' }}>{platz}</div>
    </div>
  );
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <CrownSimple size={26} weight="fill" color="var(--gold-bright)" style={{ marginBottom: -2 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, width: 240 }}>
        {stufe('SB', 2, 70)}{stufe('HH', 1, 96, true)}{stufe('RG', 3, 52)}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/badges/maximator.png" alt="" style={{ position: 'absolute', left: -28, top: 22, width: 88, height: 88, objectFit: 'contain', transform: 'rotate(-10deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/badges/amt-praesident.png" alt="" style={{ position: 'absolute', right: -28, top: 8, width: 84, height: 84, objectFit: 'contain', transform: 'rotate(9deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }} />
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 99, background: 'var(--gold-bright)', color: 'var(--navy-900)', whiteSpace: 'nowrap' }}><PlusCircle size={14} weight="fill" />+3 WP</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 99, background: 'rgba(246,240,226,0.15)', color: 'var(--pergament)', whiteSpace: 'nowrap' }}><Flame size={14} weight="fill" />4 in Folge</span>
      </div>
    </div>
  );
}

function BildKasse({ hoibePreis }: { hoibePreis: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={KARTE}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 18, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A, #07193A)', border: '1.5px solid var(--gold)' }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Kassenstand</span>
          <span className="wn-tnum" style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--gold-bright)' }}>184,50 €</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.8)' }}>1 Hoibe = {hoibePreis} €</span>
        </div>
      </div>
      <div style={KARTE}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--erfolg-bg)', color: 'var(--erfolg)', display: 'grid', placeItems: 'center', flex: 'none' }}><Heart size={18} weight="fill" /></span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Basti</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Hat 5 Hoibe gespendet</span>
          </div>
          <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--erfolg)' }}>+18,50 €</span>
        </div>
      </div>
    </div>
  );
}
