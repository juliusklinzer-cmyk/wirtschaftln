'use client';

import { useRef, useState, useTransition } from 'react';
import { SegmentedTabs, Badge, Avatar } from '@/components/ds';
import { Stars } from '@/components/domain/Stars';
import { ArchivKarte } from '@/components/domain/ArchivKarte';
import { nachbewerten } from '@/app/(app)/karte/actions';

export type ArchivTeilnehmer = {
  name: string;
  photoUrl: string | null;
  verein: 'bayern' | 'sechzig' | null;
  hoiben: number;
  kaiserschmarrn: number;
  schweinsbraten: number;
};
export type ArchivHinweis = { art: 'kaisi' | 'brodn' | 'allgemein'; text: string; von: string };

export type ArchivEintrag = {
  id: string;
  name: string;
  bezirk: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  biersorte: string;
  besuchtAm: string | null; // formatiertes Datum, null bei „nächstes" und „offen"
  organisator: { name: string; photoUrl: string | null } | null;
  /** Spezl, der das Wirtshaus über „Wirtshaus gfunden" vorgeschlagen hat. */
  gfundenVon?: string | null;
  rating: number;
  kaiser: number;
  brodn: number;
  hoiben: number;
  teilnehmer: ArchivTeilnehmer[];
  hinweise: ArchivHinweis[];
  naechstes?: boolean;
  /** Bsucht vor da App-Zeit (Chronik seit 2019) — ohne Termin-/Besuchsdaten. */
  altbestand?: boolean;
  /** Wie viele freiwillige Nachbewertungen im rating mitstecken. */
  nachAnzahl?: number;
  /** Eigene Nachbewertung des eingeloggten Spezl (null = noch keine). */
  meineBewertung?: {
    sterne: number;
    kaiserSterne: number | null;
    brodnSterne: number | null;
    kommentar: string | null;
    kaiserNotiz: string | null;
    brodnNotiz: string | null;
  } | null;
};

/** Bewertung immer mit Kommastelle: 4,6 */
const dez = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const METRIKEN = {
  rang: { field: 'rating', icon: '★', label: 'STERNE', champ: 'Wirtshaus Nr. 1', heading: 'Alle Wirtshäuser', empty: 'Noch keine Bewertung.' },
  kaiser: { field: 'kaiser', icon: '🥞', label: 'SCHMARRN', champ: 'Schmarrn-König', heading: 'Beste Kaiserschmarrn', empty: 'Noch kein Kaiserschmarrn bewertet. 🥞' },
  brodn: { field: 'brodn', icon: '🍖', label: 'BRODN', champ: 'Brodn-König', heading: 'Beste Schweinsbraten', empty: 'Noch kein Brodn bewertet. 🍖' },
} as const;
type MetrikKey = keyof typeof METRIKEN;

const MEDAILLE: Record<number, { bg: string; fg: string }> = {
  1: { bg: 'var(--grad-gold)', fg: 'var(--navy-900)' },
  2: { bg: 'linear-gradient(135deg,#E7ECF2,#C2CAD6)', fg: '#4A5568' },
  3: { bg: 'linear-gradient(135deg,#E0A267,#C9853F)', fg: '#fff' },
};

function BiersorteChip({ sorte, hell = false }: { sorte: string; hell?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
        borderRadius: 'var(--r-pill)', background: hell ? 'rgba(255,255,255,0.16)' : '#F6ECD4',
        border: `1px solid ${hell ? 'rgba(255,255,255,0.3)' : 'var(--pergament-edge)'}`,
        fontFamily: 'var(--font-fraktur)', fontSize: 13, lineHeight: 1.4,
        color: hell ? 'var(--gold-bright)' : 'var(--gold-700)', whiteSpace: 'nowrap',
      }}
    >
      🍺 {sorte}
    </span>
  );
}

