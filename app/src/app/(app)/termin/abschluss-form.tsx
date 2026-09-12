'use client';

import { useMemo, useState } from 'react';
import { Avatar, Button, Input } from '@/components/ds';
import { HELLE_WAHL, WEISSBIERE, STANDARD_BIERSORTE } from '@/lib/biersorten';
import { PTS } from '@/lib/punkte';
import { BierWahl } from '@/components/domain/BierWahl';

export type AbschlussMitglied = {
  id: string;
  name: string;
  photoUrl: string | null;
  verein: string | null;
  /** hat beim Termin zugesagt → steht von Anfang an auf der Liste */
  zugesagt: boolean;
};

export type AbschlussWerte = {
  rows: Record<string, { hoiben: number; schnaps?: number; brodn: boolean; taxi: boolean; runde: boolean; abgsagt: boolean }>;
  kaisiBestellt: boolean;
  biersorte: string;
  weissbier: string;
} | null;

/**
 * Besuch abschließen, NUR die Logistik des Abends (Design-Sheet terminSheets.jsx
 * CloseVisitSheet): wer da war, Hoiben, 🍖/🚕/⭐(Runde), Kaiserschmarrn bestellt
 * (einer für alle), Bier & Weißbier mit Logo. Bewertet wird GETRENNT, jeder für
 * sich über „Mei Bewertung". Abschließen darf jeder, der Erste kriegt
 * PTS.abschluss WP.
 */
