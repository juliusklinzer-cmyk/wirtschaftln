'use client';

import { useActionState, useState } from 'react';
import { Button, Input } from '@/components/ds';
import { LogoWahl } from '@/components/domain/LogoWahl';
import { BierWahl } from '@/components/domain/BierWahl';
import { HELLE_WAHL } from '@/lib/biersorten';
import { Switch } from '@/components/ds';
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
  bierName: string;
  schnaps: boolean;
};

export function StammtischForm({ werte }: { werte: StammtischWerte }) {
  const [state, action, pending] = useActionState<StammtischState, FormData>(stammtischSpeichern, {});
  const [bier, setBier] = useState(werte.bierName);
  const [schnaps, setSchnaps] = useState(werte.schnaps);
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
      <BierWahl label="Euer Bier" biere={HELLE_WAHL} value={bier} onChange={setBier} leerLabel="Koa bestimmtes" />
      <input type="hidden" name="bierName" value={bier} />
      <Input
        label="Preis für a Hoibe (€)"
        name="hoibePreis"
        defaultValue={werte.hoibePreis}
        placeholder="3,70"
        inputMode="decimal"
        hint="D’Maßeinheit für alle Strafen: a Runde = Teilnehmer × Hoibe-Preis."
        required
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
        <span style={{ fontSize: 26, flex: 'none', filter: schnaps ? 'none' : 'grayscale(1) opacity(0.5)' }}>🥃</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Schnapselt ihr?</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.4 }}>Schnaps am Bierdeckel, in der Statistik und der Schnapsler-Badge.</div>
        </div>
        <input type="hidden" name="schnaps" value={schnaps ? 'on' : 'off'} />
        <Switch checked={schnaps} onChange={setSchnaps} tone="gold" />
      </div>

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
