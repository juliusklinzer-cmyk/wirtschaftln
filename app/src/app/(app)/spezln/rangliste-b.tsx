'use client';

import { useEffect, useState } from 'react';
import { Avatar, SegmentedTabs, SectionHeader, Icon } from '@/components/ds';
import { StreakChip } from '@/components/domain/StreakChip';
import { SchrumpfKopf, MiniKopfLeiste } from '@/components/domain/SchrumpfKopf';
import { SerienLeiste } from '@/components/domain/BadgeBild';
import { BadgeInfo, amtKey, type BadgeInfoDaten } from '@/components/domain/BadgeInfo';
import { PunkteInfo } from '@/components/domain/PunkteInfo';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { Steckbrief, steckbriefLeer } from '@/components/domain/Steckbrief';
import {
  Siegel,
  Delta,
  MEDAILLE,
  VEREIN_LOGO,
  METRIKEN,
  type Metrik,
  type SpezlEintrag,
  type AmtEintrag,
  type GalerieBadge,
  type StatsBlock,
} from './rangliste';

/**
 * D’Rangliste (Variante B, von Julius am 19.07.2026 gewählt):
 * ruhige Karten ohne Geister-Rangzahl, ohne Farbkanten und Medaillen-Rahmen;
 * die eigene Karte ist eine Navy-Gold-Karte (statt „Du"-Badge); kompakter
 * Sticky-Filter: Wertungs-Tabs + ⇄-Switch in EINER Zeile.
 */
