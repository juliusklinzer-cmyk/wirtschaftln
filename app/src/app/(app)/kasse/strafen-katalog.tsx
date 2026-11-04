'use client';

import { useEffect, useState, useTransition } from 'react';
import { Icon, ZeilenKarte } from '@/components/ds';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { goldKnopfStil, bereichHinweisStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';

export type RegelZeile = {
  id: string;
  art: 'unentschuldigt' | 'entschuldigt' | 'serie' | 'eigene';
  name: string;
  detail: string | null;
  /** WP-Abzüge als positive Zahlen (5 = −5 WP) */
  abzuege: number[];
  betragCents: number;
  fristArt: 'beginn' | 'tage' | 'stunden';
  fristWert: number;
  nichtEingetragenZusage: boolean;
  erlassbar: boolean;
  aktiv: boolean;
  /** „Bis zum Beginn absagen · 20 € · −5/−10/−15 WP“ */
  zusammenfassung: string;
  /** „geändert am 4. Nov. von Julius“ */
  geaendert: string | null;
};

export type BuchungZeile = {
  id: string;
  wer: string;
  name: string;
  folge: string;
  datum: string;
  erlassen: boolean;
  darfErlassen: boolean;
  darfZuruecknehmen: boolean;
};

type Antwort = { ok: boolean; meldung: string };

const BEISPIELE: Array<{ name: string; detail: string; euro: string; wp: string }> = [
  { name: 'Zu spät ab 30 Min', detail: '', euro: '5', wp: '0' },
  { name: 'Zu spät ab 1 Std', detail: '', euro: '10', wp: '0' },
  { name: 'Handy am Tisch', detail: 'Wer beim Essen aufs Handy schaut', euro: '0', wp: '1' },
  { name: 'Weißwurst nach zwölf', detail: '', euro: '2', wp: '0' },
  { name: 'Falsches Bier bestellt', detail: 'Radler, Pils und Co.', euro: '2', wp: '0' },
];

const ART_TEXT: Record<RegelZeile['art'], string> = {
  unentschuldigt: 'Fest · bucht automatisch',
  entschuldigt: 'Fest · nur WP, automatisch',
  serie: 'Fest · bucht automatisch',
  eigene: 'Eigene · wird gebucht',
};

function Feld({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={feldLabelStil}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>{hint}</span>}
    </label>
  );
}

function Haken({ name, label, an, onChange }: { name: string; label: string; an: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--weiss)', border: '1px solid var(--ink-100)', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', cursor: 'pointer' }}>
      <input type="checkbox" name={name} checked={an} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--navy)', margin: 0 }} />
      {label}
    </label>
  );
}

