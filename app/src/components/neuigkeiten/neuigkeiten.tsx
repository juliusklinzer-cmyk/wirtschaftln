'use client';

import { useState, useTransition } from 'react';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { Lightning } from '@phosphor-icons/react/dist/ssr/Lightning';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { CheckSquare } from '@phosphor-icons/react/dist/ssr/CheckSquare';
import { Coins } from '@phosphor-icons/react/dist/ssr/Coins';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr/CalendarPlus';
import { DeviceMobile } from '@phosphor-icons/react/dist/ssr/DeviceMobile';
import { Wine } from '@phosphor-icons/react/dist/ssr/Wine';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { SlideStrecke, SLIDE_KARTE, type Slide } from '@/app/willkommen/slides';
import { neuigkeitenGesehen } from './actions';

const chip = (auto: boolean): React.CSSProperties => ({
  fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999,
  background: auto ? 'var(--info-bg)' : 'var(--ink-50)', color: auto ? 'var(--muc-blau)' : 'var(--ink-500)',
});

/** Mini-Zeile aus der App für die Bilder. */
function Reihe({ titel, unter, rechts, letzte }: { titel: string; unter?: string; rechts?: React.ReactNode; letzte?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
        {unter && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--strafe)' }}>{unter}</span>}
      </div>
      {rechts}
    </div>
  );
}

function BildStammtisch({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...SLIDE_KARTE, overflow: 'hidden' }}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A, #07193A)', border: '1.5px solid var(--gold)', borderRadius: 18 }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--gold-bright)' }}>{name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(246,240,226,0.75)' }}>Steckbrief · Ämter · Badges · Rekorde</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['Vollster Tisch', '14 Spezln'], ['Längste Serie', '6 Abende']].map(([t, w]) => (
          <div key={t} style={{ ...SLIDE_KARTE, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{t}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BildKatalog() {
  return (
    <div style={{ ...SLIDE_KARTE, overflow: 'hidden' }}>
      <Reihe titel="Unentschuldigt gefehlt" unter="Absagen bis 24 Uhr am Vortag · 20 €" rechts={<span style={chip(true)}>automatisch</span>} />
      <Reihe titel="Reservierung verschlafen" unter="10 €" rechts={<span style={chip(true)}>automatisch</span>} />
      <Reihe titel="Zu spät ab 30 Min" unter="5 €" rechts={<span style={chip(false)}>von Hand</span>} />
      <Reihe titel="Handy am Tisch" unter="1 WP" rechts={<span style={chip(false)}>von Hand</span>} letzte />
    </div>
  );
}

function BildBuchen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...SLIDE_KARTE, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-500)' }}>Welche Strafe?</span>
        <div style={{ padding: '9px 12px', borderRadius: 12, background: 'var(--strafe-bg)', border: '1.5px solid var(--strafe)', display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
          <span>Zu spät ab 30 Min</span><span style={{ color: 'var(--strafe)' }}>5 €</span>
        </div>
        <div style={{ height: 40, borderRadius: 12, background: 'var(--strafe)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>Sepp bestrafen</div>
      </div>
      <div style={{ ...SLIDE_KARTE, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>Sepp</span>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999, background: 'var(--strafe-bg)', color: 'var(--strafe)' }}>Strafe</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: '#B7791F' }}>+5,00 €</span>
      </div>
    </div>
  );
}

function BildTermin() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: 14, borderRadius: 18, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A, #07193A)', border: '1.5px solid var(--gold)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-bright)' }}>Hast du Zeit?</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 6 }}>
          <span style={{ height: 36, borderRadius: 10, background: 'var(--grad-gold)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: 'var(--navy-900)' }}>Bin dabei</span>
          <span style={{ height: 36, borderRadius: 10, border: '1.5px solid rgba(246,240,226,0.3)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--pergament)' }}>Absagen</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4, color: 'var(--gold-bright)' }}>Absagen bis Mi, 24 Uhr. Danach unentschuldigt.</span>
      </div>
      <div style={{ ...SLIDE_KARTE, overflow: 'hidden' }}>
        <Reihe titel="Termin verschieben" rechts={<span style={chip(true)}>neu</span>} letzte />
      </div>
    </div>
  );
}