export function ArchivScreen({ eintraege }: { eintraege: ArchivEintrag[] }) {
  const [view, setView] = useState<'karte' | MetrikKey>('karte');
  const [idx, setIdx] = useState(0);
  const [detail, setDetail] = useState<{ e: ArchivEintrag; rank: number | null } | null>(null);

  // Altbestand zählt als besucht (Chronik) — rankt aber nur mit Nachbewertungen (> 0 Sterne)
  const besucht = eintraege.filter((e) => e.besuchtAm || e.altbestand);
  // Top 3 nach Sternen → goldene Pins auf der Karte
  const top3Ids = new Set(
    [...besucht].sort((a, b) => b.rating - a.rating).slice(0, 3).filter((e) => e.rating > 0).map((e) => e.id),
  );

  const toggle = (
    <SegmentedTabs
      value={view}
      onChange={(v) => setView(v as typeof view)}
      tabs={[
        { label: 'Karte', value: 'karte' },
        { label: 'Sterne', value: 'rang' },
        { label: 'Schmarrn', value: 'kaiser' },
        { label: 'Brodn', value: 'brodn' },
      ]}
    />
  );

  /* ── KARTE: Vollbild + Bottom-Card ── */
  if (view === 'karte') {
    const safeIdx = Math.min(idx, Math.max(0, eintraege.length - 1));
    const aktiv = eintraege[safeIdx];
    const step = (d: number) => setIdx((i) => (Math.min(i, eintraege.length - 1) + d + eintraege.length) % eintraege.length);
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <ArchivKarte
          pins={eintraege.map((e) => ({ id: e.id, name: e.name, lat: e.lat, lng: e.lng, photoUrl: e.photoUrl, naechstes: e.naechstes, top3: top3Ids.has(e.id), offen: !e.besuchtAm && !e.naechstes && !e.altbestand }))}
          activeIdx={safeIdx}
          onPick={setIdx}
        />
        <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 5 }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.94)', borderRadius: 'var(--r-pill)', padding: 4, boxShadow: 'var(--sh-md)', backdropFilter: 'blur(4px)' }}>
            {toggle}
          </div>
        </div>
        {aktiv && (
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 14, zIndex: 5 }}>
            <MapBottomCard
              e={aktiv}
              idx={safeIdx}
              count={eintraege.length}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
              onOpen={() => (aktiv.besuchtAm || aktiv.altbestand || aktiv.gfundenVon) && setDetail({ e: aktiv, rank: null })}
            />
          </div>
        )}
        {detail && <DetailModal e={detail.e} rank={detail.rank} onClose={() => setDetail(null)} />}
        {eintraege.length === 0 && (
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 20, zIndex: 5, background: 'var(--weiss)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--sh-lg)', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
            Sobald a Wirtshaus abgeschlossen is’, erscheint’s hier auf der Karte. 🗺️
          </div>
        )}
      </div>
    );
  }

  /* ── STERNE / SCHMARRN / BRODN: Ranking vom Besten zum Schlechtesten ── */
  const mc = METRIKEN[view];
  const ranked = besucht
    .filter((e) => (e[mc.field as 'rating' | 'kaiser' | 'brodn'] || 0) > 0)
    .sort((a, b) => (b[mc.field as 'rating' | 'kaiser' | 'brodn'] || 0) - (a[mc.field as 'rating' | 'kaiser' | 'brodn'] || 0));
  const champ = ranked[0];

  return (
    <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sticky-Ansichts-Wechsel — wie der Filter auf der Rangliste */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 15,
          margin: '-12px -16px 0', padding: '10px 16px',
          background: 'var(--bg-app)', borderBottom: '1px solid var(--ink-100)',
        }}
      >
        {toggle}
      </div>

      {champ && (
        <div onClick={() => setDetail({ e: champ, rank: 1 })} style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-md)', cursor: 'pointer', background: 'var(--navy)' }}>
          {champ.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={champ.photoUrl} alt={champ.name} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
          )}
          {!champ.photoUrl && <div style={{ height: 150, background: 'var(--grad-navy)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,25,58,0.05) 0%, rgba(7,25,58,0.85) 100%)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--grad-gold)', color: 'var(--navy-900)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 'var(--r-pill)', boxShadow: 'var(--sh-sm)' }}>
            👑 {mc.champ}
          </div>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, color: 'var(--gold-bright)', lineHeight: 1.1, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{champ.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pergament)', marginTop: 3 }}>{champ.bezirk}</div>
            </div>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'baseline', gap: 3, color: '#fff' }}>
              <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{dez(champ[mc.field as 'rating' | 'kaiser' | 'brodn'])}</span>
              <span style={{ fontSize: 20 }}>{mc.icon}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 2px 0' }}>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--navy)', lineHeight: 1 }}>{mc.heading}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>· vom Besten zum Schlechtesten</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ranked.map((e, i) => (
          <RankedCard key={e.id} rank={i + 1} e={e} field={mc.field as 'rating' | 'kaiser' | 'brodn'} icon={mc.icon} label={mc.label} onClick={() => setDetail({ e, rank: i + 1 })} />
        ))}
        {ranked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--ink-500)', fontSize: 14, fontWeight: 600 }}>{mc.empty}</div>
        )}
      </div>

      {detail && <DetailModal e={detail.e} rank={detail.rank} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ── Kompakte Karte über der Google-Map (Foto links, Info rechts, Blättern) ── */
function MapBottomCard({
  e,
  idx,
  count,
  onPrev,
  onNext,
  onOpen,
}: {
  e: ArchivEintrag;
  idx: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
}) {
  const touchX = useRef<number | null>(null);
  return (
    <div
      onTouchStart={(ev) => (touchX.current = ev.touches[0].clientX)}
      onTouchEnd={(ev) => {
        if (touchX.current == null) return;
        const delta = ev.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (delta > 40) onPrev();
        else if (delta < -40) onNext();
      }}
      style={{
        display: 'flex', alignItems: 'stretch', background: 'var(--weiss)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
        border: e.naechstes ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
        boxShadow: 'var(--sh-lg)',
      }}
    >
      <div onClick={onOpen} style={{ position: 'relative', width: 104, flex: 'none', background: 'var(--ink-100)', cursor: e.besuchtAm || e.altbestand ? 'pointer' : 'default' }}>
        {e.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.photoUrl} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div onClick={onOpen} style={{ flex: 1, minWidth: 0, padding: '12px 12px 12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, cursor: e.besuchtAm || e.altbestand ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {e.naechstes ? (
            <Badge tone="gold" solid iconLeft="📍">Nächstes Mal</Badge>
          ) : e.besuchtAm ? (
            <Badge tone="blau" solid iconLeft="✓">Besucht</Badge>
          ) : e.altbestand ? (
            <Badge tone="blau" solid iconLeft="📜">Bsucht vor da App</Badge>
          ) : (
            <Badge tone="neutral" solid>Offen</Badge>
          )}
          <span className="wn-tnum" style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--ink-500)' }}>
            {idx + 1} / {count}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
        {e.organisator ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            organisiert von {e.organisator.name}
          </div>
        ) : e.gfundenVon ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            gfunden von {e.gfundenVon}
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.bezirk}</span>
          {e.rating > 0 && <Stars rating={e.rating} size={13} />}
        </div>
      </div>
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--ink-100)' }}>
        <button onClick={onPrev} aria-label="Vorheriges" style={navBtn}>‹</button>
        <button onClick={onNext} aria-label="Nächstes" style={{ ...navBtn, borderTop: '1px solid var(--ink-100)' }}>›</button>
      </div>
    </div>
  );
}
const navBtn: React.CSSProperties = {
  flex: 1, width: 42, border: 'none', background: 'transparent', cursor: 'pointer',
  fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

/* ── Nummerierte Ranking-Zeile mit Medaille ── */
function RankedCard({
  rank,
  e,
  field,
  icon,
  label,
  onClick,
}: {
  rank: number;
  e: ArchivEintrag;
  field: 'rating' | 'kaiser' | 'brodn';
  icon: string;
  label: string;
  onClick: () => void;
}) {
  const top = rank <= 3;
  const medal = MEDAILLE[rank] ?? { bg: 'var(--ink-100)', fg: 'var(--ink-500)' };
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--weiss)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
        border: '1px solid var(--ink-100)',
        boxShadow: top ? 'var(--sh-md)' : 'var(--sh-sm)',
        padding: '10px 12px 10px 10px', cursor: 'pointer',
      }}
    >
      <div style={{ flex: 'none', width: 36, display: 'flex', justifyContent: 'center' }}>
        {top ? (
          <div className="wn-tnum" style={{ width: 30, height: 30, borderRadius: '50%', background: medal.bg, color: medal.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, boxShadow: 'var(--sh-xs)' }}>
            {rank}
          </div>
        ) : (
          <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-300)' }}>{rank}</span>
        )}
      </div>
      <div style={{ flex: 'none', width: 54, height: 54, borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--ink-100)' }}>
        {e.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.photoUrl} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.bezirk}</div>
        {e.organisator && (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-700)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            organisiert von {e.organisator.name}
          </div>
        )}
        {e.altbestand && (
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muc-blau)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📜 Vor da App · zählt koane Punkte
          </div>
        )}
      </div>
      <div style={{ flex: 'none', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
          <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{dez(e[field])}</span>
          <span style={{ fontSize: 16 }}>{icon}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--gold-700)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Detail-Dialog: Stats, wer dabei war, Hinweise — auch von der Chronik (Termin-Seite) genutzt ── */
export function DetailModal({ e, rank, onClose }: { e: ArchivEintrag; rank: number | null; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes wnWirtshausRein { from { transform: translateY(26px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,25,58,0.6)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, maxHeight: '86dvh', overflowY: 'auto', background: 'var(--weiss)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-lg)', animation: 'wnWirtshausRein 320ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
        {/* Foto-Kopf */}
        <div style={{ position: 'relative', height: 158, background: 'var(--grad-navy)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', overflow: 'hidden' }}>
          {e.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.photoUrl} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,25,58,0) 40%, rgba(7,25,58,0.82) 100%)' }} />
          <button onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', color: 'var(--ink-700)', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
          {rank && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--grad-gold)', color: 'var(--navy-900)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 'var(--r-pill)', boxShadow: 'var(--sh-sm)' }}>
              {rank === 1 ? '👑 ' : ''}Platz {rank}
            </div>
          )}
          {e.altbestand && (
            <div style={{ position: 'absolute', top: rank ? 46 : 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--muc-blau)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 'var(--r-pill)', boxShadow: 'var(--sh-sm)' }}>
              📜 Vor da App
            </div>
          )}
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, color: 'var(--gold-bright)', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{e.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pergament)', marginTop: 3 }}>{e.bezirk}</div>
            </div>
            <BiersorteChip sorte={e.biersorte} hell />
          </div>
        </div>
        {/* Gold-Haarlinie als Zeremonie-Trenner — wie im Spezl-Detail */}
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

        <div style={{ padding: '16px 18px 20px' }}>
          {/* 3 Bewertungs-Kacheln */}
          <div style={{ display: 'flex', gap: 8 }}>
            {([['rating', 'Sterne', '★'], ['kaiser', 'Schmarrn', '🥞'], ['brodn', 'Brodn', '🍖']] as const).map(([f, lbl, ic]) => (
              <div key={f} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
                <div className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
                  {e[f] > 0 ? dez(e[f]) : '–'} <span style={{ fontSize: 14 }}>{ic}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 5 }}>{lbl}</div>
              </div>
            ))}
          </div>
          {(e.nachAnzahl ?? 0) > 0 && (
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginTop: 6, textAlign: 'center' }}>
              Sterne inkl. {e.nachAnzahl} {e.nachAnzahl === 1 ? 'Nachbewertung' : 'Nachbewertungen'}
            </div>
          )}

          {/* Freiwillige Nachbewertung — NUR für Vor-der-App-Wirtshäuser (Chronik).
              Echte Besuche werden beim Abschluss + in der Nachtragsfrist bewertet, danach is fix. */}
          {e.altbestand && <Nachbewertung wirtshausId={e.id} meine={e.meineBewertung} altbestand />}

          {/* Organisator */}
          {e.organisator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 14px', background: 'rgba(0,106,179,0.06)', borderRadius: 'var(--r-md)' }}>
              <Avatar src={e.organisator.photoUrl} name={e.organisator.name} size={38} ring />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-500)' }}>Organisiert von</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--muc-blau)' }}>{e.organisator.name}</div>
              </div>
            </div>
          )}

          {/* Wer war dabei */}
          {e.teilnehmer.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 19, color: 'var(--navy)', marginBottom: 8 }}>
                De warn dabei <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>({e.teilnehmer.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {e.teilnehmer.map((t) => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={t.photoUrl} name={t.name} size={28} verein={t.verein} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                      {t.hoiben} 🍺{t.kaiserschmarrn > 0 && <> · {t.kaiserschmarrn} 🥞</>}{t.schweinsbraten > 0 && <> · {t.schweinsbraten} 🍖</>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hinweise (Kaisi/Brodn-Notizen + Kommentare) */}
          {e.hinweise.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 19, color: 'var(--navy)', marginBottom: 8 }}>
                D’Hinweise
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {e.hinweise.map((h, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.45 }}>
                      {h.art === 'kaisi' ? '🥞 ' : h.art === 'brodn' ? '🍖 ' : '💬 '}
                      {h.text}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', marginTop: 4 }}>— {h.von}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {e.besuchtAm && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', marginTop: 14, textAlign: 'center' }}>Besucht am {e.besuchtAm}</div>
          )}
          {e.altbestand && !e.besuchtAm && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', marginTop: 14, textAlign: 'center' }}>
              📜 Bsucht vor da App-Zeit · Chronik seit 2019
              <br />
              <span style={{ fontSize: 11 }}>Sterne zählen in der Wertung — Punkte gibt’s dafür koane.</span>
            </div>
          )}
        </div>
        {/* Rauten-Band als Abschluss — wie auf der Spezl-Urkunde */}
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
      </div>
    </div>
  );
}

