'use client';

import { useActionState } from 'react';
import { Button, Input } from '@/components/ds';
import { LogoWahl } from '@/components/domain/LogoWahl';
import { stammtischSpeichern, type StammtischState } from './actions';

export type StammtischWerte = {
  name: string;
  motto: string;
  stadt: string;
  gruendungsjahr: string;
  gruendungscode: string;
  hoibePreis: string;
  /** Aktuelles Logo als Data-URL (null = Wirtschaftln-Wappen) */
  logo: string | null;
};

export function StammtischForm({ werte }: { werte: StammtischWerte }) {
  const [state, action, pending] = useActionState<StammtischState, FormData>(stammtischSpeichern, {});
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Name vom Stammtisch" name="name" defaultValue={werte.name} placeholder="Wirtschaftln" required maxLength={60} />
      <Input label="Motto" name="motto" defaultValue={werte.motto} placeholder="Oiwei anders. Oiwei dahoam." maxLength={120} />
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Logo (oben in der App und als App-Icon)</label>
        <LogoWahl name="logoData" stammtischName={werte.name} aktuell={werte.logo} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
        <Input label="Stadt" name="stadt" defaultValue={werte.stadt} placeholder="München" maxLength={60} />
        <Input label="Gründungsjahr" name="gruendungsjahr" defaultValue={werte.gruendungsjahr} placeholder="2019" inputMode="numeric" maxLength={4} />
      </div>
      <Input
        label="Gründungscode"
        name="gruendungscode"
        defaultValue={werte.gruendungscode}
        placeholder="leer = Aufnahme zu"
        hint="Mit dem Code kommen neue Spezln über /beitreten eini. Leer lassen, dann is d’Aufnahme zua."
        maxLength={40}
        autoComplete="off"
      />
      <Input
        label="Preis für a Hoibe (€)"
        name="hoibePreis"
        defaultValue={werte.hoibePreis}
        placeholder="3,70"
        inputMode="decimal"
        hint="D’Maßeinheit für alle Strafen: a Runde = Teilnehmer × Hoibe-Preis."
        required
      />

      {state.error && (
        <div style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {state.error}
        </div>
      )}
      {state.ok && !state.error && (
        <div style={{ padding: '10px 12px', background: 'var(--info-bg, var(--pergament))', border: '1px solid var(--muc-blau)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--muc-blau)' }}>
          ✓ Gspeichert.
        </div>
      )}

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? 'Moment…' : 'Speichern'}
      </Button>
    </form>
  );
}
