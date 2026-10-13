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

/**
 * Der bayrische Steckbrief eines Spezls (Rang-Redesign 1b): Zeilen mit Begriff
 * links in Grau, Wert rechts fett, Logos wo's eins gibt, drunter der Spruch
 * in Fraktur. Zeigt nur, was ausgefüllt ist.
 */
export function Steckbrief({ daten, logos = true }: { daten: SteckbriefDaten; /** Brauerei-Logos (nur Gründer) */ logos?: boolean }) {
  if (steckbriefLeer(daten)) return null;
  const zeilen: Array<{ logo?: string | null; label: string; wert: string }> = [];
  if (daten.herkunft) zeilen.push({ label: 'Viertel', wert: daten.herkunft });
  if (daten.lieblingsbier) zeilen.push({ logo: logos ? bierLogo(daten.lieblingsbier) : null, label: 'Lieblingsbier', wert: daten.lieblingsbier });
  if (daten.lieblingsweissbier) zeilen.push({ logo: logos ? bierLogo(daten.lieblingsweissbier) : null, label: 'Weißbier', wert: daten.lieblingsweissbier });
  if (daten.leibspeise) zeilen.push({ label: 'Leibspeise', wert: daten.leibspeise });
  if (daten.lieblingsbiergarten) zeilen.push({ label: 'Biergarten', wert: daten.lieblingsbiergarten });
  if (daten.lieblingswirtshaus) zeilen.push({ label: 'Wirtshaus', wert: daten.lieblingswirtshaus });
  if (daten.verein === 'bayern' || daten.verein === 'sechzig') {
    zeilen.push({ logo: daten.verein === 'bayern' ? '/brand/vereine/fcb.png' : '/brand/vereine/1860.png', label: 'Verein', wert: daten.verein === 'bayern' ? 'FC Bayern' : 'TSV 1860' });
  } else if (daten.verein) {
    zeilen.push({ label: 'Verein', wert: daten.verein });
  }
  if (daten.schafkopfer) zeilen.push({ logo: '/brand/vereine/eichel.png', label: 'Schafkopf', wert: 'Ja' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {zeilen.map((z, i) => (
        <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, borderBottom: i < zeilen.length - 1 || daten.beschreibung ? '1px solid var(--ink-50)' : 'none' }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink-500)' }}>{z.label}</span>
          {z.logo && <Logo src={z.logo} />}
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', minWidth: 0, textAlign: 'right' }}>{z.wert}</span>
        </div>
      ))}
      {daten.beschreibung && (
        <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-fraktur)', fontSize: 20, lineHeight: 1.3, color: 'var(--navy)' }}>„{daten.beschreibung}“</p>
      )}
    </div>
  );
}
