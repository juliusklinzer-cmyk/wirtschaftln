'use client';

import { useRef, useState } from 'react';
import { Button, Input, KlappenKopf } from '@/components/ds';
import { umfrageStarten } from '@/app/(app)/umfragen/actions';

const MAX_ANTWORTEN = 6;
const BUCHSTABEN = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Umfrage starten, darf jeder: Frage, Antwort A/B und bei Bedarf mehr. */
export function UmfrageNeu() {
  const formRef = useRef<HTMLFormElement>(null);
  const [anzahl, setAnzahl] = useState(2);

  return (
    <details style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden' }}>
      <KlappenKopf>Umfrage starten</KlappenKopf>
      <div style={{ padding: '4px 18px 18px' }}>
        <form
          ref={formRef}
          action={async (formData) => {
            await umfrageStarten(formData);
            formRef.current?.reset();
            setAnzahl(2);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Input label="Frage" name="frage" placeholder="Wo samma am liabsten?" required />
          {Array.from({ length: anzahl }, (_, i) => (
            <Input key={i} label={`Antwort ${BUCHSTABEN[i]}`} name="antwort" placeholder={`Antwort ${BUCHSTABEN[i]}`} required={i < 2} />
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
          <Button type="submit" fullWidth variant="secondary">
            Umfrage starten
          </Button>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
            Steht dann für alle auf der Startseite, jeder Spezl hat a Stimme.
          </div>
        </form>
      </div>
    </details>
  );
}