/**
 * Freiwillige Nachbewertung (Altbestand oder Wiederbesuch ohne Stammtisch):
 * eigene Sterne + optionaler Kommentar, jederzeit änderbar — bewusst OHNE WP,
 * damit koaner mit Schmarrn-Bewertungen Punkte sammelt.
 */
/** ± Stepper für eine Bewertung mit einer Kommastelle, 1,0–5,0 (wie beim Besuch-Abschluss). */
function BewertungsStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v * 10) / 10));
  const btn: React.CSSProperties = {
    width: 36, height: 36, flex: 'none', borderRadius: '50%', border: '1.5px solid var(--ink-200)',
    background: 'var(--weiss)', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: 'var(--navy)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={() => onChange(clamp(value - 0.1))} aria-label="Weniger" style={btn}>−</button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 64, justifyContent: 'center' }}>
        <span className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
          {value.toFixed(1).replace('.', ',')}
        </span>
        <span style={{ fontSize: 17, color: 'var(--gold)' }}>★</span>
      </div>
      <button type="button" onClick={() => onChange(clamp(value + 0.1))} aria-label="Mehr" style={btn}>+</button>
    </div>
  );
}

const notizStyle: React.CSSProperties = {
  width: '100%', marginTop: 8, padding: '9px 12px', border: '1.5px solid var(--ink-200)',
  borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
  color: 'var(--ink-900)', background: 'var(--weiss)', outline: 'none',
};