export function Rangliste({
  eintraege,
  aemter,
  galerie,
  badgeInfos,
  saisonLabel,
}: {
  eintraege: SpezlEintrag[];
  aemter: AmtEintrag[];
  galerie: GalerieBadge[];
  badgeInfos: Record<string, BadgeInfoDaten>;
  saisonLabel: string;
}) {
  const [zeitraum, setZeitraum] = useState<'saison' | 'allzeit'>('saison');
  const [metrik, setMetrik] = useState<Metrik>('punkte');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [eingeschwungen, setEingeschwungen] = useState(false);
  useEffect(() => {
    setEingeschwungen(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEingeschwungen(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [zeitraum, metrik]);

  const einheit = METRIKEN.find((m) => m.value === metrik)!.einheit;
  const ranked = [...eintraege].sort((a, b) => b[zeitraum][metrik] - a[zeitraum][metrik]);
  const detail = detailId ? ranked.find((e) => e.id === detailId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader eyebrow={zeitraum === 'saison' ? saisonLabel : 'Allzeit'} title="D’Rangliste" fraktur action={<PunkteInfo />} />

      {/* Sticky-Filter: Tabs + Saison/Allzeit-Switch in einer Zeile */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 15,
          margin: '0 -16px', padding: '10px 16px',
          background: 'var(--bg-app)', borderBottom: '1px solid var(--ink-100)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <SegmentedTabs
            value={metrik}
            onChange={(v) => setMetrik(v as Metrik)}
            tabs={METRIKEN.map((m) => ({ label: m.label, value: m.value }))}
            fullWidth
          />
        </div>
        <button
          onClick={() => setZeitraum((z) => (z === 'saison' ? 'allzeit' : 'saison'))}
          title="Zwischen Saison und Allzeit wechseln"
          style={{
            flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            border: '1.5px solid var(--ink-200)', background: 'var(--weiss)',
            borderRadius: 'var(--r-pill)', padding: '7px 12px', boxShadow: 'var(--sh-xs)',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)',
          }}
        >
          {zeitraum === 'saison' ? 'Saison' : 'Allzeit'}
          <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>⇄</span>
        </button>
      </div>

      {ranked.map((e, i) => {
        const rank = i + 1;
        const s = e[zeitraum];
        const medal = MEDAILLE[rank];
        const ich = e.istIch;
        const textHaupt = ich ? 'var(--gold-bright)' : 'var(--navy)';
        const textNeben = ich ? 'rgba(246,240,226,0.8)' : undefined;
        return (
          <div
            key={e.id}
            style={{
              transform: eingeschwungen || metrik !== 'punkte' ? 'translateY(0)' : `translateY(${s.deltaRang * 78}px)`,
              transition: eingeschwungen ? 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              position: 'relative',
              zIndex: s.deltaRang !== 0 ? 2 : 1,
            }}
          >
            <div
              onClick={() => setDetailId(e.id)}
              style={{
                borderRadius: 'var(--r-lg)', cursor: 'pointer',
                background: ich ? 'var(--grad-navy)' : 'var(--weiss)',
                border: ich ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
                boxShadow: ich ? 'var(--sh-md)' : 'var(--sh-sm)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Medaille (Top 3) bzw. schlichte Rangzahl */}
                <div style={{ flex: 'none', width: 30, display: 'flex', justifyContent: 'center' }}>
                  {medal ? (
                    <span className="wn-tnum" style={{ width: 28, height: 28, borderRadius: '50%', background: medal.disc, color: medal.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, boxShadow: 'var(--sh-xs)' }}>
                      {rank}
                    </span>
                  ) : (
                    <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: ich ? 'rgba(246,240,226,0.6)' : 'var(--ink-300)' }}>{rank}</span>
                  )}
                </div>
                <div style={{ position: 'relative', flex: 'none' }}>
                  <Avatar src={e.photoUrl} name={e.name} size={rank <= 3 ? 52 : 44} ring={rank === 1} verein={e.steckbrief.verein} />
                  {e.steckbrief.verein ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={VEREIN_LOGO[e.steckbrief.verein]} alt="" style={{ position: 'absolute', right: -4, bottom: -2, width: 18, height: 18, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 2, boxShadow: 'var(--sh-sm)' }} />
                  ) : (
                    <span style={{ position: 'absolute', right: -4, bottom: -2, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, background: '#fff', borderRadius: '50%', boxShadow: 'var(--sh-sm)' }}>🥨</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: rank <= 3 ? 22 : 20, color: textHaupt, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: e.amt ? 'var(--gold-700)' : (textNeben ?? 'var(--ink-500)'), marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.amt ? e.amt.titel : 'Mitglied'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                    {s.streak !== 0 && <StreakChip streak={s.streak} size="sm" wackelt={s.unentschuldigtStreak >= 3} />}
                    <SerienLeiste serien={e.serien} size={20} />
                  </div>
                </div>
                <div style={{ flex: 'none', textAlign: 'right' }}>
                  <div className="wn-tnum" style={{ fontSize: rank <= 3 ? 26 : 22, fontWeight: 800, color: textHaupt, lineHeight: 1 }}>{s[metrik]}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: ich ? 'var(--gold)' : 'var(--gold-700)', marginBottom: 2 }}>{einheit}</div>
                  {metrik === 'punkte' && <Delta s={s} />}
                </div>
              </div>

              {e.badges.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: ich ? '1px solid rgba(246,240,226,0.2)' : '1px solid var(--ink-100)', flexWrap: 'wrap' }}>
                  {e.badges.map((b) => (
                    <span key={b.name} onClick={(ev) => { ev.stopPropagation(); setInfoKey(b.key); }} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      <Siegel badge={b} size={26} mitLabel={false} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Die Ämter, identisch zu Stil A */}
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 10px' }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--navy)', lineHeight: 1 }}>Die Ämter</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>· gewählt & automatisch</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {aemter.map((a) => (
            <div key={a.titel} onClick={() => amtKey(a.titel) && setInfoKey(amtKey(a.titel))} style={{ display: 'flex', gap: 14, background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 14, cursor: amtKey(a.titel) ? 'pointer' : 'default' }}>
              {a.slug ? (
                <div style={{ flex: 'none', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/brand/badges/${a.slug}.png`} alt={a.patron ?? a.titel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ flex: 'none', width: 52, height: 52, borderRadius: 'var(--r-pill)', background: 'var(--grad-gold)', border: '2px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {a.icon}
                </div>
              )}
              {/* Nur des Nötigste (Julius 29.08.): Name, Patron, wer's grad is.
                  Pflichten & Historie zeigt erst d'Badge-Bühne beim Antippen. */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', lineHeight: 1 }}>{a.titel}</div>
                {a.patron && (
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-700)', marginTop: 4 }}>
                    Patron · {a.patron}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  {a.holder ? (
                    <>
                      <Avatar src={a.holder.photoUrl} name={a.holder.name} size={28} ring />
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{a.holder.name}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', fontStyle: 'italic' }}>
                      No unbesetzt, wird nach’m ersten Stammtisch vergeben
                    </span>
                  )}
                </div>
              </div>
              {amtKey(a.titel) && (
                <span className="wn-klappe-pfeil" style={{ flex: 'none', alignSelf: 'center', display: 'inline-flex', color: 'var(--ink-300)' }}>
                  <Icon name="chevron" size={16} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Saison-Badges, identisch zu Stil A */}
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 10px' }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--navy)', lineHeight: 1 }}>Saison-Badges</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>· wandern automatisch weiter</span>
        </div>
        {/* Variante B: nur das Badge groß + wofür's vergeben wird, wer's grad
            trägt und alles Weitere zeigt der Klick (Info + Hall of Fame) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {galerie.map((b) => (
            <div
              key={b.name}
              onClick={() => setInfoKey(b.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                padding: '14px 10px 12px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                background: b.holder ? 'var(--grad-navy)' : 'var(--ink-50)',
                border: b.holder ? '1.5px solid var(--gold)' : '1.5px solid var(--ink-200)',
                boxShadow: b.holder ? 'var(--sh-md)' : 'none',
              }}
            >
              {/* Nur's Badge + wer's grad tragt (Julius 29.08.), alles Weitere
                  zeigt d'Badge-Bühne beim Antippen */}
              <div style={{ filter: b.holder ? 'none' : 'grayscale(1)', opacity: b.holder ? 1 : 0.45 }}>
                <BadgeBild slug={b.key} icon={b.icon} name={b.name} size={116} />
              </div>
              {b.holder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, maxWidth: '100%' }}>
                  <Avatar src={b.holder.photoUrl} name={b.holder.name} size={22} ring />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--pergament)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.holder.name}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 10 }}>
                  no ned vergeben
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {detail && (
        <SpezlDetailB
          e={detail}
          rank={ranked.indexOf(detail) + 1}
          s={detail[zeitraum]}
          saisonLabel={zeitraum === 'saison' ? saisonLabel : 'Allzeit'}
          onClose={() => setDetailId(null)}
          onInfo={setInfoKey}
        />
      )}
      {infoKey && badgeInfos[infoKey] && <BadgeInfo info={badgeInfos[infoKey]} onClose={() => setInfoKey(null)} />}
    </div>
  );
}

/* ── Spezl-Detail VARIANTE B: „Urkunden"-Sheet, Rauten-Band, großer Avatar mit
      Rang-Medaille, Fraktur-Name, WP mit Feder-Pop, große Badge-Grafiken ── */
function SpezlDetailB({
  e,
  rank,
  s,
  saisonLabel,
  onClose,
  onInfo,
}: {
  e: SpezlEintrag;
  rank: number;
  s: StatsBlock;
  saisonLabel: string;
  onClose: () => void;
  onInfo: (key: string) => void;
}) {
  const medal = MEDAILLE[rank];
  const stats = [
    { icon: '🍺', value: s.hoiben, label: 'Hoibe' },
    { icon: '🎟️', value: s.abende, label: 'Abende' },
    { icon: '🏠', value: s.wirtshaeuser, label: 'Wirtshäuser' },
    { icon: '📋', value: s.organisiert, label: 'Organisiert' },
    { icon: '🍻', value: s.runden, label: 'Runden' },
    { icon: '🚕', value: s.taxi, label: 'Gfahren' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <style>{`
        @keyframes wnSheetRein { from { transform: translateY(26px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes wnFederPop { 0% { transform: scale(0.4); opacity: 0; } 62% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes wnZeileRein { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,25,58,0.6)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, maxHeight: '88dvh', overflowY: 'auto', background: 'var(--weiss)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-lg)', animation: 'wnSheetRein 320ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
        {/* ── Kopf: Navy-Zeremonie mit Rauten-Band. Scrollt weg, dafür kommt die
            Mini-Leiste (SchrumpfKopf), damit auf kleinen Handys gnua Platz bleibt. ── */}
        <SchrumpfKopf
          kompakt={
            <MiniKopfLeiste
              photoUrl={e.photoUrl}
              name={e.name}
              wp={s.punkte}
              verein={e.steckbrief.verein}
              rechts={
                <button onClick={onClose} aria-label="Schließen" style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              }
            />
          }
        >
        <div style={{ position: 'relative', background: 'var(--grad-navy)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', overflow: 'hidden', paddingBottom: 18 }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
          <button onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 15, right: 12, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', zIndex: 2 }}>
            ×
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 0' }}>
            <div style={{ position: 'relative', animation: 'wnFederPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              <Avatar src={e.photoUrl} name={e.name} size={88} ring={rank === 1} verein={e.steckbrief.verein} />
              {e.steckbrief.verein ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={VEREIN_LOGO[e.steckbrief.verein]} alt="" style={{ position: 'absolute', left: -4, bottom: 2, width: 24, height: 24, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 2, boxShadow: 'var(--sh-sm)' }} />
              ) : (
                <span style={{ position: 'absolute', left: -4, bottom: 2, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: '#fff', borderRadius: '50%', boxShadow: 'var(--sh-sm)' }}>🥨</span>
              )}
              <span
                className="wn-tnum"
                style={{
                  position: 'absolute', right: -6, bottom: 0, width: 30, height: 30, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, border: '2px solid var(--navy-900)',
                  background: medal ? medal.disc : 'var(--weiss)',
                  color: medal ? medal.fg : 'var(--navy)', boxShadow: 'var(--sh-sm)',
                }}
              >
                {rank}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 32, color: 'var(--gold-bright)', lineHeight: 1.1, marginTop: 12, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {e.name}
            </div>
            {e.vollerName && e.vollerName !== e.name && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pergament)', opacity: 0.85, marginTop: 4 }}>
                {e.vollerName}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.85, marginTop: 6 }}>
              {e.amt ? e.amt.titel : 'Mitglied'} · {saisonLabel}
            </div>

            {/* WP mit Feder-Pop */}
            <div style={{ textAlign: 'center', marginTop: 12, animation: 'wnFederPop 500ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              <span className="wn-tnum" style={{ fontSize: 44, fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1 }}>{s.punkte}</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginLeft: 6 }}>WP</span>
              <Delta s={s} gross />
            </div>
            {s.streak !== 0 && (
              <div style={{ marginTop: 10 }}>
                <StreakChip streak={s.streak} bestStreak={s.bestStreak} wackelt={s.unentschuldigtStreak >= 3} />
              </div>
            )}
          </div>
        </div>
        </SchrumpfKopf>
        {/* Gold-Haarlinie als Zeremonie-Trenner */}
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

        <div style={{ padding: '16px 18px 0' }}>
          {s.unentschuldigtStreak >= 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', animation: 'wnZeileRein 320ms 100ms ease-out both' }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--strafe)', lineHeight: 1.4 }}>
                {s.unentschuldigtStreak}× unentschuldigt gfehlt, der Spezl wackelt.
              </span>
            </div>
          )}

          {/* Stat-Kacheln, sanft gestaffelt */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {stats.map((st, i) => (
              <div key={st.label} style={{ textAlign: 'center', padding: '11px 4px', background: 'var(--pergament)', borderRadius: 'var(--r-md)', animation: `wnZeileRein 320ms ${120 + i * 45}ms ease-out both` }}>
                <div style={{ fontSize: 17 }}>{st.icon}</div>
                <div className="wn-tnum" style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', lineHeight: 1, marginTop: 4 }}>{st.value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Auszeichnungen: große Grafiken, Details beim Antippen */}
          {(e.badges.length > 0 || e.serien.length > 0) && (
            <div style={{ animation: 'wnZeileRein 320ms 380ms ease-out both' }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', margin: '18px 0 10px' }}>D’Auszeichnungen</div>
              {e.badges.length > 0 && (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                  {e.badges.map((b) => (
                    <span key={b.name} onClick={() => onInfo(b.key)} style={{ cursor: 'pointer', flex: 'none' }}>
                      <Siegel badge={b} size={86} mitLabel={false} />
                    </span>
                  ))}
                </div>
              )}
              {e.serien.length > 0 && (
                <div style={{ marginTop: e.badges.length > 0 ? 8 : 0 }}>
                  <SerienLeiste serien={e.serien} size={44} />
                </div>
              )}
            </div>
          )}

          {/* Steckbrief */}
          {!steckbriefLeer(e.steckbrief) && (
            <div style={{ animation: 'wnZeileRein 320ms 460ms ease-out both' }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', margin: '18px 0 8px' }}>Da Steckbrief</div>
              <Steckbrief daten={e.steckbrief} />
            </div>
          )}
        </div>

        {/* Rauten-Band als Abschluss der Urkunde */}
        <div className="wn-raute wn-raute--sm" style={{ height: 7, marginTop: 18 }} />
      </div>
    </div>
  );
}
