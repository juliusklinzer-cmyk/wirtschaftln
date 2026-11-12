/**
 * Hero oben auf Dahoam und Termin: am Handy die Navy-Karte mit Goldrand und
 * Rautenband, ab Tablet ein Band über die ganze Breite mit dem Foto vom
 * Wirtshaus (Google Places), sonst dem Panorama (Responsive Redesign 1a, 2a).
 * Der Kopf mit den Tabs liegt dann durchsichtig drüber (globals.css).
 *
 * `rechts` (Responsive 1a, 12.11.2026): am Handy steht's einfach unter dem
 * Inhalt, ab Desktop rechts unten neben dem Titel („4 dabei · Toni offen“).
 */
export function HeroBand({ bild = null, pad = '14px 20px 22px', rechts = null, children }: { bild?: string | null; pad?: string; rechts?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="wn-hero" style={bild ? ({ ['--wn-hero-bild' as string]: `url(${JSON.stringify(bild)})` } as React.CSSProperties) : undefined}>
      <div className="wn-raute wn-raute--sm" aria-hidden style={{ height: 8 }} />
      <div className="wn-hero-inhalt" style={{ padding: pad }}>
        <div className="wn-hero-links">{children}</div>
        {rechts && <div className="wn-hero-rechts">{rechts}</div>}
      </div>
    </div>
  );
}