/** Bearbeiten-Formular einer Strafe (fest oder eigen), neu mit `vorlage`. */
function RegelForm({ regel, vorlage, speichern, fertig }: { regel: RegelZeile | null; vorlage?: (typeof BEISPIELE)[number]; speichern: (fd: FormData) => Promise<Antwort>; fertig: (meldung: string) => void }) {
  const art = regel?.art ?? 'eigene';
  const [fristArt, setFristArt] = useState(regel?.fristArt ?? 'beginn');
  const [zusage, setZusage] = useState(regel?.nichtEingetragenZusage ?? true);
  const [erlassbar, setErlassbar] = useState(regel?.erlassbar ?? true);
  const [aktiv, setAktiv] = useState(regel?.aktiv ?? true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const staffel = art === 'unentschuldigt' || art === 'entschuldigt';
  const stufen = staffel ? (regel?.abzuege.length ? regel.abzuege : art === 'unentschuldigt' ? [5, 10, 15] : [0, 1, 5, 10]) : [];
  const euroStart = regel ? (regel.betragCents ? String(regel.betragCents / 100).replace('.', ',') : '') : vorlage && vorlage.euro !== '0' ? vorlage.euro : '';
  const wpStart = regel ? String(regel.abzuege[0] ?? 0) : vorlage?.wp ?? '0';

  return (
    <form
      action={(fd) => {
        setFehler(null);
        startTransition(async () => {
          const r = await speichern(fd);
          if (r.ok) fertig(r.meldung);
          else setFehler(r.meldung);
        });
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {regel && <input type="hidden" name="id" value={regel.id} />}
      <input type="hidden" name="aktiv" value={aktiv ? 'an' : 'aus'} />
      <Feld label="Name">
        <input name="name" required maxLength={80} defaultValue={regel?.name ?? vorlage?.name ?? ''} placeholder="z. B. Zu spät ab 30 Min" style={feldStil} />
      </Feld>
      <Feld label="Detail (optional)" hint="Beschluss, Ausnahmen, alles was dazu gehört.">
        <textarea name="detail" maxLength={500} rows={2} defaultValue={regel?.detail ?? vorlage?.detail ?? ''} placeholder="z. B. Beschluss vom 7.8.2025" style={{ ...feldStil, height: 'auto', minHeight: 64, paddingTop: 10, resize: 'vertical' }} />
      </Feld>

      {art === 'unentschuldigt' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: fristArt === 'beginn' ? '1fr' : '1fr 90px', gap: 10 }}>
            <Feld label="Absagen bis">
              <select name="fristArt" value={fristArt} onChange={(e) => setFristArt(e.target.value as RegelZeile['fristArt'])} style={{ ...feldStil, appearance: 'auto' }}>
                <option value="beginn">zum Beginn</option>
                <option value="tage">24 Uhr, Tage vorher</option>
                <option value="stunden">Stunden vor Beginn</option>
              </select>
            </Feld>
            {fristArt !== 'beginn' && (
              <Feld label={fristArt === 'tage' ? 'Tage' : 'Stunden'}>
                <input name="fristWert" type="number" min={1} max={fristArt === 'tage' ? 14 : 72} defaultValue={regel?.fristWert || 1} style={feldStil} />
              </Feld>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)', marginTop: -8 }}>„1 Tag vorher“ heißt bis 24 Uhr am Vortag. Wer später absagt, fehlt unentschuldigt.</span>
          <Haken name="nichtEingetragenZusage" label="Nicht eingetragen zählt als Zusage" an={zusage} onChange={setZusage} />
        </>
      )}

      {staffel ? (
        <Feld label="WP-Abzug beim 1., 2., … Mal in Folge" hint="Der letzte Wert gilt ab da. Gilt rückwirkend für die laufende Saison.">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stufen.length}, 1fr)`, gap: 8 }}>
            {stufen.map((w, i) => (
              <input key={i} name="staffel" type="number" min={0} max={99} defaultValue={w} aria-label={`${i + 1}. Mal`} style={{ ...feldStil, textAlign: 'center' }} />
            ))}
          </div>
        </Feld>
      ) : (
        <Feld label="WP-Abzug" hint="0 = kostet keine WP.">
          <input name="wp" type="number" min={0} max={99} defaultValue={wpStart} style={feldStil} />
        </Feld>
      )}

      {art !== 'entschuldigt' && (
        <Feld label="Betrag (€)" hint="Leer oder 0 = kostet kein Geld. Steht dann als offene Forderung in der Kasse.">
          <input name="betrag" type="number" step="0.10" min={0} inputMode="decimal" defaultValue={euroStart} placeholder="0,00" style={feldStil} />
        </Feld>
      )}

      <Haken name="erlassbar" label="Kann vom Präsidenten erlassen werden" an={erlassbar} onChange={setErlassbar} />
      {regel && <Haken name="_aktiv" label="Aktiv (abgeschaltet bucht sie nichts mehr)" an={aktiv} onChange={setAktiv} />}

      {fehler && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
      <button type="submit" disabled={pending} className="wn-press" style={{ ...goldKnopfStil, minHeight: 52, opacity: pending ? 0.7 : 1 }}>
        {pending ? 'Wird gespeichert …' : regel ? 'Speichern' : 'In den Katalog'}
      </button>
    </form>
  );
}

/**
 * Strafenkatalog in der Kasse (04.11.2026): jeder sieht, was was kostet, wie
 * eine Satzung. Präsident und Admin legen an und ändern. Drunter die zuletzt
 * gebuchten Strafen, dort wird zurückgenommen und erlassen.
 */
export function StrafenKatalog({
  regeln,
  gebucht,
  darfPflegen,
  speichern,
  erlassen,
  zuruecknehmen,
}: {
  regeln: RegelZeile[];
  gebucht: BuchungZeile[];
  darfPflegen: boolean;
  speichern: (fd: FormData) => Promise<Antwort>;
  erlassen: (id: string) => Promise<boolean>;
  zuruecknehmen: (id: string) => Promise<boolean>;
}) {
  const [offen, setOffen] = useState<{ regel: RegelZeile | null; vorlage?: (typeof BEISPIELE)[number] } | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const eigene = regeln.filter((r) => r.art === 'eigene');

  useEffect(() => {
    if (!erfolg) return;
    const t = setTimeout(() => { setErfolg(null); setOffen(null); }, 1500);
    return () => clearTimeout(t);
  }, [erfolg]);

  const zeile = (r: RegelZeile, i: number, n: number) => (
    <button
      key={r.id}
      type="button"
      disabled={!darfPflegen}
      onClick={() => setOffen({ regel: r })}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', padding: '12px 0', border: 'none', borderBottom: i < n - 1 ? '1px solid var(--ink-50)' : 'none', background: 'none', textAlign: 'left', cursor: darfPflegen ? 'pointer' : 'default', fontFamily: 'var(--font-ui)', opacity: r.aktiv ? 1 : 0.5 }}
    >
      <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: r.art === 'eigene' ? 'var(--strafe-bg)' : 'var(--pergament)', color: r.art === 'eigene' ? 'var(--strafe)' : 'var(--gold-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Gavel size={18} weight="fill" />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{r.name}{r.aktiv ? '' : ' · abgeschaltet'}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{r.zusammenfassung}</span>
        {r.detail && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>{r.detail}</span>}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)' }}>{ART_TEXT[r.art]}{r.erlassbar ? ' · erlassbar' : ' · nicht erlassbar'}{r.geaendert ? ` · ${r.geaendert}` : ''}</span>
      </span>
      {darfPflegen && <Icon name="chevron" size={18} color="var(--ink-300)" style={{ flex: 'none', marginTop: 8 }} />}
    </button>
  );

  const knopfKlein = (farbe: string): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 999, border: `1.5px solid ${farbe}`, background: 'transparent', color: farbe, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: pending ? 0.6 : 1 });

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={<span style={bereichHinweisStil}>gilt für alle</span>}>Strafenkatalog</HoamTitel>
      <ZeilenKarte>{regeln.map((r, i) => zeile(r, i, regeln.length))}</ZeilenKarte>

      {darfPflegen && (
        <>
          <button type="button" onClick={() => setOffen({ regel: null })} className="wn-press" style={{ height: 48, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="plus" size={18} stroke={2.4} />
            Eigene Strafe anlegen
          </button>
          {eigene.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>Beispiele übernehmen, antippen und anpassen:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {BEISPIELE.map((b) => (
                  <button key={b.name} type="button" onClick={() => setOffen({ regel: null, vorlage: b })} style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)', background: 'var(--weiss)', border: '1px solid var(--ink-100)', color: 'var(--ink-700)' }}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {gebucht.length > 0 && (
        <>
          <HoamTitel action={<span style={bereichHinweisStil}>letzte 30 Tage</span>}>Gebuchte Strafen</HoamTitel>
          <ZeilenKarte>
            {gebucht.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '11px 0', borderBottom: i < gebucht.length - 1 ? '1px solid var(--ink-50)' : 'none', opacity: b.erlassen ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.wer} · {b.name}</span>
                  <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: b.erlassen ? 'var(--ink-300)' : 'var(--strafe)', textDecoration: b.erlassen ? 'line-through' : undefined, flex: 'none' }}>{b.folge}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--ink-300)' }}>{b.datum}{b.erlassen ? ' · erlassen' : ''}</span>
                  {b.darfZuruecknehmen && <button type="button" disabled={pending} onClick={() => startTransition(async () => { await zuruecknehmen(b.id); })} style={knopfKlein('var(--ink-500)')}>Zurücknehmen</button>}
                  {b.darfErlassen && <button type="button" disabled={pending} onClick={() => startTransition(async () => { await erlassen(b.id); })} style={knopfKlein('var(--gold-700)')}>Erlassen</button>}
                </div>
              </div>
            ))}
          </ZeilenKarte>
        </>
      )}

      {offen && (
        <>
          <div onClick={() => setOffen(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
          <div
            role="dialog"
            className="wn-sheet-auf wn-scroll-still"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}
          >
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)', flex: 'none' }} />
            {erfolg ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0 18px', textAlign: 'center' }}>
                <span className="wn-pop" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--erfolg-bg)', color: 'var(--erfolg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check-circle" size={34} stroke={2.4} />
                </span>
                <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>Passt!</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{erfolg}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--navy)' }}>{offen.regel ? 'Strafe ändern' : 'Neue Strafe'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{offen.regel ? ART_TEXT[offen.regel.art] : 'Wird am Tisch oder in der Kasse gebucht'}</span>
                  </div>
                  <button type="button" onClick={() => setOffen(null)} aria-label="Schließen" className="wn-press" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                    <Icon name="x" size={17} />
                  </button>
                </div>
                <RegelForm key={offen.regel?.id ?? offen.vorlage?.name ?? 'neu'} regel={offen.regel} vorlage={offen.vorlage} speichern={speichern} fertig={setErfolg} />
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
