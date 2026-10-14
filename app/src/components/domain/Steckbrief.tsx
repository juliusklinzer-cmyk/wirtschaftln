import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import { BeerBottle } from '@phosphor-icons/react/dist/ssr/BeerBottle';
import { BowlFood } from '@phosphor-icons/react/dist/ssr/BowlFood';
import { Tree } from '@phosphor-icons/react/dist/ssr/Tree';
import { HouseLine } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { SoccerBall } from '@phosphor-icons/react/dist/ssr/SoccerBall';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Cards } from '@phosphor-icons/react/dist/ssr/Cards';
import { bierLogo } from '@/lib/biersorten';

export type SteckbriefDaten = {
  herkunft: string | null;
  lieblingsbier: string | null;
  lieblingsweissbier: string | null;
  leibspeise: string | null;
  lieblingsbiergarten: string | null;
  lieblingswirtshaus: string | null;
  verein: string | null;
  schafkopfer: boolean;
  /** Weißwürste normal, null = no ned festgelegt */
  weisswuerste?: number | null;
  beschreibung: string | null;
};

export function steckbriefLeer(d: SteckbriefDaten): boolean {
  return (
    !d.herkunft && !d.lieblingsbier && !d.lieblingsweissbier && !d.leibspeise &&
    !d.lieblingsbiergarten && !d.lieblingswirtshaus && !d.verein && !d.schafkopfer && !d.beschreibung && d.weisswuerste == null
  );
}

/** Weißwurst (eigene Grafik aus dem Design, Phosphor hat koa) */
export function WeisswurstIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }} aria-hidden>
      <path d="M5.5 18.5c-1.6-1.6-1.4-4 .3-5.7l7-7c1.7-1.7 4.1-1.9 5.7-.3s1.4 4-.3 5.7l-7 7c-1.7 1.7-4.1 1.9-5.7.3z" fill="#F6F0E2" stroke="#A6843E" strokeWidth="1.8" />
      <path d="M4.6 19.4l-1.6 1.6M19.4 4.6L21 3" stroke="#A6843E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 14.5l5.5-5.5" stroke="#A6843E" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

function Logo({ src, size = 24 }: { src: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain', flex: 'none' }} />
  );
}

/**
 * Der bayrische Steckbrief eines Spezls (Profil-Redesign 1a, 14.10.2026):
 * oben der Spruch kursiv, dann Zeilen mit Icon in Gold, Begriff links in
 * Grau, Wert fett mit Logo wo's eins gibt. Zeigt nur, was ausgefüllt ist.
 */
export function Steckbrief({ daten, logos = true, mitHerkunft = true }: { daten: SteckbriefDaten; /** Brauerei-Logos (nur Gründer) */ logos?: boolean; /** Viertel als Zeile (im Profil steht's scho im Kopf) */ mitHerkunft?: boolean }) {
  if (steckbriefLeer(daten)) return null;
  const ikon = { size: 20, color: 'var(--gold-700)', style: { width: 22, flex: 'none' } as React.CSSProperties };
  const zeilen: Array<{ icon: React.ReactNode; logo?: string | null; label: string; wert: string }> = [];
  if (mitHerkunft && daten.herkunft) zeilen.push({ icon: <MapPin {...ikon} />, label: 'Viertel', wert: daten.herkunft });
  if (daten.lieblingsbier) zeilen.push({ icon: <BeerStein {...ikon} />, logo: logos ? bierLogo(daten.lieblingsbier) : null, label: 'Helles', wert: daten.lieblingsbier });
  if (daten.lieblingsweissbier) zeilen.push({ icon: <BeerBottle {...ikon} />, logo: logos ? bierLogo(daten.lieblingsweissbier) : null, label: 'Weißbier', wert: daten.lieblingsweissbier });
  if (daten.leibspeise) zeilen.push({ icon: <BowlFood {...ikon} />, label: 'Leibspeise', wert: daten.leibspeise });
  if (daten.weisswuerste != null) zeilen.push({ icon: <WeisswurstIcon />, label: 'Weißwurst', wert: `${daten.weisswuerste} Stück` });
  if (daten.lieblingsbiergarten) zeilen.push({ icon: <Tree {...ikon} />, label: 'Biergarten', wert: daten.lieblingsbiergarten });
  if (daten.lieblingswirtshaus) zeilen.push({ icon: <HouseLine {...ikon} />, label: 'Wirtshaus', wert: daten.lieblingswirtshaus });
  if (daten.verein === 'bayern' || daten.verein === 'sechzig') {
    zeilen.push({ icon: <SoccerBall {...ikon} />, logo: daten.verein === 'bayern' ? '/brand/vereine/fcb.png' : '/brand/vereine/1860.png', label: 'Verein', wert: daten.verein === 'bayern' ? 'FC Bayern' : 'TSV 1860' });
  } else if (daten.verein) {
    zeilen.push({ icon: <SoccerBall {...ikon} />, label: 'Verein', wert: daten.verein });
  }
  if (daten.schafkopfer) zeilen.push({ icon: <Cards {...ikon} />, logo: '/brand/vereine/eichel.png', label: 'Schafkopf', wert: 'Ja' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {daten.beschreibung && (
        <span style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.55, color: 'var(--ink-700)', padding: '12px 0', borderBottom: zeilen.length ? '1px solid var(--ink-50)' : 'none' }}>„{daten.beschreibung}“</span>
      )}
      {zeilen.map((z, i) => (
        <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: i === zeilen.length - 1 ? '12px 0 2px' : '12px 0', borderBottom: i < zeilen.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
          {z.icon}
          <span style={{ width: 96, flex: 'none', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{z.label}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {z.logo && <Logo src={z.logo} />}
            <span style={{ minWidth: 0 }}>{z.wert}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