function Nachbewertung({
  wirtshausId,
  meine,
  altbestand,
}: {
  wirtshausId: string;
  meine?: ArchivEintrag['meineBewertung'];
  altbestand?: boolean;
}) {
  const [sterne, setSterne] = useState(meine?.sterne ?? 3);
  const [kommentar, setKommentar] = useState(meine?.kommentar ?? '');
  const [kaiserAktiv, setKaiserAktiv] = useState(meine?.kaiserSterne != null);
  const [kaiserSterne, setKaiserSterne] = useState(meine?.kaiserSterne ?? 3);
  const [kaiserNotiz, setKaiserNotiz] = useState(meine?.kaiserNotiz ?? '');
  const [brodnAktiv, setBrodnAktiv] = useState(meine?.brodnSterne != null);
  const [brodnSterne, setBrodnSterne] = useState(meine?.brodnSterne ?? 3);
  const [brodnNotiz, setBrodnNotiz] = useState(meine?.brodnNotiz ?? '');
  const [gespeichert, setGespeichert] = useState(false);
  const [pending, startTransition] = useTransition();
  const frisch = () => setGespeichert(false);

  const speichern = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set('wirtshausId', wirtshausId);
      fd.set('sterne', String(sterne));
      fd.set('kaiserSterne', kaiserAktiv ? String(kaiserSterne) : '');
      fd.set('brodnSterne', brodnAktiv ? String(brodnSterne) : '');
      fd.set('kommentar', kommentar);
      fd.set('kaiserNotiz', kaiserNotiz);
      fd.set('brodnNotiz', brodnNotiz);
      await nachbewerten(fd);
      setGespeichert(true);
    });

  /** Optionale Wertung (Schmarrn/Brodn): erst aktivieren, dann Stepper + eigene Notiz. */
  const optionalBlock = (
    label: string,
    aktiv: boolean,
    setAktiv: (a: boolean) => void,
    wert: number,
    setWert: (v: number) => void,
    notiz: string,
    setNotiz: (t: string) => void,
    platzhalter: string,
  ) => (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--pergament-edge)' }}>
      {!aktiv ? (
        <button
          type="button"
          onClick={() => { setAktiv(true); frisch(); }}
          style={{ border: '1.5px dashed var(--ink-200)', background: 'none', borderRadius: 'var(--r-md)', width: '100%', padding: '9px 12px', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', cursor: 'pointer' }}
        >
          + {label} bewerten
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BewertungsStepper value={wert} onChange={(v) => { setWert(v); frisch(); }} />
              <button
                type="button"
                onClick={() => { setAktiv(false); setNotiz(''); frisch(); }}
                aria-label={`${label}-Bewertung entfernen`}
                title="Doch ned bewerten"
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: 'var(--ink-300)', padding: 2 }}
              >
                ✕
              </button>
            </div>
          </div>
          <input value={notiz} onChange={(ev) => { setNotiz(ev.target.value); frisch(); }} placeholder={platzhalter} maxLength={500} style={notizStyle} />
        </>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-500)' }}>
        Deine Bewertung · freiwillig, ohne WP
      </div>
      {altbestand && !meine && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 4 }}>
          Du warst da scho? Bewert den Klassiker aus der Erinnerung — a Schmarrn und Brodn, wenn’st di erinnerst.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>★ Wirtshaus</span>
        <BewertungsStepper value={sterne} onChange={(v) => { setSterne(v); frisch(); }} />
      </div>
      <input
        value={kommentar}
        onChange={(ev) => { setKommentar(ev.target.value); frisch(); }}
        placeholder={'Wia is’s gwesen? (optional) — z. B. „Bedienung zach, Bier gscheit kalt“'}
        maxLength={500}
        style={notizStyle}
      />
      {optionalBlock('🥞 Schmarrn', kaiserAktiv, setKaiserAktiv, kaiserSterne, setKaiserSterne, kaiserNotiz, setKaiserNotiz, 'Wia war da Schmarrn? (optional)')}
      {optionalBlock('🍖 Brodn', brodnAktiv, setBrodnAktiv, brodnSterne, setBrodnSterne, brodnNotiz, setBrodnNotiz, 'Wia war da Brodn? (optional)')}
      <button
        type="button"
        onClick={speichern}
        disabled={pending}
        style={{
          marginTop: 12, width: '100%', padding: '10px 12px', border: 'none', borderRadius: 'var(--r-md)',
          background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)',
          fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--navy-900)',
          cursor: 'pointer', opacity: pending ? 0.6 : 1,
        }}
      >
        {gespeichert ? '✓ Gspeichert — vergelt’s Gott!' : meine ? 'Bewertung ändern' : 'Bewertung speichern'}
      </button>
    </div>
  );
}
