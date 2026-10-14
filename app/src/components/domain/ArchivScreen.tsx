'use client';

import { useRef, useState, useTransition } from 'react';
import { Avatar, Icon, Kachel, Zeile, ZeilenKarte } from '@/components/ds';
import { ArchivKarte, type Standort } from '@/components/domain/ArchivKarte';
import { RichtungsKnopf } from '@/components/domain/RichtungsKnopf';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { KompaktStepper } from '@/components/domain/WertungFelder';
import { goldKnopfStil, bereichHinweisStil } from '@/components/domain/hero-stil';
import { navigationsUrl, ortsUrl } from '@/lib/google-maps';
import { bierLogo } from '@/lib/biersorten';
import { nachbewerten, wirtshausEntfernen } from '@/app/(app)/karte/actions';
import { useTenantConfig } from '@/components/shell/TenantProvider';

export type ArchivTeilnehmer = {
  name: string;
  photoUrl: string | null;
  verein: string | null;
  hoiben: number;
  kaiserschmarrn: number;
  schweinsbraten: number;
};
export type ArchivHinweis = { art: 'kaisi' | 'brodn' | 'allgemein'; text: string; von: string };

export type ArchivEintrag = {
  id: string;
  name: string;
  bezirk: string | null;
  adresse?: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  biersorte: string;
  besuchtAm: string | null; // formatiertes Datum (kurz), null bei „nächstes" und „offen"
  /** „2. Juli 2026“, fürs Karten-Kärtchen und den Chip im Detail */
  datumLang?: string | null;
  /** „Do, 2. Juli 2026“, fürs Detail */
  datumVoll?: string | null;
  organisator: { name: string; photoUrl: string | null } | null;
  /** Wer den Abend abgschlossen hat (Detail) */
  abgeschlossenVon?: string | null;
  /** Orga-WP des Abends (nach Sternen) */
  orgaWp?: number | null;
  /** Spezl, der das Wirtshaus über „Wirtshaus gfunden" vorgeschlagen hat. */
  gfundenVon?: string | null;
  /** Member-ID des Finders, für den Entfernen-Knopf. */
  gfundenVonId?: string | null;
  rating: number;
  kaiser: number;
  brodn: number;
  hoiben: number;
  /** Anzahl der Wertungen je Kategorie (Termin + Nachbewertungen) */
  wertungen?: { sterne: number; kaiser: number; brodn: number };
  teilnehmer: ArchivTeilnehmer[];
  hinweise: ArchivHinweis[];
  naechstes?: boolean;
  /** Bsucht vor da App-Zeit (Chronik seit 2019), ohne Termin-/Besuchsdaten. */
  altbestand?: boolean;
  /** Wie viele freiwillige Nachbewertungen im rating mitstecken. */
  nachAnzahl?: number;
  /** Entdeckt und von Spezln bewertet, aber no koa Stammtisch dort (Lexikon-Eintrag). */
  vorbewertet?: boolean;
  /** S’Stammhaus vom Stammtisch: immer golden und groß, wird nie bewertet. */
  stammhaus?: boolean;
  /** Stammhaus: wie viele Abende dort */
  abende?: number;
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
/** Vorname fürs Enge: „Sepp Brunner“ → „Sepp“, „da André“ bleibt ganz. */
const kurzName = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

const METRIKEN = {
  rang: { field: 'rating', champ: 'Wirtshaus Nr. 1', leer: 'Noch keine Bewertung.', art: null },
  kaiser: { field: 'kaiser', champ: 'Schmarrn-König', leer: 'Noch kein Kaiserschmarrn bewertet.', art: 'kaisi' },
  brodn: { field: 'brodn', champ: 'Brodn-König', leer: 'Noch kein Brodn bewertet.', art: 'brodn' },
} as const;
type MetrikKey = keyof typeof METRIKEN;
type Feld = 'rating' | 'kaiser' | 'brodn';

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };
const streifen = 'repeating-linear-gradient(135deg, var(--ink-100) 0 6px, #DCE3EA 6px 12px)';