function BildSchnapsnase() {
  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/badges/schnapsler.png" alt="Die Schnapsnase" style={{ width: 220, height: 220, objectFit: 'contain', filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.45))' }} />
    </div>
  );
}

/**
 * „Was ist neu“ als Overlay über der App (wie die Erklär-Slides zum Wischen).
 * Einmal pro Ausgabe, Überspringen oder durchwischen merkt sich der Server.
 */
export function Neuigkeiten({ stammtischName, schnapsnase }: { stammtischName: string; /** Münchner Badge-Set mit Schnaps → Slide zur Schnapsnase */ schnapsnase: boolean }) {
  const [zu, setZu] = useState(false);
  const [pending, startTransition] = useTransition();
  if (zu) return null;

  const slides: Slide[] = [
    {
      eyebrow: 'Neu in der App',
      titel: 'Unser Stammtisch',
      bild: <BildStammtisch name={stammtischName} />,
      punkte: [
        { Icon: UsersThree, titel: 'Euer Steckbrief', text: 'Im Profil-Menü unter „Unser Stammtisch“: Bier, Schafkopfer, Präsident und wer die App gegründet hat.' },
        { Icon: Medal, titel: 'Badges und Rekorde', text: 'Alle Ämter und Badges der Saison auf einen Blick, dazu der vollste Tisch und der durstigste Abend.' },
      ],
    },
    {
      eyebrow: 'Neu in der App',
      titel: 'Der Strafenkatalog',
      bild: <BildKatalog />,
      punkte: [
        { Icon: Gavel, titel: 'Eure eigenen Strafen', text: 'Jeder Stammtisch legt selbst fest, was was kostet: WP, Euro oder beides.' },
        { Icon: Lightning, titel: 'Automatisch oder von Hand', text: 'Manches bucht die App von allein, zum Beispiel wenn keiner rechtzeitig reserviert. Den Rest bucht ihr am Tisch.' },
        { Icon: CrownSimple, titel: 'Präsident und Admin', text: 'Pflegen den Katalog. Erlassen darf der Präsident, aber nie seine eigene Strafe.' },
      ],
    },
    {
      eyebrow: 'Neu in der App',
      titel: 'Strafen buchen',
      bild: <BildBuchen />,
      punkte: [
        { Icon: CheckSquare, titel: 'Am Zettel „Wer war da“', text: 'Strafe hinzufügen: wer, welche, buchen. Und erstmal sind jetzt alle als da markiert.' },
        { Icon: Coins, titel: 'Alles im Kassenbuch', text: 'Strafen mit Geld stehen rot markiert im Kassenbuch, Strafen mit WP in eurer Abend-Auswertung auf Dahoam.' },
      ],
    },
    {
      eyebrow: 'Neu in der App',
      titel: 'Rund um den Termin',
      bild: <BildTermin />,
      punkte: [
        { Icon: Clock, titel: 'Absagen mit Frist', text: 'Die Termin-Karte zeigt, bis wann ihr absagen könnt und was es danach kostet.' },
        { Icon: CalendarPlus, titel: 'Termin verschieben', text: 'Präsident, Admin und Organisator können verschieben. Dann stimmen alle neu ab.' },
        { Icon: DeviceMobile, titel: 'Flotter am Handy', text: 'Tabs reagieren sofort und das Menü geht gleich zu.' },
      ],
    },
    ...(schnapsnase
      ? [{
          eyebrow: 'Neues Badge',
          titel: 'Die Schnapsnase',
          bild: <BildSchnapsnase />,
          punkte: [
            { Icon: Wine, titel: 'Patron Monaco Franze', text: 'Der ewige Stenz und Münchner Original. Nach am guten Essen schadet a Stamperl nie.' },
            { Icon: Trophy, titel: 'Wer kriegt’s?', text: 'Wer die meisten Stamperl der Saison am Deckel hat.' },
          ],
        }]
      : []),
  ];

  return (
    <div role="dialog" aria-label="Was ist neu" style={{ position: 'fixed', inset: 0, zIndex: 200, overflowY: 'auto' }}>
      <SlideStrecke
        slides={slides}
        pending={pending}
        letzterKnopf="Passt, los"
        fertig={() => {
          setZu(true);
          startTransition(() => neuigkeitenGesehen());
        }}
      />
    </div>
  );
}
