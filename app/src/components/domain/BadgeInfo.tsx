'use client';

import { Avatar, Icon, ZeilenKarte } from '@/components/ds';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { bereichHinweisStil } from '@/components/domain/hero-stil';

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

const karte: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };

/**
 * Badge-Info & Hall of Fame (Rang-Redesign 1c/2d): Navy-Kopf mit der Grafik
 * groß im Strahlenkranz, wofür es vergeben wird und wer’s grad trägt; heller
 * Teil mit Pflicht, Geschichte, Hall of Fame und (bei Ämtern) den Pflichten als Liste.
 */
export function BadgeInfo({ info, onClose }: { info: BadgeInfoDaten; onClose: () => void }) {
  const amt = info.art === 'amt';
  const halter = info.hallOfFame.find((h) => h.aktiv) ?? null;
  const pflichten = info.duties ? info.duties.split(' · ').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="wn-scroll-still" style={{ position: 'fixed', inset: 0, zIndex: 70, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', overflowY: 'auto', overscrollBehavior: 'contain', animation: 'wnBuehneAuf 260ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
      <style>{`
        @keyframes wnBuehneAuf { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes wnScheinDreht { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wnBadgeAuftritt { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .wn-schein { animation: none !important; } }
      `}</style>

      {/* Navy-Kopf: Strahlenkranz, Grafik, Name, Träger */}
      <div style={{ position: 'relative', background: 'radial-gradient(circle at 50% 30%, #123E78 0%, #07193A 75%)', color: 'var(--pergament)', padding: 'calc(16px + env(safe-area-inset-top)) 20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <button type="button" onClick={onClose} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', right: 16, top: 'calc(14px + env(safe-area-inset-top))', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
          <Icon name="x" size={18} />
        </button>
        <div style={{ position: 'relative', width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <div className="wn-schein" aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(230,198,132,0.2) 0 12deg, transparent 12deg 30deg)', animation: 'wnScheinDreht 24s linear infinite' }} />
          <div style={{ position: 'relative', animation: 'wnBadgeAuftritt 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            {info.slug ? (
              amt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/brand/badges/${info.slug}.png`} alt={info.name} style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)' }} />
              ) : (
                <BadgeBild slug={info.slug} icon={info.icon} name={info.name} size={190} />
              )
            ) : (
              <span style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--grad-gold)', border: '4px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 76 }}>{info.icon}</span>
            )}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 40, lineHeight: 1, color: 'var(--gold-bright)' }}>{info.name}</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>{info.untertitel}</span>
        {halter ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Avatar src={halter.photoUrl} name={halter.name} size={28} ring />
            <span style={{ fontSize: 14, fontWeight: 800 }}>{halter.name} trägt es {halter.zeitraum}</span>
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, fontStyle: 'italic', marginTop: 6 }}>Noch nicht vergeben, vielleicht du beim nächsten Stammtisch?</span>
        )}
      </div>
      <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />

      <div style={{ padding: '20px 16px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {info.pflicht && (
          <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--pergament)', border: '1.5px solid var(--gold)', display: 'flex', gap: 12 }}>
            <Icon name="scroll" size={22} color="var(--gold-700)" style={{ flex: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Pflicht</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{info.pflicht}</span>
            </div>
          </div>
        )}

        {pflichten.length > 0 && (
          <div style={{ ...karte, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pflichten.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="check-circle" size={18} color="var(--gold)" style={{ flex: 'none', marginTop: 1 }} />
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-900)' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </div>
            ))}
          </div>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel>Geschichte</HoamTitel>
          <div style={{ ...karte, padding: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: 'var(--ink-700)' }}>{info.text}</span>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>wer’s wie lang hatte</span>}>Hall of Fame</HoamTitel>
          {info.hallOfFame.length === 0 ? (
            <div style={{ ...karte, padding: 16, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>Noch niemand, vielleicht du beim nächsten Stammtisch?</div>
          ) : (
            <ZeilenKarte>
              {info.hallOfFame.map((h, i) => (
                <div key={`${h.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, borderBottom: i < info.hallOfFame.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
                  <Avatar src={h.photoUrl} name={h.name} size={36} ring={h.aktiv} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                    <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{h.zeitraum}</span>
                  </div>
                  {h.aktiv && <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)', whiteSpace: 'nowrap', flex: 'none' }}>aktuell</span>}
                </div>
              ))}
            </ZeilenKarte>
          )}
        </section>

        {info.zaehler && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel action={<span style={bereichHinweisStil}>{info.zaehler.hinweis}</span>}>{info.zaehler.titel}</HoamTitel>
            {info.zaehler.eintraege.length === 0 ? (
              <div style={{ ...karte, padding: 16, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>Noch keine, wer macht den Anfang?</div>
            ) : (
              <ZeilenKarte>
                {info.zaehler.eintraege.map((z, i) => (
                  <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, borderBottom: i < info.zaehler!.eintraege.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
                    <span className="wn-tnum" style={{ width: 24, textAlign: 'center', fontSize: 15, fontWeight: 800, color: i === 0 ? 'var(--gold-700)' : 'var(--ink-300)', flex: 'none' }}>{i + 1}</span>
                    <Avatar src={z.photoUrl} name={z.name} size={36} ring={z.aktiv} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
                    <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                      {z.saison} {info.zaehler!.einheit}{z.gesamt !== z.saison ? <span style={{ fontWeight: 600, color: 'var(--ink-300)' }}> · {z.gesamt} gesamt</span> : null}
                    </span>
                  </div>
                ))}
              </ZeilenKarte>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
