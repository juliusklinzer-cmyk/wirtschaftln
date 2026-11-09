'use client';

import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Switch } from '@/components/ds';

export type MailWerte = { termin: boolean; erinnerung: boolean; kasse: boolean };

/** Kurzfassung für die Zeile in den Einstellungen. */
export function mailUnter(w: MailWerte): string {
  const an = [w.termin && 'Termin', w.erinnerung && 'Erinnerungen', w.kasse && 'Kasse'].filter(Boolean) as string[];
  if (an.length === 3) return 'alle an';
  if (an.length === 0) return 'keine Mails';
  return `nur ${an.join(', ')}`;
}

const ARTEN: Array<{ key: keyof MailWerte; titel: string; unter: string }> = [
  { key: 'termin', titel: 'Termin steht fest', unter: 'Wirtshaus, Kalendereintrag und Route' },
  { key: 'erinnerung', titel: 'Erinnerungen', unter: 'Abstimmen, Orga, Reservierung' },
  { key: 'kasse', titel: 'Kasse und Strafen', unter: 'Strafen und Erinnerungen ans Zahlen' },
];

/**
 * Mail-Einstellungen (30.10.2026): drei Arten plus „Keine Mails“. Jeder
 * Schalter speichert sofort, drunter kurz „Gespeichert“. Passwort- und
 * Willkommensmails kommen immer.
 */
export function MailKarte({ werte, speichern, geaendert }: { werte: MailWerte; speichern: (w: MailWerte) => Promise<{ ok: boolean }>; geaendert: (w: MailWerte) => void }) {
  const [stand, setStand] = useState(werte);
  const [meldung, setMeldung] = useState<'ok' | 'fehler' | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const keine = !stand.termin && !stand.erinnerung && !stand.kasse;

  const setzen = async (neu: MailWerte) => {
    const alt = stand;
    setStand(neu);
    setLaeuft(true);
    setMeldung(null);
    try {
      const r = await speichern(neu);
      if (!r.ok) throw new Error();
      geaendert(neu);
      setMeldung('ok');
    } catch {
      setStand(alt);
      setMeldung('fehler');
    } finally {
      setLaeuft(false);
    }
  };

  const zeile = (titel: string, unter: string, an: boolean, umlegen: (an: boolean) => void, letzte = false) => (
    <div key={titel} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{unter}</span>
      </div>
      <Switch checked={an} disabled={laeuft} onChange={umlegen} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '2px 16px' }}>
        {ARTEN.map((a) => zeile(a.titel, a.unter, stand[a.key], (an) => void setzen({ ...stand, [a.key]: an })))}
        {zeile('Keine Mails', 'alles aus, nur Push', keine, (an) => void setzen(an ? { termin: false, erinnerung: false, kasse: false } : { termin: true, erinnerung: true, kasse: true }), true)}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.5, padding: '0 4px' }}>Mails zum Passwort und zur Aufnahme kommen immer.</span>
      {meldung === 'ok' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <CheckCircle size={22} weight="fill" color="var(--erfolg)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>Gespeichert, vergelt’s Gott!</span>
        </div>
      )}
      {meldung === 'fehler' && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)', padding: '0 4px' }}>Hat nicht geklappt, probier’s nochmal.</span>}
    </div>
  );
}
