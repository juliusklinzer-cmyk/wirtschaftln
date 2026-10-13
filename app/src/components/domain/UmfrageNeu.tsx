'use client';

import { useRef, useState } from 'react';
import { umfrageStarten } from '@/app/(app)/umfragen/actions';
import { HoamTitel } from '@/components/domain/HoamTitel';

const MAX_ANTWORTEN = 6;
const BUCHSTABEN = ['A', 'B', 'C', 'D', 'E', 'F'];

const feldStil: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', height: 46, padding: '0 12px', borderRadius: 12,
  border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)',
  fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', outline: 'none',
};

/** Umfrage starten, darf jeder (Zustand 3f): Frage, Antwort A/B und bei Bedarf mehr. */
export function UmfrageNeu({ onFertig }: { onFertig?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [anzahl, setAnzahl] = useState(2);

  return (
    <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', padding: 18, border: '1.5px solid var(--muc-blau)', boxShadow: 'var(--sh-sm)' }}>
      <form
        ref={formRef}
        action={async (formData) => {
          await umfrageStarten(formData);
          formRef.current?.reset();
          setAnzahl(2);
          onFertig?.();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }} htmlFor="umfrage-frage">
          Frage
        </label>
        <input id="umfrage-frage" name="frage" placeholder="Wo sind wir am liebsten?" required maxLength={200} style={feldStil} />
        {Array.from({ length: anzahl }, (_, i) => (
          <input key={i} name="antwort" placeholder={`Antwort ${BUCHSTABEN[i]}`} required={i < 2} maxLength={80} aria-label={`Antwort ${BUCHSTABEN[i]}`} style={feldStil} />
        ))}
        {anzahl < MAX_ANTWORTEN && (
          <button
            type="button"
            onClick={() => setAnzahl((n) => Math.min(n + 1, MAX_ANTWORTEN))}
            style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}
          >
            + Antwort hinzufügen
          </button>
        )}
        <button
          type="submit"
          className="wn-press"
          style={{ minHeight: 46, border: 'none', borderRadius: 12, background: 'var(--navy)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
        >
          Umfrage starten
        </button>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
          Steht dann für alle auf der Startseite, jeder Spezl hat eine Stimme.
        </div>
      </form>
    </div>
  );
}

/**
 * Bereich „Umfragen“ am Seitenende: Überschrift mit „+ Neue“, darunter das
 * Formular (wenn aufgeklappt) und die schon beantworteten Umfragen.
 */
export function UmfragenBereich({ children, anzahl }: { children: React.ReactNode; anzahl: number }) {
  const [neu, setNeu] = useState(false);
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel
        action={
          <button
            type="button"
            onClick={() => setNeu((n) => !n)}
            style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}
          >
            {neu ? 'Abbrechen' : '+ Neue'}
          </button>
        }
      >
        Umfragen
      </HoamTitel>
      {neu && <UmfrageNeu onFertig={() => setNeu(false)} />}
      {children}
      {!neu && anzahl === 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--weiss)', border: '1px dashed var(--ink-200)', fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
          Grad koa Umfrage. Mit „+ Neue“ startest du oane, jeder Spezl hat eine Stimme.
        </div>
      )}
    </section>
  );
}
