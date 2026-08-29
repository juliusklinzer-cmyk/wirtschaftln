'use client';

import { Avatar } from '@/components/ds';
import { BadgeBild } from '@/components/domain/BadgeBild';

export type HallOfFameEintrag = { name: string; photoUrl: string | null; zeitraum: string; aktiv: boolean };

/** Zähler-Rangliste im Badge (z. B. Moshammer: geschmissene Runden je Spezl). */
export type ZaehlerEintrag = { name: string; photoUrl: string | null; saison: number; gesamt: number; aktiv: boolean };
export type ZaehlerBlock = { titel: string; hinweis: string; einheit: string; eintraege: ZaehlerEintrag[] };

export type BadgeInfoDaten = {
  key: string;
  art: 'badge' | 'amt';
  /** PNG-Slug für BadgeBild (Ämter: Patron-Grafik amt-…), null = goldene Icon-Disc. */
  slug: string | null;
  icon: string;
  name: string;
  untertitel: string;
  text: string;
  pflicht: string | null;
  duties: string | null;
  hallOfFame: HallOfFameEintrag[];
  /** Optionale Zähler-Rangliste hinter der Hall of Fame (z. B. Runden beim Moshammer). */
  zaehler?: ZaehlerBlock | null;
};

/** Amts-Titel → Schlüssel in den badgeInfos (eigene Ämter haben kein Info-Fenster). */
export function amtKey(titel: string): string | null {
  if (titel === 'Präsident') return 'amt:praesident';
  if (titel === 'Schriftführer') return 'amt:schriftfuehrer';
  if (titel.startsWith('Kassenwart')) return 'amt:kassenwart';
  return null;
}

/**
 * Strahlenkranz als conic-gradient: 24 Strahlen à 6° mit Lücken.
 * Ämter: durchgehend Gold. Badges: bayrisch, Weiß und Blau im Wechsel.
 */
