'use client';

import { useEffect, useState, useTransition } from 'react';
import { Avatar, Icon } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { goldKnopfStil, bereichHinweisStil } from '@/components/domain/hero-stil';
import type { KasseSpezl } from '@/components/domain/KasseAktionen';
import type { StrafAntwort } from '@/components/domain/StrafeBuchen';

export type OffenPosten = {
  typ: 'buchung' | 'kasse';
  id: string;
  grund: string;
  folge: string;
  cents: number;
  datum: string;
  bleibtVon: string | null;
  darfRichten: boolean;
};
export type OffenPerson = { spezl: KasseSpezl; posten: OffenPosten[]; summeCents: number; heuteErinnert: boolean };

const euro = (cents: number) => `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;
const tagMonat = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' });

/**
 * Offene Strafen für Präsident und Kassenwart (WIR-009, WIR-011): je Spezl
 * eine Zeile, antippen öffnet ein Blatt. Der Präsident richtet je Strafe
 * (erlassen oder bleibt), der Kassenwart erinnert ans Zahlen (Push und Mail).
 * Nach jeder Entscheidung kurz die Erfolgsmeldung, dann geht das Blatt zu.
 */
export function OffenKarte({
  personen,
  meId,
  darfRichten,
  darfErinnern,
  actions,
}: {
  personen: OffenPerson[];
  meId: string;
  darfRichten: boolean;
  darfErinnern: boolean;
  actions: {
    richten: (typ: 'buchung' | 'kasse', id: string, urteil: 'erlassen' | 'bleibt') => Promise<StrafAntwort>;
    erinnern: (memberId: string) => Promise<StrafAntwort>;
  };
}) {
  const [offenId, setOffenId] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ titel: string; text: string } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!erfolg) return;
    const t = setTimeout(() => { setErfolg(null); setOffenId(null); }, 1500);
    return () => clearTimeout(t);
  }, [erfolg]);

  const zu = () => { setOffenId(null); setErfolg(null); setFehler(null); };
  const person = offenId ? personen.find((p) => p.spezl.id === offenId) ?? null : null;
  const zuRichten = (p: OffenPerson) => (darfRichten ? p.posten.filter((x) => x.darfRichten && !x.bleibtVon).length : 0);
  const gesamtRichten = personen.reduce((s, p) => s + zuRichten(p), 0);

  const ausfuehren = (lauf: () => Promise<StrafAntwort>, titel: string) =>
    startTransition(async () => {
      setFehler(null);
      const r = await lauf();
      if (r.ok) setErfolg({ titel, text: r.meldung });
      else setFehler(r.meldung);
    });

  const kleinKnopf = (farbe: string, voll: boolean): React.CSSProperties => ({
    flex: 1, minHeight: 40, borderRadius: 12, border: `1.5px solid ${farbe}`, background: voll ? farbe : 'var(--weiss)', color: voll ? '#fff' : farbe,
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: pending ? 0.6 : 1,
  });

  let inhalt: React.ReactNode = null;
  if (erfolg) {
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0 18px', textAlign: 'center' }}>
        <span className="wn-pop" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--erfolg-bg)', color: 'var(--erfolg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check-circle" size={34} stroke={2.4} />
        </span>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>{erfolg.titel}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{erfolg.text}</span>
      </div>
    );
  } else if (person) {
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <Avatar src={person.spezl.photoUrl} name={person.spezl.name} size={44} verein={person.spezl.verein} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.spezl.id === meId ? 'Du' : person.spezl.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
              {person.posten.length} offen{person.summeCents > 0 ? ` · ${euro(person.summeCents)}` : ''}
            </span>
          </div>
          <button type="button" onClick={zu} aria-label="Schließen" className="wn-press" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <Icon name="x" size={17} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {person.posten.map((p) => (
            <div key={`${p.typ}:${p.id}`} style={{ background: 'var(--weiss)', borderRadius: 16, border: '1px solid var(--ink-100)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{p.grund}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{tagMonat(p.datum)}</span>
                </span>
                <span className="wn-tnum" style={{ flex: 'none', fontSize: 14, fontWeight: 800, color: 'var(--strafe)', whiteSpace: 'nowrap' }}>{p.folge}</span>
              </div>
              {p.bleibtVon ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-700)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="crown" size={13} stroke={2.4} />
                  bleibt, gerichtet von {p.bleibtVon}
                </span>
              ) : darfRichten && p.darfRichten ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={pending} className="wn-press" onClick={() => ausfuehren(() => actions.richten(p.typ, p.id, 'erlassen'), 'Erlassen!')} style={kleinKnopf('var(--gold-700)', true)}>
                    Erlassen
                  </button>
                  <button type="button" disabled={pending} className="wn-press" onClick={() => ausfuehren(() => actions.richten(p.typ, p.id, 'bleibt'), 'Bleibt!')} style={kleinKnopf('var(--navy)', false)}>
                    Bleibt
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {fehler && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)', padding: '0 4px' }}>{fehler}</span>}

        {darfErinnern && person.summeCents > 0 && person.spezl.id !== meId && (
          <button
            type="button"
            disabled={pending || person.heuteErinnert}
            className="wn-press"
            onClick={() => ausfuehren(() => actions.erinnern(person.spezl.id), 'Erinnert!')}
            style={{ ...goldKnopfStil, minHeight: 52, opacity: pending || person.heuteErinnert ? 0.6 : 1 }}
          >
            <Icon name="bell" size={20} />
            {person.heuteErinnert ? 'Heute schon erinnert' : pending ? 'Wird erinnert …' : `Ans Zahlen erinnern (${euro(person.summeCents)})`}
          </button>
        )}
      </div>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={<span style={bereichHinweisStil}>{gesamtRichten > 0 ? `${gesamtRichten} zu richten` : darfErinnern ? 'Kassenwart' : 'Präsident'}</span>}>Offen</HoamTitel>
      <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '4px 16px' }}>
        {personen.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0' }}>
            <Icon name="check-circle" size={20} color="var(--erfolg)" stroke={2.2} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-500)' }}>Nix offen, alles beglichen.</span>
          </div>
        )}
        {personen.map((p, i) => {
          const n = zuRichten(p);
          const wpOnly = p.summeCents === 0;
          return (
            <button
              key={p.spezl.id}
              type="button"
              onClick={() => { setErfolg(null); setFehler(null); setOffenId(p.spezl.id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', border: 'none', borderTop: i > 0 ? '1px solid var(--ink-50)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
            >
              <Avatar src={p.spezl.photoUrl} name={p.spezl.name} size={36} verein={p.spezl.verein} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.spezl.id === meId ? 'Du' : p.spezl.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.posten.length === 1 ? p.posten[0].grund : `${p.posten.length} Strafen`}
                  {p.heuteErinnert ? ' · heute erinnert' : ''}
                </span>
              </span>
              {n > 0 && (
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: 'var(--pergament)', color: 'var(--gold-700)', whiteSpace: 'nowrap' }}>richten</span>
              )}
              <span className="wn-tnum" style={{ flex: 'none', fontSize: 14, fontWeight: 800, color: 'var(--strafe)', whiteSpace: 'nowrap' }}>{wpOnly ? p.posten[0].folge : euro(p.summeCents)}</span>
              <Icon name="chevron" size={15} color="var(--ink-300)" />
            </button>
          );
        })}
      </div>

      {/* Nach dem letzten Erlassen ist der Spezl aus der Liste, die Erfolgsmeldung steht trotzdem */}
      {offenId && (erfolg || person) && (
        <>
          <div onClick={zu} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
          <div
            role="dialog"
            aria-label="Offene Strafen"
            className="wn-sheet-auf wn-scroll-still"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + var(--wn-unten))', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}
          >
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)', flex: 'none' }} />
            {inhalt}
          </div>
        </>
      )}
    </section>
  );
}
