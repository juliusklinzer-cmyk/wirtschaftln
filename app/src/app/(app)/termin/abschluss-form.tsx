'use client';

import { useMemo, useState } from 'react';
import { Avatar, Button } from '@/components/ds';
import { HELLE, WEISSBIERE, STANDARD_BIERSORTE } from '@/lib/biersorten';
import { PTS } from '@/lib/punkte';
import { BierWahl } from '@/components/domain/BierWahl';

export type AbschlussMitglied = {
  id: string;
  name: string;
  photoUrl: string | null;
  verein: 'bayern' | 'sechzig' | null;
  /** hat beim Termin zugesagt → steht von Anfang an auf der Liste */
  zugesagt: boolean;
};

export type AbschlussWerte = {
  rows: Record<string, { hoiben: number; brodn: boolean; taxi: boolean; runde: boolean; abgsagt: boolean }>;
  sterne: number | null;
  kommentar: string;
  kaisiBestellt: boolean;
  kaiserSterne: number | null;
  kaiserNotiz: string;
  brodnSterne: number | null;
  brodnNotiz: string;
  biersorte: string;
  weissbier: string;
} | null;

/**
 * Besuch abschließen — Design-Sheet (terminSheets.jsx CloseVisitSheet) mit den
 * Stammtisch-Regeln: abschließen darf jeder (der Erste kriegt PTS.abschluss WP), Kaiserschmarrn wird immer
 * geteilt (einer für alle), Brodn-Bewertung nur wenn wer 🍖 gegessen hat,
 * ⭐ markiert eine geschmissene Runde (Großbauer), Bier & Weißbier mit Logo.
 */