export function AbschlussForm({
  mitglieder,
  action,
  initial,
  submitLabel = 'Abschließen & ins Archiv',
  naechsterTermin = false,
  schnapsAn = false,
}: {
  mitglieder: AbschlussMitglied[];
  action: (formData: FormData) => Promise<void>;
  initial?: AbschlussWerte;
  submitLabel?: string;
  /** Beim ersten Abschluss: der Abschließer legt gleich den nächsten Stammtisch fest (Datum + Uhrzeit, Pflicht) */
  naechsterTermin?: boolean;
  /** Feature schnaps: 🥃-Stepper je Spezl */
  schnapsAn?: boolean;
}) {
  type Row = { hoiben: number; schnaps: number; brodn: boolean; taxi: boolean; runde: boolean; abgsagt: boolean };
  const leer: Row = { hoiben: 0, schnaps: 0, brodn: false, taxi: false, runde: false, abgsagt: false };

  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const r: Record<string, Row> = {};
    for (const m of mitglieder) {
      const init = initial?.rows[m.id];
      if (init) r[m.id] = { ...init, schnaps: init.schnaps ?? 0 };
      else if (m.zugesagt && !initial) r[m.id] = { ...leer };
    }
    return r;
  });
  const [kaisiBestellt, setKaisiBestellt] = useState(initial?.kaisiBestellt ?? false);
  const [biersorte, setBiersorte] = useState(initial?.biersorte ?? STANDARD_BIERSORTE);
  const [weissbier, setWeissbier] = useState(initial?.weissbier ?? '');

  const gelistet = mitglieder.filter((m) => rows[m.id]);
  const dabei = gelistet.filter((m) => !rows[m.id].abgsagt);
  const fehlen = mitglieder.filter((m) => !rows[m.id]);
  const gesamtHoiben = dabei.reduce((s, m) => s + rows[m.id].hoiben, 0);
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
      if (schnapsAn) felder.push([`schnaps_${m.id}`, String(r.schnaps)]);
      if (r.brodn) felder.push([`brodn_${m.id}`, 'on']);
      if (r.taxi) felder.push([`taxi_${m.id}`, 'on']);
      if (r.runde) felder.push([`runde_${m.id}`, 'on']);
    }
    if (kaisiBestellt) felder.push(['kaisiBestellt', 'on']);
    felder.push(['biersorte', biersorte]);
    felder.push(['weissbier', weissbier]);
    return felder;
  }, [gelistet, rows, kaisiBestellt, biersorte, weissbier]);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {versteckteFelder.map(([name, value], i) => (
        <input key={`${name}_${i}`} type="hidden" name={name} value={value} />
      ))}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>
        Pro Mitglied · {gesamtHoiben} Hoibe gesamt
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
                  Abgsagt · zahlt a Runde
                </span>
              ) : (
                <>
                  <RundToggle an={r.taxi} onToggle={() => patch(m.id, { taxi: !r.taxi })} title="Mit'm Auto da & Spezln mitgnommen (Taxler)">🚕</RundToggle>
                  <RundToggle an={r.brodn} onToggle={() => patch(m.id, { brodn: !r.brodn })} title="Schweinsbraten gegessen">🍖</RundToggle>
                  <RundToggle an={r.runde} onToggle={() => patch(m.id, { runde: !r.runde })} title="Hat a Runde gschmissen (Großbauer)">⭐</RundToggle>
                  <MiniStepper value={r.hoiben} onChange={(v) => patch(m.id, { hoiben: v })} />
                  {schnapsAn && <MiniStepper value={r.schnaps} onChange={(v) => patch(m.id, { schnaps: v })} icon="🥃" />}
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

      {/* Kaiserschmarrn, einer für alle (bewertet wird er bei „Mei Bewertung") */}
      <div style={{ border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <button type="button" onClick={() => setKaisiBestellt(!kaisiBestellt)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', background: kaisiBestellt ? 'var(--pergament)' : 'var(--weiss)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 'var(--r-md)', background: kaisiBestellt ? 'var(--grad-gold)' : 'var(--pergament)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥞</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Kaiserschmarrn?</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
              {kaisiBestellt ? 'Oana bestellt, wird eh immer geteilt.' : 'Habt’s an bestellt? Antippen.'}
            </span>
          </span>
          <span style={{ fontSize: 18, color: kaisiBestellt ? 'var(--gold-700)' : 'var(--ink-200)', fontWeight: 800 }}>{kaisiBestellt ? '✓' : '+'}</span>
        </button>
      </div>

      {/* Bier & Weißbier */}
      <div style={{ marginTop: 14 }}>
        <BierWahl label="Welches Helle?" biere={HELLE_WAHL} value={biersorte} onChange={setBiersorte} />
      </div>
      <div style={{ marginTop: 10 }}>
        <BierWahl label="Welches Weißbier?" biere={WEISSBIERE} value={weissbier} onChange={setWeissbier} leerLabel="Koa Weißbier / wissen wir nimmer" />
      </div>

      {/* Wer abschließt, macht den nächsten Termin aus — Datum + Uhrzeit reichen,
          zu-/absagen tun danach alle selber (Julius, 11.09.2026) */}
      {naechsterTermin && (
        <div style={{ marginTop: 18, padding: '14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Und wann geht’s weiter?</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
              Wer abschließt, macht den nächsten Stammtisch aus. Zu- oder absagen tun danach alle selber.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
            <Input label="Datum" name="naechstesDatum" type="date" required />
            <Input label="Uhrzeit" name="naechsteZeit" type="time" defaultValue="19:00" />
          </div>
        </div>
      )}

      <Button type="submit" fullWidth variant="gold" size="lg" style={{ marginTop: 18 }}>
        {submitLabel}
      </Button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', marginTop: 8 }}>
        Abschließen darf jeder, der Erste kriagt +{PTS.abschluss} WP. Nachtragen geht noch a Woch’.
        Bewertet wird extra: jeder für sich bei „Mei Bewertung“.
      </div>
    </form>
  );
}

/** Runder Icon-Toggle wie im Design (grau bis aktiviert, dann Gold). */
function RundToggle({ an, onToggle, title, children }: { an: boolean; onToggle: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" className="wn-press" onClick={onToggle} title={title}
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
function MiniStepper({ value, onChange, icon }: { value: number; onChange: (v: number) => void; /** Kennzeichen vor dem Zähler (z. B. 🥃), ohne = die Hoibe wie gehabt */ icon?: string }) {
  const btn: React.CSSProperties = {
    width: 28, height: 28, flex: 'none', borderRadius: '50%', border: '1.5px solid var(--ink-200)',
    background: 'var(--weiss)', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: 'var(--navy)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
      <button type="button" className="wn-press" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Weniger" style={btn}>−</button>
      <span className="wn-tnum" style={{ minWidth: 20, textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'var(--gold-700)' }}>{value}</span>
      <button type="button" className="wn-press" onClick={() => onChange(Math.min(30, value + 1))} aria-label="Mehr" style={btn}>+</button>
    </div>
  );
}