function strahlenGradient(art: 'badge' | 'amt'): string {
  const gold = 'rgba(230,198,132,0.30)';
  const weiss = 'rgba(255,255,255,0.30)';
  const blau = 'rgba(66,148,213,0.38)';
  const stops: string[] = [];
  for (let g = 0; g < 24; g++) {
    const von = g * 15;
    const farbe = art === 'amt' ? gold : g % 2 ? blau : weiss;
    stops.push(`${farbe} ${von}deg ${von + 6}deg`, `transparent ${von + 6}deg ${von + 15}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
}

/**
 * Badge-Bühne (Vollbild, Julius 29.08.2026): Badge/Amt in voller Größe vor
 * einem DURCHGEHEND rotierenden Schein — Ämter golden, Badges weiß-blau
 * (bayrisch). Beschreibung, Pflichten und Hall of Fame erscheinen erst hier;
 * die Listen draußen zeigen nur noch das Nötigste.
 */
export function BadgeInfo({ info, onClose }: { info: BadgeInfoDaten; onClose: () => void }) {
  const amt = info.art === 'amt';
  const halter = info.hallOfFame.find((h) => h.aktiv) ?? null;
  const glut = amt ? 'rgba(230,198,132,0.30)' : 'rgba(120,180,235,0.30)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 70, overflowY: 'auto', overscrollBehavior: 'contain',
        background: 'radial-gradient(circle at 50% 24%, #10305F 0%, var(--navy-900) 62%)',
        animation: 'wnBuehneAuf 240ms ease-out both',
      }}
    >
      <style>{`
        @keyframes wnBuehneAuf { from { opacity: 0; } }
        @keyframes wnScheinDreht { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wnBadgeAuftritt { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes wnBuehneZeile { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .wn-schein { animation: none !important; }
        }
      `}</style>

      {/* Rauten-Band oben — a bayrische Bühne braucht ihr Band */}
      <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />

      <button
        onClick={onClose}
        aria-label="Schließen"
        className="wn-press"
        style={{
          position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', right: 16, zIndex: 3,
          width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.28)',
          background: 'rgba(255,255,255,0.12)', color: 'var(--pergament)', fontSize: 18, fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>

      {/* Alles im Inneren fängt den Klick ab — zua geht's über × oder den Rand */}
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, margin: '0 auto', padding: '30px 22px calc(30px + env(safe-area-inset-bottom))' }}>
        {/* ── Die Bühne: Schein + Badge ── */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 26 }}>
          {/* Durchgehend rotierender Strahlenkranz + weiche Glut */}
          <div aria-hidden style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 360, height: 360, pointerEvents: 'none' }}>
            <div
              className="wn-schein"
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: strahlenGradient(info.art),
                animation: 'wnScheinDreht 22s linear infinite',
                maskImage: 'radial-gradient(circle, black 30%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 72%)',
              }}
            />
            <div style={{ position: 'absolute', inset: 40, borderRadius: '50%', background: `radial-gradient(circle, ${glut} 0%, transparent 65%)` }} />
          </div>

          <div style={{ position: 'relative', animation: 'wnBadgeAuftritt 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            {info.slug ? (
              <BadgeBild slug={info.slug} icon={info.icon} name={info.name} size={230} />
            ) : (
              <span style={{ width: 180, height: 180, borderRadius: '50%', background: 'var(--grad-gold)', border: '4px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 84 }}>
                {info.icon}
              </span>
            )}
          </div>

          <div style={{ position: 'relative', textAlign: 'center', marginTop: 18, animation: 'wnBuehneZeile 320ms 120ms ease-out both' }}>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 36, color: 'var(--gold-bright)', lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
              {info.name}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.85, marginTop: 6 }}>
              {info.untertitel}
            </div>
          </div>

          {/* Wer's grad tragt */}
          <div style={{ position: 'relative', marginTop: 16, animation: 'wnBuehneZeile 320ms 200ms ease-out both' }}>
            {halter ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px 9px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1.5px solid var(--gold)' }}>
                <Avatar src={halter.photoUrl} name={halter.name} size={34} ring />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pergament)', lineHeight: 1.2 }}>{halter.name}</div>
                  <div className="wn-tnum" style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-bright)' }}>{halter.zeitraum}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pergament)', opacity: 0.7, fontStyle: 'italic' }}>
                No ned vergeben — vielleicht du beim nächsten Stammtisch?
              </div>
            )}
          </div>
        </div>

        {/* ── G'schichtl & Pflichten ── */}
        <div style={{ marginTop: 26, animation: 'wnBuehneZeile 320ms 280ms ease-out both' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--pergament)', opacity: 0.92, lineHeight: 1.65 }}>{info.text}</div>
          {info.duties && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--pergament)', opacity: 0.75, lineHeight: 1.55 }}>{info.duties}</div>
          )}
          {info.pflicht && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(208,173,102,0.14)', border: '1px solid var(--border-on-dark)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.5 }}>
              {info.pflicht}
            </div>
          )}
        </div>

        {/* ── Hall of Fame ── */}
        <div style={{ marginTop: 24, animation: 'wnBuehneZeile 320ms 360ms ease-out both' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--gold-bright)', lineHeight: 1 }}>Hall of Fame</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pergament)', opacity: 0.65 }}>wer’s wia lang g’halten hat</span>
          </div>
          {info.hallOfFame.length === 0 ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pergament)', opacity: 0.65, textAlign: 'center', padding: '8px 0' }}>
              No koaner, vielleicht du beim nächsten Stammtisch?
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {info.hallOfFame.map((h, i) => (
                <div
                  key={`${h.name}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: h.aktiv ? 'rgba(208,173,102,0.14)' : 'rgba(255,255,255,0.06)',
                    border: h.aktiv ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <Avatar src={h.photoUrl} name={h.name} size={30} ring={h.aktiv} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--pergament)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.name}
                  </span>
                  <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 700, color: h.aktiv ? 'var(--gold-bright)' : 'var(--pergament)', opacity: h.aktiv ? 1 : 0.65, whiteSpace: 'nowrap' }}>
                    {h.zeitraum}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Zähler-Rangliste (z. B. Runden beim Moshammer) ── */}
        {info.zaehler && (
          <div style={{ marginTop: 24, animation: 'wnBuehneZeile 320ms 420ms ease-out both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--gold-bright)', lineHeight: 1 }}>{info.zaehler.titel}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pergament)', opacity: 0.65 }}>{info.zaehler.hinweis}</span>
            </div>
            {info.zaehler.eintraege.length === 0 ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pergament)', opacity: 0.65, textAlign: 'center', padding: '8px 0' }}>
                No koa oanzige, wer mocht’n Anfang?
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {info.zaehler.eintraege.map((z, i) => (
                  <div
                    key={z.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: z.aktiv ? 'rgba(208,173,102,0.14)' : 'rgba(255,255,255,0.06)',
                      border: z.aktiv ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--r-md)',
                    }}
                  >
                    <span className="wn-tnum" style={{ width: 20, textAlign: 'center', fontSize: 13, fontWeight: 800, color: i === 0 ? 'var(--gold-bright)' : 'var(--pergament)', opacity: i === 0 ? 1 : 0.65, flex: 'none' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                    <Avatar src={z.photoUrl} name={z.name} size={30} ring={z.aktiv} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--pergament)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {z.name}
                    </span>
                    <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 700, color: z.aktiv ? 'var(--gold-bright)' : 'var(--pergament)', opacity: z.aktiv ? 1 : 0.65, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {z.saison} heier{z.gesamt !== z.saison ? ` · ${z.gesamt} gsamt` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
