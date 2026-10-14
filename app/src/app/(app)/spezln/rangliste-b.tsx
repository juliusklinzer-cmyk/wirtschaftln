'use client';

import { useState } from 'react';
import { Avatar, Icon, Segment, ZeilenKarte } from '@/components/ds';
import { BadgeInfo, amtKey, type BadgeInfoDaten } from '@/components/domain/BadgeInfo';
import { PunkteInfo } from '@/components/domain/PunkteInfo';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { SpezlAvatar, DeltaText, anzeigeName, RANG_FARBE, PodestSpalte, ListenZeile, PODEST_H, PODEST_HOEHE, PODEST_AVATAR } from './rang-bausteine';
import { useRangWechsel, PodestWechsel, ListeWechsel, RangToast, ENDE_EBENE } from './rang-wechsel';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { steckbriefLeer } from '@/components/domain/Steckbrief';
import { SteckbriefClient as Steckbrief } from '@/components/domain/SteckbriefClient';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { SERIEN_ABZEICHEN } from '@/lib/serien';
import { METRIKEN, type Metrik, type SpezlEintrag, type AmtEintrag, type GalerieBadge, type StatsBlock } from './rangliste';

/**
 * D’Rangliste (Rang-Redesign 13.10.2026, 1a): oben nur Wertung und
 * Saison/Allzeit, die Top 3 als Podest auf Navy, darunter die Liste. Dann
 * d’Ämter, die Saison-Badges mit den echten Grafiken und die Serien-Abzeichen.
 */
