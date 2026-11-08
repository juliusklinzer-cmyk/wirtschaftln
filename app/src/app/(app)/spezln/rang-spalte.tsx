'use client';

import { useState } from 'react';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { Icon } from '@/components/ds';
import { BadgeInfo, type BadgeInfoDaten } from '@/components/domain/BadgeInfo';
import { SpezlAvatar, anzeigeName, PodestSpalte, PODEST_H, PODEST_HOEHE, PODEST_AVATAR } from './rang-bausteine';
import { AemterUndBadges, SpezlDetail } from './rangliste-b';
import type { SpezlEintrag, AmtEintrag, GalerieBadge } from './rangliste';

/**
 * Rang als Spalte links auf Dahoam (Responsive Redesign 1a/1b): Podest, alle
 * Spezln mit Abenden und Hoibe, die eigenen Zahlen und der Knopf zu Ämtern
 * und Badges. Nur am Tablet und Desktop, am Handy gibt's dafür den Rang-Tab.
 */
export function RangSpalte({
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [badgesOffen, setBadgesOffen] = useState(false);

  const ranked = [...eintraege].sort((a, b) => b.saison.punkte - a.saison.punkte);
  const podest = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as SpezlEintrag[];
  const ich = eintraege.find((e) => e.istIch) ?? null;
  const meinRang = ich ? ranked.indexOf(ich) + 1 : 0;
  const detail = detailId ? ranked.find((e) => e.id === detailId) ?? null : null;
  const kurzLabel = saisonLabel.replace(/^Saison \d+ · /, 'Saison ');
  const zahlLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' };

  return (
    <section style={{ background: 'var(--weiss)', borderRadius: 22, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '18px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '0 4px' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>Rang</h2>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{kurzLabel}</span>
      </div>

      {podest.length > 0 && (
        <div style={{ borderRadius: 18, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', overflow: 'hidden' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, margin: '8px 10px 0', height: PODEST_H }}>
            {podest.map((e) => {
              const rang = ranked.indexOf(e) + 1;
              return (
                <PodestSpalte
                  key={e.id}
                  e={e}
                  rang={rang}
                  s={e.saison}
                  metrik="punkte"
                  einheit="WP"
                  groesse={PODEST_AVATAR[rang]}
                  hoehe={PODEST_HOEHE[rang]}
                  krone={rang === 1}
                  stil={{ flex: 1 }}
                  onClick={() => setDetailId(e.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ranked.map((e, i) => {
          const rang = i + 1;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setDetailId(e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
                background: e.istIch ? 'var(--pergament)' : 'transparent',
                boxShadow: !e.istIch && i < ranked.length - 1 && !ranked[i + 1]?.istIch ? 'inset 0 -1px 0 var(--ink-50)' : 'none',
              }}
            >
              <span className="wn-tnum" style={{ width: 22, flex: 'none', textAlign: 'center', fontSize: 13, fontWeight: 800, color: rang <= 3 ? 'var(--gold-700)' : 'var(--ink-300)' }}>
                {rang === 1 ? <Icon name="crown" size={16} color="var(--gold)" stroke={2.4} /> : `${rang}.`}
              </span>
              <SpezlAvatar e={e} size={34} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anzeigeName(e)}</span>
                <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.saison.abende} {e.saison.abende === 1 ? 'Abend' : 'Abende'} · {e.saison.hoiben} Hoibe
                </span>
              </span>
              <span className="wn-tnum" style={{ flex: 'none', fontSize: 15, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                {e.saison.punkte} <span style={{ fontSize: 10, color: 'var(--gold-700)' }}>WP</span>
              </span>
            </button>
          );
        })}
      </div>

      {ich && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 4px 0', borderTop: '1px solid var(--ink-100)' }}>
          {([[String(ich.saison.punkte), 'WP'], [meinRang > 0 ? `${meinRang}.` : '–', 'Platz'], [String(Math.max(0, ich.allzeit.streak)), 'in Folge']] as const).map(([wert, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: 'var(--navy)' }}>{wert}</span>
              <span style={zahlLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setBadgesOffen(true)}
        className="wn-press"
        style={{ minHeight: 46, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
      >
        <Medal size={18} weight="fill" />
        Ämter & Badges
      </button>

      {badgesOffen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ämter und Badges"
          className="wn-fenster wn-scroll-still"
          style={{ position: 'fixed', inset: 0, zIndex: 60, ['--wn-fenster-breite' as string]: '860px', background: 'var(--ink-50)', padding: '26px 28px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 36, lineHeight: 1, color: 'var(--navy)' }}>Ämter & Badges</h2>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{kurzLabel} · antippen für Details</span>
            </div>
            <button type="button" onClick={() => setBadgesOffen(false)} aria-label="Schließen" className="wn-press" style={{ width: 38, height: 38, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <X size={18} />
            </button>
          </div>
          <AemterUndBadges eintraege={eintraege} aemter={aemter} galerie={galerie} badgeInfos={badgeInfos} onInfo={setInfoKey} breit />
        </div>
      )}

      {detail && (
        <SpezlDetail
          e={detail}
          rank={ranked.indexOf(detail) + 1}
          s={detail.saison}
          zeitraumLabel={kurzLabel}
          onClose={() => setDetailId(null)}
          onInfo={setInfoKey}
        />
      )}
      {infoKey && badgeInfos[infoKey] && <BadgeInfo info={badgeInfos[infoKey]} onClose={() => setInfoKey(null)} />}
    </section>
  );
}