/** Status eines Eintrags, als Chip (Karte, Detail). */
function StatusChip({ e, mitDatum = false }: { e: ArchivEintrag; mitDatum?: boolean }) {
  const [bg, fg, text] = e.naechstes
    ? ['var(--grad-gold)', 'var(--navy-900)', 'Nächstes Mal']
    : e.stammhaus
      ? ['var(--grad-gold)', 'var(--navy-900)', 'Stammhaus']
      : e.besuchtAm
        ? ['var(--navy)', 'var(--pergament)', mitDatum && e.datumLang ? `Besucht · ${e.datumLang}` : 'Besucht']
        : e.altbestand
          ? ['var(--info-bg)', 'var(--muc-blau)', mitDatum ? 'Vor der App · Chronik seit 2019' : 'Vor der App']
          : e.vorbewertet
            ? ['var(--info-bg)', 'var(--muc-blau)', 'Von Spezln bewertet']
            : ['var(--ink-50)', 'var(--ink-500)', 'Vorschlag'];
  return (
    <span style={{ display: 'inline-flex', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: bg, color: fg, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

/** Vier Ansichten als Navy-Segment mit Gold-Rand (Design 1a/1b). */
function Ansichten({ value, onChange, ohneKarte, aufKarte = false }: { value: string; onChange: (v: 'karte' | MetrikKey) => void; ohneKarte: boolean; aufKarte?: boolean }) {
  const tabs: Array<['karte' | MetrikKey, string]> = [['karte', 'Karte'], ['rang', 'Sterne'], ['kaiser', 'Schmarrn'], ['brodn', 'Brodn']];
  const sichtbar = ohneKarte ? tabs.filter(([k]) => k !== 'karte') : tabs;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sichtbar.length}, 1fr)`, padding: 4, borderRadius: 14, background: aufKarte ? 'rgba(7,25,58,0.85)' : 'rgba(7,25,58,0.92)', boxShadow: '0 6px 18px rgba(7,25,58,0.3)', border: '1px solid rgba(208,173,102,0.4)', backdropFilter: 'blur(4px)' }}>
      {sichtbar.map(([k, label]) => {
        const an = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={an}
            style={{ height: 38, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: an ? 800 : 700, background: an ? 'var(--gold)' : 'transparent', color: an ? 'var(--navy-900)' : 'rgba(246,240,226,0.75)', transition: 'background 160ms var(--ease-standard), color 160ms var(--ease-standard)' }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ArchivScreen({
  eintraege,
  ich,
  ohneKarte = false,
  reservieren = null,
}: {
  eintraege: ArchivEintrag[];
  /** Eingeloggter Spezl, darfModerieren = Admin oder aktueller Präsident. */
  ich: { id: string; darfModerieren: boolean };
  /** Listen statt Karte (Feature archivKarte aus, z. B. Stammhaus): nur Sterne/Schmarrn/Brodn. */
  ohneKarte?: boolean;
  /** Vorschlag direkt reservieren (gebundene Action mit vorhandenesWirtshausId), null = grad ned möglich */
  reservieren?: ((formData: FormData) => Promise<void>) | null;
}) {
  const { geo } = useTenantConfig();
  const ort = geo?.suchSuffix ?? null;
  const [view, setView] = useState<'karte' | MetrikKey>(ohneKarte ? 'rang' : 'karte');
  const [idx, setIdx] = useState(0);
  // Nur ID + Rang merken, den Eintrag selber jedes Mal frisch aus den Props holen:
  // nach dem Nachbewerten kommen neue Daten vom Server, a Kopie wär veraltet (Julius, 14.10.2026)
  const [detailWahl, setDetailWahl] = useState<{ id: string; rank: number | null } | null>(null);
  const detailEintrag = detailWahl ? eintraege.find((x) => x.id === detailWahl.id) ?? null : null;
  const detail = detailWahl && detailEintrag ? { e: detailEintrag, rank: detailWahl.rank } : null;
  const setDetail = (w: { e: ArchivEintrag; rank: number | null } | null) => setDetailWahl(w ? { id: w.e.id, rank: w.rank } : null);
  const [legende, setLegende] = useState(false);
  const [standort, setStandort] = useState<Standort | null>(null);
  const [standortHinweis, setStandortHinweis] = useState<string | null>(null);

  // Altbestand zählt als besucht (Chronik), rankt aber nur mit Nachbewertungen (> 0 Sterne)
  const besucht = eintraege.filter((e) => e.besuchtAm || e.altbestand || e.vorbewertet);
  const nurEntdeckt = (e: ArchivEintrag) => !e.besuchtAm && !e.naechstes && !e.altbestand && !e.vorbewertet;
  // Top 3 nach Sternen → goldene Pins auf der Karte
  const top3Ids = new Set(
    [...besucht].sort((a, b) => b.rating - a.rating).slice(0, 3).filter((e) => e.rating > 0).map((e) => e.id),
  );

  const meinStandort = () => {
    if (!('geolocation' in navigator)) { setStandortHinweis('Koa Standort am Gerät.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setStandort({ lat: p.coords.latitude, lng: p.coords.longitude }); setStandortHinweis(null); },
      () => setStandortHinweis('Standort ned freigegeben.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  /* ── KARTE: Vollbild, oben die Ansichten, unten das Kärtchen zum Pin ── */
  if (view === 'karte') {
    const safeIdx = Math.min(idx, Math.max(0, eintraege.length - 1));
    const aktiv = eintraege[safeIdx];
    const step = (d: number) => setIdx((i) => (Math.min(i, eintraege.length - 1) + d + eintraege.length) % eintraege.length);
    const rundKnopf: React.CSSProperties = { width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'var(--weiss)', boxShadow: '0 4px 12px rgba(7,25,58,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muc-blau)', cursor: 'pointer', padding: 0 };
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <ArchivKarte
          pins={eintraege.map((e) => ({ id: e.id, name: e.name, lat: e.lat, lng: e.lng, photoUrl: e.photoUrl, naechstes: e.naechstes, top3: top3Ids.has(e.id), offen: nurEntdeckt(e), vorbewertet: !!e.vorbewertet && !e.besuchtAm && !e.naechstes, stammhaus: !!e.stammhaus }))}
          activeIdx={safeIdx}
          onPick={setIdx}
          standort={standort}
        />
        {/* Oben nur die vier Ansichten */}
        <div style={{ position: 'absolute', left: 12, right: 12, top: 'calc(12px + env(safe-area-inset-top))', zIndex: 5 }}>
          <Ansichten value={view} onChange={setView} ohneKarte={ohneKarte} aufKarte />
        </div>
        {/* Rechts: mein Standort + Pin-Legende */}
        <div style={{ position: 'absolute', right: 16, top: 'calc(70px + env(safe-area-inset-top))', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button type="button" aria-label="Mein Standort" title="Mein Standort" onClick={meinStandort} className="wn-press" style={rundKnopf}>
            <Icon name="navigation" size={20} stroke={2.2} style={{ fill: standort ? 'currentColor' : 'none' } as React.CSSProperties} />
          </button>
          <button type="button" aria-label="Was die Pins bedeuten" onClick={() => setLegende((l) => !l)} className="wn-press" style={{ ...rundKnopf, color: legende ? 'var(--navy)' : 'var(--ink-500)' }}>
            <Icon name="info" size={20} />
          </button>
          {standortHinweis && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-700)', background: 'rgba(255,255,255,0.94)', padding: '4px 8px', borderRadius: 8, boxShadow: 'var(--sh-sm)' }}>{standortHinweis}</span>
          )}
        </div>
        {legende && (
          <>
            <div onClick={() => setLegende(false)} style={{ position: 'absolute', inset: 0, zIndex: 6 }} />
            <div style={{ position: 'absolute', left: 12, right: 12, top: 'calc(124px + env(safe-area-inset-top))', zIndex: 7, ...karteStil, boxShadow: 'var(--sh-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Was die Pins bedeuten</span>
              {([['var(--gold)', 'solid #fff', 'var(--navy-900)', 'Top 3 nach Sternen · nächstes Ziel'], ['var(--navy)', 'solid #fff', 'var(--pergament)', 'Besucht · auch vor der App'], ['var(--muc-blau)', 'solid #fff', '#fff', 'Ausgewählt'], ['#fff', 'dashed var(--ink-300)', 'var(--ink-500)', 'Vorschlag, noch nicht besucht']] as const).map(([bg, rand, fg, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: bg, border: `2px ${rand}`, boxShadow: '0 4px 10px rgba(7,25,58,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="beer" size={16} color={fg} stroke={2.4} style={{ transform: 'rotate(45deg)' }} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{text}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {aktiv && (
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 5 }}>
            {nurEntdeckt(aktiv) || (aktiv.vorbewertet && !aktiv.besuchtAm && !aktiv.naechstes) ? (
              <VorschlagKarte e={aktiv} idx={safeIdx} count={eintraege.length} onPrev={() => step(-1)} onNext={() => step(1)} ich={ich} ort={ort} reservieren={reservieren} onDetail={() => setDetail({ e: aktiv, rank: null })} />
            ) : (
              <KartenKarte
                e={aktiv}
                idx={safeIdx}
                count={eintraege.length}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
                ort={ort}
                onOpen={() => {
                  // „Nächstes Mal" antippen → direkt in Google Maps navigieren
                  if (aktiv.naechstes) {
                    window.open(navigationsUrl({ name: aktiv.name, lat: aktiv.lat, lng: aktiv.lng }, ort), '_blank', 'noopener');
                    return;
                  }
                  setDetail({ e: aktiv, rank: null });
                }}
              />
            )}
          </div>
        )}
        {detail && <DetailModal e={detail.e} rank={detail.rank} onClose={() => setDetail(null)} ich={ich} reservieren={reservieren} />}
        {eintraege.length === 0 && (
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 20, zIndex: 5, ...karteStil, padding: 16, boxShadow: 'var(--sh-lg)', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
            Wirtshäuser, die ihr entdeckt, bewertet oder bsucht, erscheinen hier auf der Karte.
          </div>
        )}
      </div>
    );
  }

  /* ── STERNE / SCHMARRN / BRODN: Champion als Bild-Karte, drunter die Liste ── */
  const mc = METRIKEN[view];
  const feld = mc.field as Feld;
  // S’Stammhaus steht in jeder Rangliste fix auf der 1, ohne Wertung (Julius, 15.09.2026)
  const stammhausEintrag = eintraege.find((e) => e.stammhaus) ?? null;
  const gewertet = besucht
    .filter((e) => !e.stammhaus && (e[feld] || 0) > 0)
    .sort((a, b) => (b[feld] || 0) - (a[feld] || 0));
  const ranked = stammhausEintrag ? [stammhausEintrag, ...gewertet] : gewertet;
  const champ = ranked[0];
  const hinweisZu = (e: ArchivEintrag) => (mc.art ? e.hinweise.find((h) => h.art === mc.art)?.text ?? null : null);
  const untertitel = (e: ArchivEintrag) => {
    if (mc.art) return hinweisZu(e) ?? (e.altbestand ? 'Vor der App · nachbewertet' : e.bezirk ?? '');
    if (e.altbestand) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="scroll" size={13} />Vor der App{e.bezirk ? ` · ${e.bezirk}` : ''}</span>;
    return [e.bezirk, e.besuchtAm].filter(Boolean).join(' · ');
  };

  return (
    <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sticky-Ansichts-Wechsel, wia auf der Karte */}
      <div style={{ position: 'sticky', top: 0, zIndex: 15, margin: '0 -16px', padding: 'calc(12px + env(safe-area-inset-top)) 16px 8px', background: 'var(--bg-app)' }}>
        <Ansichten value={view} onChange={setView} ohneKarte={ohneKarte} />
      </div>

      {champ && (
        <div
          onClick={() => setDetail({ e: champ, rank: 1 })}
          style={{ position: 'relative', height: 184, borderRadius: 22, overflow: 'hidden', background: champ.photoUrl ? `url(${JSON.stringify(champ.photoUrl)}) center/cover` : 'var(--grad-navy)', border: '1.5px solid var(--gold)', boxShadow: 'var(--sh-lg)', color: 'var(--pergament)', cursor: 'pointer' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,25,58,0.05) 25%, rgba(7,25,58,0.9) 100%)' }} />
          <span style={{ position: 'absolute', left: 14, top: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Icon name={champ.stammhaus ? 'home' : 'crown'} size={14} stroke={2.4} />
            {champ.stammhaus ? 'Stammhaus' : mc.champ}
          </span>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: champ.name.length > 18 ? 26 : 32, lineHeight: 1, color: 'var(--gold-bright)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{champ.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mc.art
                  ? (hinweisZu(champ) ?? champ.bezirk ?? '')
                  : champ.stammhaus
                    ? 'außer Konkurrenz, des kennt jeder'
                    : [champ.bezirk, champ.wertungen ? `${champ.wertungen.sterne} ${champ.wertungen.sterne === 1 ? 'Wertung' : 'Wertungen'}` : null].filter(Boolean).join(' · ')}
              </span>
            </div>
            {!champ.stammhaus && (
              <span className="wn-tnum" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: 'var(--pergament)', whiteSpace: 'nowrap', flex: 'none' }}>
                {dez(champ[feld])}{!mc.art && <span style={{ fontSize: 20, color: 'var(--gold-bright)' }}> ★</span>}
              </span>
            )}
          </div>
        </div>
      )}

      <ZeilenKarte>
        {ranked.slice(1).map((e, i) => {
          const rang = i + 2;
          return (
            <Zeile
              key={e.id}
              kachel={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flex: 'none' }}>
                  {rang <= 3 ? (
                    <span className="wn-tnum" style={{ width: 28, height: 28, borderRadius: '50%', background: rang === 2 ? '#C7D0DA' : '#C98B5A', color: 'var(--ink-900)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{rang}</span>
                  ) : (
                    <span className="wn-tnum" style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 800, color: 'var(--ink-300)' }}>{rang}</span>
                  )}
                  <span style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', background: e.photoUrl ? `url(${JSON.stringify(e.photoUrl)}) center/cover` : streifen }} />
                </span>
              }
              titel={e.name}
              untertitel={untertitel(e)}
              chip={
                <span className="wn-tnum" style={{ flex: 'none', fontSize: 15, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                  {dez(e[feld])}{!mc.art && <span style={{ color: 'var(--gold)' }}> ★</span>}
                </span>
              }
              onClick={() => setDetail({ e, rank: rang })}
              letzte={i === ranked.length - 2}
              style={{ minHeight: 60 }}
            />
          );
        })}
        {ranked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--ink-500)', fontSize: 14, fontWeight: 600 }}>{mc.leer}</div>
        )}
        {ranked.length === 1 && (
          <div style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ink-500)', fontSize: 13, fontWeight: 600 }}>Mehr gibt’s no ned, kommt mit jedem Abend.</div>
        )}
      </ZeilenKarte>

      {detail && <DetailModal e={detail.e} rank={detail.rank} onClose={() => setDetail(null)} ich={ich} reservieren={reservieren} />}
    </div>
  );
}

/* ── Blätter-Punkte unterm Kärtchen ── */
function Punkte({ idx, count }: { idx: number; count: number }) {
  if (count <= 1) return null;
  if (count > 12) {
    return <div className="wn-tnum" style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', paddingBottom: 10 }}>{idx + 1} / {count}</div>;
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 999, background: i === idx ? 'var(--navy)' : 'var(--ink-200)', transition: 'width 200ms var(--ease-standard)' }} />
      ))}
    </div>
  );
}

/** Wisch-Hülle: links/rechts wischen blättert durch die Pins. */
function Wischbar({ onPrev, onNext, children }: { onPrev: () => void; onNext: () => void; children: React.ReactNode }) {
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
      style={{ background: 'var(--weiss)', borderRadius: 22, border: '1.5px solid var(--gold)', boxShadow: '0 14px 36px rgba(7,25,58,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </div>
  );
}

/* ── Kärtchen über der Karte (1a): Foto mit Status-Chip, Name, Bezirk · Datum, Wertung ── */
function KartenKarte({ e, idx, count, onPrev, onNext, onOpen, ort }: { e: ArchivEintrag; idx: number; count: number; onPrev: () => void; onNext: () => void; onOpen: () => void; ort: string | null }) {
  void ort;
  return (
    <Wischbar onPrev={onPrev} onNext={onNext}>
      <div onClick={onOpen} style={{ height: 118, position: 'relative', cursor: 'pointer', background: e.photoUrl ? `url(${JSON.stringify(e.photoUrl)}) center/cover` : 'var(--grad-navy)' }}>
        <span style={{ position: 'absolute', left: 12, top: 12 }}><StatusChip e={e} /></span>
      </div>
      <div onClick={onOpen} style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.naechstes
              ? [e.bezirk, e.organisator ? `organisiert von ${kurzName(e.organisator.name)}` : null].filter(Boolean).join(' · ')
              : e.stammhaus
                ? [e.bezirk, 'euer Stammhaus'].filter(Boolean).join(' · ')
                : [e.bezirk, e.datumLang ?? (e.altbestand ? 'vor der App' : null)].filter(Boolean).join(' · ')}
          </span>
        </div>
        {e.naechstes ? (
          <RichtungsKnopf ziel={{ name: e.name, lat: e.lat, lng: e.lng }} size={36} />
        ) : e.rating > 0 ? (
          <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap', flex: 'none' }}>{dez(e.rating)} <span style={{ color: 'var(--gold)' }}>★</span></span>
        ) : null}
      </div>
      <Punkte idx={idx} count={count} />
    </Wischbar>
  );
}

/* ── Vorschlag auf der Karte (2e): Organisator reserviert direkt ── */
function VorschlagKarte({ e, idx, count, onPrev, onNext, ich, ort, reservieren, onDetail }: { e: ArchivEintrag; idx: number; count: number; onPrev: () => void; onNext: () => void; ich: { id: string; darfModerieren: boolean }; ort: string | null; reservieren: ((formData: FormData) => Promise<void>) | null; onDetail: () => void }) {
  return (
    <Wischbar onPrev={onPrev} onNext={onNext}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div onClick={e.vorbewertet ? onDetail : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: e.vorbewertet ? 'pointer' : 'default' }}>
          <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 14, background: e.photoUrl ? `url(${JSON.stringify(e.photoUrl)}) center/cover` : streifen }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[e.bezirk, e.gfundenVon ? `gefunden von ${kurzName(e.gfundenVon)}` : null].filter(Boolean).join(' · ')}
            </span>
          </div>
          {e.vorbewertet && e.rating > 0 ? (
            <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap', flex: 'none' }}>{dez(e.rating)} <span style={{ color: 'var(--gold)' }}>★</span></span>
          ) : (
            <StatusChip e={e} />
          )}
        </div>
        {reservieren ? (
          <form action={reservieren}>
            <input type="hidden" name="vorhandenesWirtshausId" value={e.id} />
            <button type="submit" className="wn-press" style={{ ...goldKnopfStil, width: '100%', minHeight: 48, fontSize: 15 }}>Für den nächsten Abend reservieren</button>
          </form>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>Der nächste Organisator kann’s direkt reservieren.</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <a href={ortsUrl({ name: e.name }, ort)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>In Google Maps anschauen</a>
          <button type="button" onClick={onDetail} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
            {e.vorbewertet ? 'Details & bewerten' : 'Schon dort gewesen? Bewerten'}
          </button>
        </div>
        <EntfernenKnopf e={e} ich={ich} />
      </div>
      <Punkte idx={idx} count={count} />
    </Wischbar>
  );
}

/* ── Vorschlag entfernen, zwei Schritte (Admin, Präsident, Finder) ── */
function EntfernenKnopf({ e, ich }: { e: ArchivEintrag; ich: { id: string; darfModerieren: boolean } }) {
  const [nachfrage, setNachfrage] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const darf = ich.darfModerieren || (e.gfundenVonId != null && e.gfundenVonId === ich.id);
  if (!darf || e.besuchtAm || e.altbestand || e.naechstes) return null;
  if (meldung?.ok) {
    return <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)', fontSize: 12, fontWeight: 800, color: 'var(--erfolg)' }}>{meldung.text}</div>;
  }
  if (!nachfrage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" onClick={() => setNachfrage(true)} style={{ alignSelf: 'center', border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--ink-300)', cursor: 'pointer' }}>
          Vorschlag entfernen
        </button>
        {meldung && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)', textAlign: 'center' }}>{meldung.text}</div>}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--strafe-bg)' }}>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>Wirklich? Der WP vom Finder geht damit wieder weg.</span>
      <button type="button" onClick={() => setNachfrage(false)} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--ink-500)', cursor: 'pointer', padding: '6px 8px' }}>Doch ned</button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const ergebnis = await wirtshausEntfernen(e.id);
          setNachfrage(false);
          setMeldung(ergebnis.ok ? { ok: true, text: `✓ „${e.name}“ is von der Karte.` } : { ok: false, text: ergebnis.meldung ?? 'Hat ned klappt.' });
        })}
        style={{ border: 'none', background: 'var(--strafe)', color: '#fff', borderRadius: 10, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: '7px 12px', opacity: pending ? 0.6 : 1 }}
      >
        Weg damit
      </button>
    </div>
  );
}

/* ── Wirtshaus-Detail als Vollbild (1c/2c), auch von der Chronik (Termin-Seite) genutzt ── */
export function DetailModal({
  e,
  rank,
  onClose,
  ich = null,
  reservieren = null,
}: {
  e: ArchivEintrag;
  rank: number | null;
  onClose: () => void;
  ich?: { id: string; darfModerieren: boolean } | null;
  reservieren?: ((formData: FormData) => Promise<void>) | null;
}) {
  const { features, geo } = useTenantConfig();
  const ort = geo?.suchSuffix ?? null;
  const logo = features.brauereiLogos ? bierLogo(e.biersorte) : null;
  const [nachbewertenOffen, setNachbewertenOffen] = useState(false);
  const offen = !e.besuchtAm && !e.naechstes && !e.altbestand;
  const darfNachbewerten = e.altbestand || offen;
  const w = e.wertungen;
  const anzahlText = (n: number | undefined, nach: boolean) => (n == null || n === 0 ? '' : nach ? `${n} Nachbew.` : `${n} ${n === 1 ? 'Wertung' : 'Wertungen'}`);
  const nurNach = !!e.altbestand || offen;

  return (
    <div className="wn-scroll-still" style={{ position: 'fixed', inset: 0, zIndex: 60, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', overflowY: 'auto', overscrollBehavior: 'contain', animation: 'wnWirtshausRein 260ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
      <style>{`@keyframes wnWirtshausRein { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      {/* Foto-Kopf: Chip, Name, Adresse, Brauerei-Logo */}
      <div style={{ position: 'relative', height: e.photoUrl ? 290 : 210, background: e.photoUrl ? `url(${JSON.stringify(e.photoUrl)}) center/cover` : 'var(--grad-navy)' }}>
        <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 140, background: 'linear-gradient(180deg, rgba(7,25,58,0), rgba(7,25,58,0.88))' }} />
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 'calc(60px + env(safe-area-inset-top))', background: 'linear-gradient(rgba(7,25,58,0.45), rgba(7,25,58,0))' }} />
        <button type="button" onClick={onClose} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', right: 16, top: 'calc(14px + env(safe-area-inset-top))', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(7,25,58,0.55)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <Icon name="x" size={18} />
        </button>
        {logo ? (
          <span title={e.biersorte} aria-label={`Bier: ${e.biersorte}`} style={{ position: 'absolute', right: 18, bottom: 16, width: 58, height: 58, borderRadius: '50%', background: 'var(--weiss)', border: '2px solid var(--gold)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={e.biersorte} style={{ width: '76%', height: '76%', objectFit: 'contain' }} />
          </span>
        ) : (
          <span style={{ position: 'absolute', right: 18, bottom: 18, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'var(--font-fraktur)', fontSize: 13, color: 'var(--gold-bright)', whiteSpace: 'nowrap' }}>{e.biersorte}</span>
        )}
        <div style={{ position: 'absolute', left: 18, right: 90, bottom: 14, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--pergament)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <StatusChip e={e} mitDatum />
            {rank && !e.stammhaus && <span style={{ display: 'inline-flex', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>Platz {rank}</span>}
          </div>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: e.name.length > 18 ? 28 : 34, lineHeight: 1, color: 'var(--gold-bright)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{e.name}</span>
          <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={15} />
            {[e.adresse, e.bezirk].filter(Boolean).join(' · ') || 'Adresse folgt'}
          </span>
        </div>
      </div>

      <div style={{ padding: '18px 16px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Drei Wertungen */}
        <div style={{ ...karteStil, display: 'flex' }}>
          {([['rating', 'Wirtshaus', w?.sterne], ['kaiser', 'Schmarrn', w?.kaiser], ['brodn', 'Brodn', w?.brodn]] as const).map(([f, label, n], i) => {
            const wert = e[f];
            const leer = wert <= 0 || (f === 'rating' && e.stammhaus);
            return (
              <div key={f} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '14px 4px', borderLeft: i > 0 ? '1px solid var(--ink-50)' : 'none' }}>
                <span className="wn-tnum" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: leer ? 'var(--ink-200)' : 'var(--navy)' }}>
                  {leer ? '–' : dez(wert)}{!leer && <span style={{ fontSize: 16, color: 'var(--gold)' }}> ★</span>}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-700)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', minHeight: 14 }}>{f === 'rating' && e.stammhaus ? 'außer Konkurrenz' : anzahlText(n, nurNach)}</span>
              </div>
            );
          })}
        </div>

        {/* Der Abend */}
        {e.besuchtAm && !e.stammhaus && (
          <ZeilenKarte>
            <Zeile
              kachel={<Kachel><Icon name="calendar" size={19} /></Kachel>}
              titel={e.datumVoll ?? e.datumLang ?? e.besuchtAm}
              untertitel={e.organisator ? `organisiert von ${kurzName(e.organisator.name)}` : 'ohne Organisator'}
              chip={e.orgaWp != null && e.organisator ? <span className="wn-tnum" style={{ flex: 'none', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--pergament)', color: 'var(--gold-700)' }}>+{e.orgaWp} WP</span> : null}
              pfeil={false}
              style={{ minHeight: 60 }}
            />
            <Zeile
              kachel={<Kachel><Icon name="users" size={19} /></Kachel>}
              titel={`${e.teilnehmer.length} dabei · ${e.hoiben} Bier`}
              untertitel={e.abgeschlossenVon ? `abgeschlossen von ${kurzName(e.abgeschlossenVon)}` : null}
              pfeil={false}
              letzte
              style={{ minHeight: 60 }}
            />
          </ZeilenKarte>
        )}
        {e.stammhaus && (
          <ZeilenKarte>
            <Zeile kachel={<Kachel ton="gold"><Icon name="home" size={19} /></Kachel>} titel={`${e.abende ?? 0} Abende · ${e.hoiben} Bier`} untertitel={`euer Stammhaus${e.besuchtAm ? ` · zuletzt am ${e.besuchtAm}` : ''}`} pfeil={false} letzte style={{ minHeight: 60 }} />
          </ZeilenKarte>
        )}
        {(e.altbestand || offen) && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'var(--info-bg)', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
            <Icon name="info" size={18} color="var(--muc-blau)" style={{ flex: 'none' }} />
            {e.altbestand
              ? 'Besucht vor der App-Zeit. Sterne zählen in der Wertung, Punkte gibt’s dafür keine.'
              : `${e.gfundenVon ? `Entdeckt von ${kurzName(e.gfundenVon)}` : 'Entdeckt'} · noch kein Stammtisch dort. Wer schon dort war, bewertet hier, Punkte gibt’s dafür keine.`}
          </div>
        )}

        {/* Wer war dabei */}
        {e.teilnehmer.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel>Wer war dabei</HoamTitel>
            <ZeilenKarte>
              {e.teilnehmer.map((t, i) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, borderBottom: i < e.teilnehmer.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
                  <Avatar src={t.photoUrl} name={t.name} size={34} verein={t.verein} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kurzName(t.name)}</span>
                  {([['beer', t.hoiben], ['cookie', t.kaiserschmarrn], ['bowl', t.schweinsbraten]] as const).map(([icon, n]) => (
                    <span key={icon} className="wn-tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 800, color: n > 0 ? 'var(--navy)' : 'var(--ink-200)', minWidth: 34 }}>
                      <Icon name={icon} size={15} color={n > 0 ? 'var(--gold-700)' : 'var(--ink-200)'} />
                      {n}
                    </span>
                  ))}
                </div>
              ))}
            </ZeilenKarte>
          </section>
        )}

        {/* Hinweise der Spezln */}
        {e.hinweise.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel action={<span style={bereichHinweisStil}>von den Spezln</span>}>Hinweise</HoamTitel>
            <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {e.hinweise.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <Icon name={h.art === 'kaisi' ? 'cookie' : h.art === 'brodn' ? 'bowl' : 'star'} size={18} color="var(--gold-700)" style={{ flex: 'none', marginTop: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-700)' }}>„{h.text}“</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-300)' }}>{h.von} · {h.art === 'kaisi' ? 'Schmarrn' : h.art === 'brodn' ? 'Brodn' : 'Wirtshaus'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vorschlag: reservieren / anschauen / entfernen */}
        {offen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reservieren && (
              <form action={reservieren}>
                <input type="hidden" name="vorhandenesWirtshausId" value={e.id} />
                <button type="submit" className="wn-press" style={{ ...goldKnopfStil, width: '100%', minHeight: 48, fontSize: 15 }}>Für den nächsten Abend reservieren</button>
              </form>
            )}
            <a href={ortsUrl({ name: e.name }, ort)} target="_blank" rel="noopener noreferrer" className="wn-press" style={{ height: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              <Icon name="richtung" size={18} />
              In Google Maps anschauen
            </a>
            {ich && <EntfernenKnopf e={e} ich={ich} />}
          </div>
        )}

        {/* Nachbewerten (2d): freiwillig, ohne Punkte */}
        {darfNachbewerten && (nachbewertenOffen ? (
          <Nachbewertung wirtshausId={e.id} name={e.name} meine={e.meineBewertung} onFertig={() => setNachbewertenOffen(false)} />
        ) : (
          <button type="button" className="wn-press" onClick={() => setNachbewertenOffen(true)} style={{ height: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            <Icon name="pencil" size={18} />
            {e.meineBewertung ? 'Meine Bewertung ändern' : 'Nachbewerten'}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Freiwillige Nachbewertung (2d): Wirtshaus-Sterne mit Satz, Schweinsbraten und
 * Kaiserschmarrn erst auf Tipp. Bewusst OHNE WP, damit koaner mit
 * Schmarrn-Bewertungen Punkte sammelt; fließt gewichtet in die drei Wertungen.
 */
function Nachbewertung({ wirtshausId, name, meine, onFertig }: { wirtshausId: string; name: string; meine?: ArchivEintrag['meineBewertung']; onFertig: () => void }) {
  const [sterne, setSterne] = useState(meine?.sterne ?? 4);
  const [kommentar, setKommentar] = useState(meine?.kommentar ?? '');
  const [kaiserAktiv, setKaiserAktiv] = useState(meine?.kaiserSterne != null);
  const [kaiserSterne, setKaiserSterne] = useState(meine?.kaiserSterne ?? 4);
  const [kaiserNotiz, setKaiserNotiz] = useState(meine?.kaiserNotiz ?? '');
  const [brodnAktiv, setBrodnAktiv] = useState(meine?.brodnSterne != null);
  const [brodnSterne, setBrodnSterne] = useState(meine?.brodnSterne ?? 4);
  const [brodnNotiz, setBrodnNotiz] = useState(meine?.brodnNotiz ?? '');
  const [gespeichert, setGespeichert] = useState(false);
  const [pending, startTransition] = useTransition();
  const clamp1 = (v: number) => Math.max(1, v);

  const speichern = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set('wirtshausId', wirtshausId);
      fd.set('sterne', String(clamp1(sterne)));
      fd.set('kaiserSterne', kaiserAktiv ? String(clamp1(kaiserSterne)) : '');
      fd.set('brodnSterne', brodnAktiv ? String(clamp1(brodnSterne)) : '');
      fd.set('kommentar', kommentar);
      fd.set('kaiserNotiz', kaiserNotiz);
      fd.set('brodnNotiz', brodnNotiz);
      await nachbewerten(fd);
      setGespeichert(true);
      setTimeout(onFertig, 1200);
    });

  const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', outline: 'none' };
  const block = (icon: string, label: string, aktiv: boolean, setAktiv: ((a: boolean) => void) | null, wert: number, setWert: (v: number) => void, notiz: string, setNotiz: (t: string) => void, platzhalter: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--ink-50)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Kachel ton="gold"><Icon name={icon} size={19} /></Kachel>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{label}</span>
        {aktiv ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KompaktStepper value={wert} onChange={setWert} size={34} />
            {setAktiv && (
              <button type="button" onClick={() => { setAktiv(false); setNotiz(''); }} aria-label={`${label} doch ned bewerten`} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-300)', padding: 2, display: 'inline-flex' }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setAktiv?.(true)} style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 999, border: '1.5px dashed var(--gold)', background: 'none', color: 'var(--gold-700)', fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>+ bewerten</button>
        )}
      </div>
      {aktiv && <input value={notiz} onChange={(ev) => setNotiz(ev.target.value)} placeholder={platzhalter} maxLength={500} style={feld} />}
    </div>
  );

  return (
    <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>{name} nachbewerten</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: -6 }}>aus der Erinnerung · ohne Punkte</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {block('home', 'Wirtshaus', true, null, sterne, setSterne, kommentar, setKommentar, 'Wie war’s?')}
        {block('bowl', 'Schweinsbraten', brodnAktiv, setBrodnAktiv, brodnSterne, setBrodnSterne, brodnNotiz, setBrodnNotiz, 'Kruste, Knödl, Soße …')}
        {block('cookie', 'Kaiserschmarrn', kaiserAktiv, setKaiserAktiv, kaiserSterne, setKaiserSterne, kaiserNotiz, setKaiserNotiz, 'Fluffig? Rosinen?')}
      </div>
      <button type="button" className="wn-press" onClick={speichern} disabled={pending || gespeichert} style={{ ...goldKnopfStil, minHeight: 52, opacity: pending ? 0.7 : 1 }}>
        {gespeichert ? '✓ Gespeichert, vergelt’s Gott!' : pending ? 'Speichert …' : 'Speichern'}
      </button>
    </div>
  );
}