export function AbschlussForm({
  mitglieder,
  action,
  initial,
  submitLabel = 'Abschließen & ins Archiv',
}: {
  mitglieder: AbschlussMitglied[];
  action: (formData: FormData) => Promise<void>;
  initial?: AbschlussWerte;
  submitLabel?: string;
}) {
  type Row = { hoiben: number; brodn: boolean; taxi: boolean; runde: boolean; abgsagt: boolean };
  const leer: Row = { hoiben: 0, brodn: false, taxi: false, runde: false, abgsagt: false };

  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const r: Record<string, Row> = {};
    for (const m of mitglieder) {
      const init = initial?.rows[m.id];
      if (init) r[m.id] = { ...init };
      else if (m.zugesagt && !initial) r[m.id] = { ...leer };
    }
    return r;
  });
  const [sterne, setSterne] = useState(initial?.sterne ?? 3);
  const [kommentar, setKommentar] = useState(initial?.kommentar ?? '');
  const [kaisiBestellt, setKaisiBestellt] = useState(initial?.kaisiBestellt ?? false);
  const [kaiserSterne, setKaiserSterne] = useState(initial?.kaiserSterne ?? 3);
  const [kaiserNotiz, setKaiserNotiz] = useState(initial?.kaiserNotiz ?? '');
  const [brodnSterne, setBrodnSterne] = useState(initial?.brodnSterne ?? 3);
  const [brodnNotiz, setBrodnNotiz] = useState(initial?.brodnNotiz ?? '');
  const [biersorte, setBiersorte] = useState(initial?.biersorte ?? STANDARD_BIERSORTE);
  const [weissbier, setWeissbier] = useState(initial?.weissbier ?? '');

  const gelistet = mitglieder.filter((m) => rows[m.id]);
  const dabei = gelistet.filter((m) => !rows[m.id].abgsagt);
  const fehlen = mitglieder.filter((m) => !rows[m.id]);
  const gesamtHoiben = dabei.reduce((s, m) => s + rows[m.id].hoiben, 0);
  const brodnGegessen = dabei.some((m) => rows[m.id].brodn);
  const patch = (id: string, p: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...p } }));

  const versteckteFelder = useMemo(() => {
    const felder: Array<[string, string]> = [];
    for (const m of gelistet) {
      const r = rows[m.id];
      felder.push(['memberId', m.id]);
      if (r.abgsagt) {
        felder.push([`abgsagt_${m.id}`, 'on']);
        continue;
      }
      felder.push([`anwesend_${m.id}`, 'on']);
      felder.push([`hoiben_${m.id}`, String(r.hoiben)]);
      if (r.brodn) felder.push([`brodn_${m.id}`, 'on']);
      if (r.taxi) felder.push([`taxi_${m.id}`, 'on']);
      if (r.runde) felder.push([`runde_${m.id}`, 'on']);
    }
    felder.push(['sterne', String(sterne)]);
    felder.push(['kommentar', kommentar]);
    if (kaisiBestellt) {
      felder.push(['kaisiBestellt', 'on'], ['kaiserSterne', String(kaiserSterne)], ['kaiserNotiz', kaiserNotiz]);
    }
    if (brodnGegessen) {
      felder.push(['brodnSterne', String(brodnSterne)], ['brodnNotiz', brodnNotiz]);
    }
    felder.push(['biersorte', biersorte]);
    felder.push(['weissbier', weissbier]);
    return felder;
  }, [gelistet, rows, sterne, kommentar, kaisiBestellt, kaiserSterne, kaiserNotiz, brodnGegessen, brodnSterne, brodnNotiz, biersorte, weissbier]);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {versteckteFelder.map(([name, value], i) => (
        <input key={`${name}_${i}`} type="hidden" name={name} value={value} />
      ))}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>
        Pro Mitglied · {gesamtHoiben} Hoiben gesamt
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gelistet.map((m) => {
          const r = rows[m.id];
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px', border: r.abgsagt ? '1px solid var(--strafe)' : '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', background: r.abgsagt ? 'var(--strafe-bg)' : 'var(--weiss)' }}>
              <Avatar src={m.photoUrl} name={m.name} size={34} verein={m.verein} />
              {/* Name antippen = Abgsagt (zugesagt & nicht erschienen → Runde als Strafe) */}
              <button type="button" onClick={() => patch(m.id, { abgsagt: !r.abgsagt })} title="Antippen: zugesagt & nicht erschienen"
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: r.abgsagt ? 'var(--strafe)' : 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: r.abgsagt ? 'line-through' : 'none' }}>
                {m.name.split(' ')[0]}
              </button>
              {r.abgsagt ? (
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--strafe)', whiteSpace: 'nowrap' }}>
                  ❌ Abgsagt · zahlt a Runde
                </span>
              ) : (
                <>
                  <RundToggle an={r.taxi} onToggle={() => patch(m.id, { taxi: !r.taxi })} title="Mit'm Auto da & Spezln mitgnommen (Taxler)">🚕</RundToggle>
                  <RundToggle an={r.brodn} onToggle={() => patch(m.id, { brodn: !r.brodn })} title="Schweinsbraten gegessen">🍖</RundToggle>
                  <RundToggle an={r.runde} onToggle={() => patch(m.id, { runde: !r.runde })} title="Hat a Runde gschmissen (Großbauer)">⭐</RundToggle>
                  <MiniStepper value={r.hoiben} onChange={(v) => patch(m.id, { hoiben: v })} />
                </>
              )}
            </div>
          );
        })}
      </div>
      {fehlen.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {fehlen.map((m) => (
            <button key={m.id} type="button" onClick={() => setRows((r) => ({ ...r, [m.id]: { ...leer } }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 5px', borderRadius: 'var(--r-pill)', border: '1.5px dashed var(--ink-200)', background: 'var(--weiss)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>
              <Avatar src={m.photoUrl} name={m.name} size={22} /> + {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--ink-100)', margin: '18px 0' }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 12 }}>Deine Bewertung</div>
      <div style={{ marginBottom: 14 }}>
        <SterneStepper value={sterne} onChange={setSterne} />
      </div>
      <textarea value={kommentar} onChange={(e) => setKommentar(e.target.value)} rows={3} placeholder="Wie war’s? Bedienung, Bier, Brotzeit…" style={textareaStyle} />

      {/* Kaiserschmarrn — einer für alle */}
      <div style={{ marginTop: 14, border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <button type="button" onClick={() => setKaisiBestellt(!kaisiBestellt)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', background: kaisiBestellt ? 'var(--pergament)' : 'var(--weiss)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 'var(--r-md)', background: kaisiBestellt ? 'var(--grad-gold)' : 'var(--pergament)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥞</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Kaiserschmarrn?</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
              {kaisiBestellt ? 'Oana bestellt — wird eh immer geteilt.' : 'Habt’s an bestellt? Antippen.'}
            </span>
          </span>
          <span style={{ fontSize: 18, color: kaisiBestellt ? 'var(--gold-700)' : 'var(--ink-200)', fontWeight: 800 }}>{kaisiBestellt ? '✓' : '+'}</span>
        </button>
        {kaisiBestellt && (
          <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
            <SterneStepper value={kaiserSterne} onChange={setKaiserSterne} />
            <textarea value={kaiserNotiz} onChange={(e) => setKaiserNotiz(e.target.value)} rows={2} placeholder="Fluffig? Z’wenig Rosinen? Erzähl…" style={{ ...textareaStyle, marginTop: 12 }} />
          </div>
        )}
      </div>

      {/* Brodn — nur wenn oben wer 🍖 gegessen hat */}
      {brodnGegessen && (
        <div style={{ marginTop: 10, border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--pergament)' }}>
            <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 'var(--r-md)', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍖</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Der Brodn</span>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>Wie war er? Damit geht’s Wirtshaus in d’Brodn-Wertung.</span>
            </span>
          </div>
          <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
            <SterneStepper value={brodnSterne} onChange={setBrodnSterne} />
            <textarea value={brodnNotiz} onChange={(e) => setBrodnNotiz(e.target.value)} rows={2} placeholder="Knusprig? Soß’n a Gedicht? Erzähl…" style={{ ...textareaStyle, marginTop: 12 }} />
          </div>
        </div>
      )}

      {/* Bier & Weißbier */}
      <div style={{ marginTop: 14 }}>
        <BierWahl label="Welches Helle?" biere={HELLE} value={biersorte} onChange={setBiersorte} />
      </div>
      <div style={{ marginTop: 10 }}>
        <BierWahl label="Welches Weißbier?" biere={WEISSBIERE} value={weissbier} onChange={setWeissbier} leerLabel="Koa Weißbier / wissen wir nimmer" />
      </div>

      <Button type="submit" fullWidth variant="gold" size="lg" iconLeft="🍺" style={{ marginTop: 18 }}>
        {submitLabel}
      </Button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', marginTop: 8 }}>
        Abschließen darf jeder — der Erste kriagt +{PTS.abschluss} WP. Nachtragen geht noch a Woch’.
      </div>
    </form>
  );
}

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)',
  padding: 12, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink-900)', resize: 'none', outline: 'none',
  background: 'var(--weiss)',
};

/** Runder Icon-Toggle wie im Design (grau bis aktiviert, dann Gold). */
function RundToggle({ an, onToggle, title, children }: { an: boolean; onToggle: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onToggle} title={title}
      style={{
        width: 34, height: 34, flex: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 16,
        border: an ? 'none' : '1.5px solid var(--ink-200)',
        background: an ? 'var(--grad-gold)' : 'var(--weiss)',
        filter: an ? 'none' : 'grayscale(1) opacity(0.5)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--dur-fast) var(--ease-standard)',
      }}>
      {children}
    </button>
  );
}

/** ± Zähler für Hoiben (Design: MiniStepper). */
function MiniStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const btn: React.CSSProperties = {
    width: 28, height: 28, flex: 'none', borderRadius: '50%', border: '1.5px solid var(--ink-200)',
    background: 'var(--weiss)', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: 'var(--navy)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Weniger" style={btn}>−</button>
      <span className="wn-tnum" style={{ minWidth: 20, textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'var(--gold-700)' }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(30, value + 1))} aria-label="Mehr" style={btn}>+</button>
    </div>
  );
}

/** ± Stepper für eine Bewertung mit einer Kommastelle, startet bei 3,0 (Design: StarStepper). */
function SterneStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(0, Math.min(5, Math.round(v * 10) / 10));
  const btn: React.CSSProperties = {
    width: 44, height: 44, flex: 'none', borderRadius: '50%', border: '1.5px solid var(--ink-200)',
    background: 'var(--weiss)', cursor: 'pointer', fontSize: 22, fontWeight: 800, color: 'var(--navy)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <button type="button" onClick={() => onChange(clamp(value - 0.1))} aria-label="Weniger" style={btn}>−</button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 96, justifyContent: 'center' }}>
        <span className="wn-tnum" style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
          {value.toFixed(1).replace('.', ',')}
        </span>
        <span style={{ fontSize: 24, color: 'var(--gold)' }}>★</span>
      </div>
      <button type="button" onClick={() => onChange(clamp(value + 0.1))} aria-label="Mehr" style={btn}>+</button>
    </div>
  );
}
