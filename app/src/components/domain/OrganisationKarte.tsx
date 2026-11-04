'use client';

import { useState, useTransition } from 'react';
import { Chip, Icon, Kachel, Zeile, ZeilenKarte } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { AbschlussForm, type AbschlussWerte, type AbschlussMitglied } from '@/app/(app)/termin/abschluss-form';
import { goldKnopfStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';
import type { BekanntesWirtshaus } from '@/lib/wirtshaus-abgleich';

/**
 * Bereich „Organisation“ auf der Termin-Seite (Redesign 1a): nur für
 * Berechtigte (Organisator, Präsident, Admin). Drei Zeilen, jede öffnet
 * ihren Baustein direkt drunter: Anmeldung schließen (am Stammtisch-Tag),
 * Termin verschieben, Reservierung ändern (2i), letzten Abend für alle nachtragen.
 */
export function OrganisationKarte({
  hint,
  anmeldungSchliessen = null,
  reservierung = null,
  verschieben = null,
  nachtrag = null,
}: {
  hint: string;
  anmeldungSchliessen?: (() => Promise<void>) | null;
  reservierung?: { action: (formData: FormData) => Promise<void>; bekannte: BekanntesWirtshaus[]; aktuell: { name: string; bezirk: string | null } } | null;
  /** Neues Datum setzen, alle Stimmen werden zurückgesetzt */
  verschieben?: { action: (formData: FormData) => Promise<{ ok: true } | { ok: false; meldung: string }>; datum: string; zeit: string; heute: string } | null;
  nachtrag?: { restTage: number; schnapsAn: boolean; mitglieder: AbschlussMitglied[]; initial: AbschlussWerte; action: (formData: FormData) => Promise<void> } | null;
}) {
  const [offen, setOffen] = useState<null | 'reservierung' | 'verschieben' | 'nachtrag'>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const zeilen = [anmeldungSchliessen, reservierung, verschieben, nachtrag].filter(Boolean).length;
  if (zeilen === 0) return null;

  const umschalten = (was: 'reservierung' | 'verschieben' | 'nachtrag') => {
    setMeldung(null);
    setFehler(null);
    setOffen((o) => (o === was ? null : was));
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{hint}</span>}>Organisation</HoamTitel>
      <ZeilenKarte>
        {anmeldungSchliessen && (
          <Zeile
            kachel={<Kachel><Icon name="lock" size={19} /></Kachel>}
            titel={pending ? 'Wird gschlossen…' : 'Anmeldung schließen'}
            untertitel="am Stammtisch-Tag, danach zählt der Deckel"
            onClick={() => startTransition(async () => { await anmeldungSchliessen(); })}
            letzte={!reservierung && !verschieben && !nachtrag}
          />
        )}
        {reservierung && (
          <Zeile
            kachel={<Kachel><Icon name="swap" size={19} /></Kachel>}
            titel="Reservierung ändern"
            untertitel="alle werden informiert"
            onClick={() => umschalten('reservierung')}
            chip={offen === 'reservierung' ? <Chip ton="blau">offen</Chip> : null}
            letzte={!verschieben && !nachtrag}
          />
        )}
        {verschieben && (
          <Zeile
            kachel={<Kachel><Icon name="calendar" size={19} /></Kachel>}
            titel="Termin verschieben"
            untertitel="alle stimmen neu ab"
            onClick={() => umschalten('verschieben')}
            chip={offen === 'verschieben' ? <Chip ton="blau">offen</Chip> : null}
            letzte={!nachtrag}
          />
        )}
        {nachtrag && (
          <Zeile
            kachel={<Kachel ton="gold"><Icon name="pencil" size={19} /></Kachel>}
            titel="Letzten Abend nachtragen"
            untertitel={`für alle, noch ${nachtrag.restTage} ${nachtrag.restTage === 1 ? 'Tag' : 'Tage'}`}
            onClick={() => umschalten('nachtrag')}
            chip={offen === 'nachtrag' ? <Chip ton="gold">offen</Chip> : null}
            letzte
          />
        )}
      </ZeilenKarte>

      {meldung && (
        <div className="wn-toast-in" style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)', fontSize: 13, fontWeight: 800, color: 'var(--erfolg)' }}>
          {meldung}
        </div>
      )}

      {offen === 'reservierung' && reservierung && (
        <>
          <HoamTitel>Reservierung ändern</HoamTitel>
          <form
            action={async (fd) => {
              await reservierung.action(fd);
              setOffen(null);
              setMeldung('✓ Wirtshaus gändert, alle Spezln kriegen Bescheid!');
            }}
            style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <Zeile
              kachel={<Kachel><Icon name="pin" size={19} /></Kachel>}
              titel={reservierung.aktuell.name}
              untertitel={reservierung.aktuell.bezirk ?? 'aktuell'}
              chip={<Chip ton="blau">reserviert</Chip>}
              pfeil={false}
              letzte
            />
            <WirtshausSuche bekannte={reservierung.bekannte} label="Neues Wirtshaus" />
            <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>Ändern & alle informieren</button>
          </form>
        </>
      )}

      {offen === 'verschieben' && verschieben && (
        <>
          <HoamTitel>Termin verschieben</HoamTitel>
          <form
            action={(fd) =>
              startTransition(async () => {
                const r = await verschieben.action(fd);
                if (!r.ok) return setFehler(r.meldung);
                setOffen(null);
                setMeldung('✓ Verschoben, alle bekommen Bescheid und stimmen neu ab.');
              })
            }
            style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={feldLabelStil}>Neues Datum</span>
                <input type="date" name="datum" required min={verschieben.heute} defaultValue={verschieben.datum} style={feldStil} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={feldLabelStil}>Uhrzeit</span>
                <input type="time" name="zeit" defaultValue={verschieben.zeit} style={feldStil} />
              </label>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Alle Zu- und Absagen werden zurückgesetzt, jeder bekommt Push und Mail und sagt neu zu oder ab. Die Reservierung im Wirtshaus bitte selbst umbuchen.</span>
            {fehler && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
            <button type="submit" disabled={pending} className="wn-press" style={{ ...goldKnopfStil, minHeight: 52, opacity: pending ? 0.7 : 1 }}>{pending ? 'Wird verschoben …' : 'Verschieben & alle informieren'}</button>
          </form>
        </>
      )}

      {offen === 'nachtrag' && nachtrag && (
        <>
          <HoamTitel action={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>wer da war, Hoibe, Runden</span>}>Nachtragen</HoamTitel>
          <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16 }}>
            <AbschlussForm
              schnapsAn={nachtrag.schnapsAn}
              mitglieder={nachtrag.mitglieder}
              initial={nachtrag.initial}
              submitLabel="Änderungen speichern"
              action={async (fd) => {
                await nachtrag.action(fd);
                setOffen(null);
                setMeldung('✓ Gspeichert, vergelt’s Gott!');
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}
