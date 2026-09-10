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
  beschreibung: string | null;
};

export function steckbriefLeer(d: SteckbriefDaten): boolean {
  return (
    !d.herkunft && !d.lieblingsbier && !d.lieblingsweissbier && !d.leibspeise &&
    !d.lieblingsbiergarten && !d.lieblingswirtshaus && !d.verein && !d.schafkopfer && !d.beschreibung
  );
}

function Logo({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flex: 'none' }} />
  );
}

/** Der bayrische Steckbrief eines Spezls, zeigt nur, was ausgefüllt ist. */
export function Steckbrief({ daten }: { daten: SteckbriefDaten }) {
  if (steckbriefLeer(daten)) return null;
  const zeilen: Array<{ icon: React.ReactNode; label: string; wert: string }> = [];
  if (daten.herkunft) zeilen.push({ icon: '📍', label: 'Herkunft', wert: daten.herkunft });
  if (daten.verein === 'bayern' || daten.verein === 'sechzig') {
    zeilen.push({
      icon: <Logo src={daten.verein === 'bayern' ? '/brand/vereine/fcb.png' : '/brand/vereine/1860.png'} />,
      label: 'Verein',
      wert: daten.verein === 'bayern' ? 'FC Bayern' : 'TSV 1860',
    });
  } else if (daten.verein) {
    zeilen.push({ icon: '⚽', label: 'Verein', wert: daten.verein });
  }
  if (daten.lieblingsbier) {
    const logo = bierLogo(daten.lieblingsbier);
    zeilen.push({ icon: logo ? <Logo src={logo} /> : '🍺', label: 'Helles', wert: daten.lieblingsbier });
  }
  if (daten.lieblingsweissbier) {
    const logo = bierLogo(daten.lieblingsweissbier);
    zeilen.push({ icon: logo ? <Logo src={logo} /> : '🍺', label: 'Weißbier', wert: daten.lieblingsweissbier });
  }
  if (daten.leibspeise) zeilen.push({ icon: '🥘', label: 'Leibspeise', wert: daten.leibspeise });
  if (daten.lieblingsbiergarten) zeilen.push({ icon: '🌳', label: 'Biergarten', wert: daten.lieblingsbiergarten });
  if (daten.lieblingswirtshaus) zeilen.push({ icon: '🏠', label: 'Wirtshaus', wert: daten.lieblingswirtshaus });
  if (daten.schafkopfer) zeilen.push({ icon: <Logo src="/brand/vereine/eichel.png" />, label: 'Schafkopf', wert: 'Karteln? Freilich!' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {zeilen.map((z, i) => (
        <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: i < zeilen.length - 1 || daten.beschreibung ? '1px solid var(--ink-100)' : 'none' }}>
          <span style={{ width: 24, display: 'inline-flex', justifyContent: 'center', fontSize: 15, flex: 'none' }}>{z.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)', width: 78, flex: 'none' }}>
            {z.label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', minWidth: 0 }}>{z.wert}</span>
        </div>
      ))}
      {daten.beschreibung && (
        <div style={{ padding: '10px 2px 2px', fontFamily: 'var(--font-quote)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.5 }}>
          „{daten.beschreibung}“
        </div>
      )}
    </div>
  );
}