export function Rangliste({
  eintraege,
  aemter,
  galerie,
  badgeInfos,
  saisonLabel,
  letzterTerminId,
}: {
  eintraege: SpezlEintrag[];
  aemter: AmtEintrag[];
  galerie: GalerieBadge[];
  badgeInfos: Record<string, BadgeInfoDaten>;
  saisonLabel: string;
  /** Letzter abgeschlossener Abend, Schlüssel für die einmalige Rangwechsel-Animation */
  letzterTerminId: string | null;
}) {
  const [zeitraum, setZeitraum] = useState<'saison' | 'allzeit'>('saison');
  const [metrik, setMetrik] = useState<Metrik>('punkte');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  // Rangwechsel-Animation: nur in der Saison-WP-Ansicht, einmal pro Gerät und Abend
  const wechsel = useRangWechsel(eintraege, letzterTerminId, zeitraum === 'saison' && metrik === 'punkte' && !detailId);
  const ebene = wechsel.t !== null && wechsel.t < ENDE_EBENE && zeitraum === 'saison' && metrik === 'punkte';

  const einheit = METRIKEN.find((m) => m.value === metrik)!.einheit;
  const ranked = [...eintraege].sort((a, b) => b[zeitraum][metrik] - a[zeitraum][metrik]);
  const detail = detailId ? ranked.find((e) => e.id === detailId) : null;
  const podest = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as SpezlEintrag[];
  const rest = ranked.slice(3);
  const ich = eintraege.find((e) => e.istIch) ?? null;
  const kurzLabel = zeitraum === 'saison' ? saisonLabel.replace(/^Saison \d+ · /, 'Saison ') : 'Allzeit';

  const podestSpalte = (e: SpezlEintrag) => {
    const rang = ranked.indexOf(e) + 1;
    return (
      <PodestSpalte
        key={e.id}
        e={e}
        rang={rang}
        s={e[zeitraum]}
        metrik={metrik}
        einheit={einheit}
        groesse={PODEST_AVATAR[rang]}
        hoehe={PODEST_HOEHE[rang]}
        krone={rang === 1}
        stil={{ flex: 1 }}
        onClick={() => setDetailId(e.id)}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Oben nur Wertung + Saison/Allzeit, sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 15, margin: '0 -16px', padding: 'calc(12px + env(safe-area-inset-top)) 16px 8px', background: 'var(--bg-app)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Segment value={metrik} onChange={setMetrik} items={METRIKEN.map((m) => ({ value: m.value, label: m.label }))} />
        </div>
        <button
          type="button"
          onClick={() => setZeitraum((z) => (z === 'saison' ? 'allzeit' : 'saison'))}
          title="Zwischen Saison und Allzeit wechseln"
          className="wn-press"
          style={{ flex: 'none', height: 46, padding: '0 14px', borderRadius: 14, background: 'var(--weiss)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}
        >
          {zeitraum === 'saison' ? 'Saison' : 'Allzeit'}
          <Icon name="arrows-left-right" size={15} />
        </button>
      </div>

      {/* Podest: Top 3 auf Navy mit Rautenband */}
      {podest.length > 0 && (
        <div style={{ borderRadius: 22, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', border: '1.5px solid var(--gold)', overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
          <div style={{ padding: '14px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>{kurzLabel}</span>
            <PunkteInfo
              knopf={(oeffnen) => (
                <button type="button" onClick={oeffnen} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.7)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="info" size={15} />
                  Punktesystem
                </button>
              )}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, margin: '10px 14px 0', height: PODEST_H, pointerEvents: ebene ? 'none' : 'auto' }}>
            {ebene ? <PodestWechsel zeilen={wechsel.zeilen} t={wechsel.t!} einheit={einheit} /> : podest.map(podestSpalte)}
          </div>
        </div>
      )}

      {/* Ab Platz 4 die Liste, eigene Zeile außerhalb der Top 3 navy-gold */}
      {(rest.length > 0 || ebene) && (
        <ZeilenKarte>
          {ebene ? (
            <ListeWechsel zeilen={wechsel.zeilen} t={wechsel.t!} einheit={einheit} />
          ) : (
            rest.map((e, i) => (
              <ListenZeile
                key={e.id}
                e={e}
                rang={i + 4}
                s={e[zeitraum]}
                metrik={metrik}
                einheit={einheit}
                letzte={i === rest.length - 1}
                onClick={() => setDetailId(e.id)}
                onBadge={setInfoKey}
              />
            ))
          )}
        </ZeilenKarte>
      )}

      {/* Die Ämter */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>gewählt & automatisch</span>}>Die Ämter</HoamTitel>
        <ZeilenKarte>
          {aemter.map((a, i) => {
            const key = amtKey(a.titel);
            const halter = a.holder ? eintraege.find((e) => e.name === a.holder!.name) ?? null : null;
            const modus = a.titel === 'Präsident' ? 'automatisch · WP-Rang 1' : a.titel === 'Schriftführer' ? 'automatisch · meiste Abschlüsse' : a.mode.toLowerCase();
            return (
              <div key={a.titel} onClick={() => key && setInfoKey(key)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < aemter.length - 1 ? '1px solid var(--ink-50)' : 'none', cursor: key ? 'pointer' : 'default' }}>
                {a.slug ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/brand/badges/${a.slug}.png`} alt={a.patron ?? a.titel} style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', flex: 'none' }} />
                ) : (
                  <span style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', background: 'var(--grad-gold)', border: '2px solid var(--gold-bright)', boxShadow: 'var(--sh-gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{a.icon}</span>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, lineHeight: 1, color: 'var(--navy)' }}>{a.titel}</span>
                  {a.patron && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Patron · {a.patron}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, minWidth: 0 }}>
                    {a.holder ? (
                      <>
                        {halter ? <SpezlAvatar e={halter} size={22} /> : <Avatar src={a.holder.photoUrl} name={a.holder.name} size={22} />}
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>{a.holder.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {modus}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', fontStyle: 'italic' }}>Noch unbesetzt, wird nach dem ersten Stammtisch vergeben</span>
                    )}
                  </span>
                </div>
                {key && <Icon name="chevron" size={16} color="var(--ink-200)" style={{ flex: 'none' }} />}
              </div>
            );
          })}
        </ZeilenKarte>
      </section>

      {/* Saison-Badges mit den echten Grafiken */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>wandern automatisch weiter</span>}>Saison-Badges</HoamTitel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {galerie.map((b) => {
            const halter = b.holder ? eintraege.find((e) => e.name === b.holder!.name) ?? null : null;
            return (
              <div
                key={b.key}
                onClick={() => setInfoKey(b.key)}
                className="wn-press"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px 12px', borderRadius: 'var(--r-lg)', cursor: 'pointer', textAlign: 'center',
                  background: b.holder ? 'var(--grad-navy)' : 'var(--ink-50)',
                  border: b.holder ? '1.5px solid var(--gold)' : '1.5px dashed var(--ink-200)',
                  boxShadow: b.holder ? '0 6px 18px rgba(12,43,90,0.2)' : 'none',
                }}
              >
                <div style={{ filter: b.holder ? 'none' : 'grayscale(1)', opacity: b.holder ? 1 : 0.45 }}>
                  <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={104} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.holder ? 'rgba(246,240,226,0.7)' : 'var(--ink-300)' }}>{b.tag}</span>
                {b.holder ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
                    {halter ? <SpezlAvatar e={halter} size={22} /> : <Avatar src={b.holder.photoUrl} name={b.holder.name} size={22} />}
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pergament)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{halter ? anzeigeName(halter) : b.holder.name}</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>noch nicht vergeben</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Serien-Abzeichen: bleiben für immer, grau = no ned gschafft */}
      {ich && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>bleiben für immer</span>}>Serien-Abzeichen</HoamTitel>
          <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '14px 10px', display: 'grid', gridTemplateColumns: `repeat(${SERIEN_ABZEICHEN.length}, 1fr)`, gap: 4 }}>
            {SERIEN_ABZEICHEN.map((a) => {
              const hab = ich.allzeit.bestStreak >= a.ab;
              return (
                <div key={a.ab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center' }}>
                  <div style={{ filter: hab ? 'none' : 'grayscale(1)', opacity: hab ? 1 : 0.4 }}>
                    <BadgeBild slug={`serie-${a.ab}`} icon={a.icon} name={a.name} size={54} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.2, color: hab ? 'var(--navy)' : 'var(--ink-300)' }}>{a.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-300)' }}>{a.ab} in Folge</span>
                </div>
              );
            })}
          </div>
          <div className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            Du hast {ich.serien.length} von {SERIEN_ABZEICHEN.length} · dein Rekord: {ich.allzeit.bestStreak} {ich.allzeit.bestStreak === 1 ? 'Abend' : 'Abende'} in Folge
          </div>
        </section>
      )}

      {wechsel.t !== null && wechsel.info && <RangToast info={wechsel.info} t={wechsel.t} onClose={wechsel.stopp} />}

      {detail && (
        <SpezlDetail
          e={detail}
          rank={ranked.indexOf(detail) + 1}
          s={detail[zeitraum]}
          zeitraumLabel={kurzLabel}
          onClose={() => setDetailId(null)}
          onInfo={setInfoKey}
        />
      )}
      {infoKey && badgeInfos[infoKey] && <BadgeInfo info={badgeInfos[infoKey]} onClose={() => setInfoKey(null)} />}
    </div>
  );
}

/* ── Spezl-Detail als Vollbild (1b): Navy-Kopf mit Rang, Name in Fraktur und Punkten,
      darunter Zahlen, Auszeichnungen und Steckbrief ── */
function SpezlDetail({
  e,
  rank,
  s,
  zeitraumLabel,
  onClose,
  onInfo,
}: {
  e: SpezlEintrag;
  rank: number;
  s: StatsBlock;
  zeitraumLabel: string;
  onClose: () => void;
  onInfo: (key: string) => void;
}) {
  const rangFarbe = RANG_FARBE[rank] ?? { bg: 'var(--weiss)', fg: 'var(--navy)' };
  const stats: Array<[string, number, string]> = [
    ['beer', s.hoiben, 'Bier'],
    ...(s.schnaps > 0 ? ([['wine', s.schnaps, 'Schnaps']] as Array<[string, number, string]>) : []),
    ['taxi', s.taxi, 'Taxler'],
    ['pin', s.wirtshaeuser, 'Wirtshäuser'],
    ['clipboard', s.organisiert, 'Organisiert'],
    ['star', s.runden, 'Runden'],
  ];
  const wackelt = s.unentschuldigtStreak >= 3;
  return (
    <div className="wn-scroll-still" style={{ position: 'fixed', inset: 0, zIndex: 60, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', overflowY: 'auto', overscrollBehavior: 'contain', animation: 'wnSpezlRein 260ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
      <style>{`
        @keyframes wnSpezlRein { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes wnFederPop { 0% { transform: scale(0.4); opacity: 0; } 62% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <div style={{ position: 'relative', background: 'radial-gradient(120% 90% at 50% 25%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', padding: 'calc(16px + env(safe-area-inset-top)) 20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
        <button type="button" onClick={onClose} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', right: 16, top: 'calc(14px + env(safe-area-inset-top))', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <Icon name="x" size={18} />
        </button>
        <div style={{ position: 'relative', marginTop: 20, animation: 'wnFederPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
          <SpezlAvatar e={e} size={96} ring={rank === 1 ? 'gold' : e.istIch ? 'blau' : null} />
          <span className="wn-tnum" style={{ position: 'absolute', right: -4, top: -2, width: 32, height: 32, borderRadius: '50%', background: rangFarbe.bg, color: rangFarbe.fg, border: '2px solid var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{rank}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 36, lineHeight: 1, color: 'var(--gold-bright)', marginTop: 8 }}>{e.name}</span>
        {e.vollerName && e.vollerName !== e.name && <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.8)' }}>{e.vollerName}</span>}
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>{e.amt ? `${e.amt.titel} · ` : ''}{zeitraumLabel}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          <span className="wn-tnum" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: 'var(--gold-bright)' }}>{s.punkte}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>WP</span>
          <DeltaText s={s} mitPunkten size={13} />
        </div>
        {(s.streak !== 0 || s.bestStreak > 0) && (
          <span className="wn-tnum" style={{ marginTop: 4, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', color: 'var(--pergament)', whiteSpace: 'nowrap' }}>
            {s.streak > 0 ? `${s.streak}er-Serie` : s.streak < 0 ? `${-s.streak}× gfehlt` : 'Koa Serie'} · Rekord {s.bestStreak}
          </span>
        )}
      </div>
      <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />

      <div style={{ padding: '20px 16px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {wackelt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'var(--strafe-bg)', border: '1.5px solid var(--strafe)' }}>
            <Icon name="warning" size={24} color="var(--strafe)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--strafe)', lineHeight: 1.4 }}>{s.unentschuldigtStreak}× unentschuldigt gefehlt, {e.istIch ? 'du wackelst' : `${e.name} wackelt`}.</span>
          </div>
        )}

        {/* Zahlen: 3 Spalten, Schweinsbraten über die volle Breite */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', overflow: 'hidden' }}>
          {stats.map(([icon, wert, label], i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '14px 4px', borderLeft: i % 3 ? '1px solid var(--ink-50)' : 'none', borderTop: i >= 3 ? '1px solid var(--ink-50)' : 'none' }}>
              <Icon name={icon} size={19} color="var(--gold-700)" />
              <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: 'var(--navy)' }}>{wert}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{label}</span>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 4px' }}>
            <Icon name="bowl" size={19} color="var(--gold-700)" />
            <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: 'var(--navy)' }}>{s.schweinsbraten}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Schweinsbraten</span>
          </div>
        </div>

        {/* Auszeichnungen */}
        {(e.badges.length > 0 || e.serien.length > 0) && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel>Auszeichnungen</HoamTitel>
            <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {e.badges.map((b) => (
                <div key={b.key} onClick={() => onInfo(b.key)} style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                  <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={96} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{b.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Saison-Badge · {b.tag}</span>
                  </div>
                </div>
              ))}
              {e.serien.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: e.badges.length > 0 ? 12 : 0, borderTop: e.badges.length > 0 ? '1px solid var(--ink-50)' : 'none', flexWrap: 'wrap' }}>
                  {e.serien.map((a) => <BadgeBild key={a.ab} slug={`serie-${a.ab}`} icon={a.icon} name={a.name} size={40} />)}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Serien: {e.serien.map((a) => a.name).join(' · ')}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Steckbrief */}
        {!steckbriefLeer(e.steckbrief) && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel>Steckbrief</HoamTitel>
            <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '4px 16px 14px' }}>
              <Steckbrief daten={e.steckbrief} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
