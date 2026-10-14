'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { CircleNotch } from '@phosphor-icons/react/dist/ssr/CircleNotch';

/** Hinweis unterm Feld: Fehler rot mit Icon, ok grün mit Haken, sonst grau. */
export type FeldMeldung = { art: 'fehler' | 'ok' | 'hinweis'; text: string } | null;

type FeldProps = {
  label: string;
  name: string;
  zustand?: 'ok' | 'fehler' | null;
  meldung?: FeldMeldung;
  /** Element rechts im Feld (Haken, Auge …) */
  rechts?: React.ReactNode;
  mono?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'style'>;

/**
 * Eingabefeld im Login-Redesign: 50 hoch, Radius 14, Haarlinie; Fokus in
 * Münchner Blau, geprüft in Grün (Gründungscode), Fehler in Rot.
 */
export function AuthFeld({ label, name, zustand = null, meldung = null, rechts, mono = false, ...rest }: FeldProps) {
  const [fokus, setFokus] = useState(false);
  const id = rest.id ?? `feld-${name}`;
  const rand = zustand === 'fehler' ? 'var(--strafe)' : zustand === 'ok' ? 'var(--erfolg)' : fokus ? 'var(--muc-blau)' : 'var(--ink-200)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{label}</label>
      <div style={{ height: 50, padding: '0 14px', borderRadius: 14, border: `1.5px solid ${rand}`, boxShadow: fokus && !zustand ? '0 0 0 0.5px var(--muc-blau)' : 'none', background: zustand === 'ok' ? '#F3FAF6' : 'var(--weiss)', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 150ms ease, box-shadow 150ms ease' }}>
        <input
          {...rest}
          id={id}
          name={name}
          onFocus={(e) => { setFokus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFokus(false); rest.onBlur?.(e); }}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'var(--font-ui)', letterSpacing: mono ? '0.08em' : undefined, fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}
        />
        {rechts}
      </div>
      <FeldHinweis meldung={meldung} />
    </div>
  );
}

export function FeldHinweis({ meldung }: { meldung: FeldMeldung }) {
  if (!meldung) return null;
  const farbe = meldung.art === 'fehler' ? 'var(--strafe)' : meldung.art === 'ok' ? 'var(--erfolg)' : 'var(--ink-500)';
  return (
    <span role={meldung.art === 'fehler' ? 'alert' : undefined} style={{ fontSize: 12, fontWeight: meldung.art === 'hinweis' ? 600 : 700, color: farbe, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.4 }}>
      {meldung.art === 'fehler' && <WarningCircle size={15} weight="fill" style={{ flex: 'none' }} />}
      {meldung.art === 'ok' && <CheckCircle size={15} weight="fill" style={{ flex: 'none' }} />}
      {meldung.text}
    </span>
  );
}

/** Passwort mit Auge zum Anzeigen. */
export function PasswortFeld(props: Omit<FeldProps, 'rechts' | 'type'>) {
  const [sichtbar, setSichtbar] = useState(false);
  return (
    <AuthFeld
      {...props}
      type={sichtbar ? 'text' : 'password'}
      rechts={
        <button type="button" onClick={() => setSichtbar((s) => !s)} aria-label={sichtbar ? 'Passwort verbergen' : 'Passwort anzeigen'} style={{ border: 'none', background: 'none', padding: 0, margin: '0 -4px 0 0', width: 28, height: 28, display: 'grid', placeItems: 'center', color: 'var(--ink-300)', cursor: 'pointer' }}>
          {sichtbar ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
      }
    />
  );
}

export const GRUEN_HAKEN = <CheckCircle size={20} weight="fill" color="var(--erfolg)" style={{ flex: 'none' }} />;

/** Großer Knopf: Navy fürs Anmelden, Gold fürs Beitreten. Zeigt „Moment …“ mit Kringel. */
export function AuthKnopf({ variante, pending = false, disabled = false, children, ...rest }: { variante: 'navy' | 'gold'; pending?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const aus = pending || disabled;
  return (
    <button
      {...rest}
      type={rest.type ?? 'submit'}
      disabled={aus}
      className="wn-press"
      style={{
        height: 54, borderRadius: 14, border: 'none', cursor: aus ? 'default' : 'pointer', opacity: aus ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800,
        ...(variante === 'navy'
          ? { background: 'var(--navy)', color: '#fff' }
          : { background: 'var(--grad-gold)', color: 'var(--navy-900)', boxShadow: 'var(--sh-gold)' }),
        transition: 'opacity 150ms ease',
      }}
    >
      {pending ? (
        <>
          <CircleNotch size={20} style={{ animation: 'wnKringel 900ms linear infinite' }} />
          <style>{`@keyframes wnKringel { to { transform: rotate(360deg); } }`}</style>
          Moment …
        </>
      ) : children}
    </button>
  );
}

/** Rote Box für Fehler, die zu koam Feld gehören (z. B. „E-Mail schon vergeben“). */
export function AuthFehlerBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: '#FBE7E4', border: '1px solid rgba(192,57,43,0.35)' }}>
      <WarningCircle size={20} weight="fill" color="var(--strafe)" style={{ flex: 'none' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)', lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

/** Grüne Box für „passt“ (Link verschickt, Passwort gesetzt). */
export function AuthErfolgBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--erfolg-bg)', border: '1px solid rgba(46,139,87,0.35)' }}>
      <CheckCircle size={20} weight="fill" color="var(--erfolg)" style={{ flex: 'none' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--erfolg)', lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

/** Blauer Textlink mittig („Schon dabei? Anmelden“). */
export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ alignSelf: 'center', fontSize: 14, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none', padding: '4px 8px' }}>
      {children}
    </Link>
  );
}

/** Trenner „oder“ zwischen Anmelden und Beitreten. */
export function AuthOder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>oder</span>
      <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
    </div>
  );
}
