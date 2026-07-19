import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { Button, Input } from '@/components/ds';
import { Rangliste } from './rangliste-b';
import { ladeRanglisteDaten } from './daten';
import { mitgliedAnlegen, amtZuweisen } from './actions';
import { AmtZuweisen } from './amt-zuweisen';

export default async function SpezlnPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const { eintraege, aemterListe, galerie, badgeInfos, mitglieder, saison, praesidentId } = ladeRanglisteDaten(me.id);
  // Kassenwart trägt der Admin ODER der aktuelle Präsident ein
  const darfAmtZuweisen = me.role === 'admin' || me.id === praesidentId;

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Rangliste eintraege={eintraege} aemter={aemterListe} galerie={galerie} badgeInfos={badgeInfos} saisonLabel={saison.label} />

      {darfAmtZuweisen && (
        <AmtZuweisen
          mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m) }))}
          action={amtZuweisen}
        />
      )}

      {me.role === 'admin' && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>➕ Neuen Spezl aufnehmen</summary>
          <div style={{ padding: '4px 18px 18px' }}>
            <form action={mitgliedAnlegen} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Nachname" name="nachname" placeholder="Brunner" required />
              <Input label="Vorname" name="vorname" placeholder="Sepp" required />
              <Input label="Spitzname (optional)" name="spitzname" placeholder="da Sepp" hint="Ohne Spitznamen steht der volle Name in der App" />
              <Input label="E-Mail" name="email" type="email" required />
              <Input label="Start-Passwort" name="password" type="text" hint="Mindestens 6 Zeichen — der Spezl ändert’s beim ersten Login." required />
              <Button type="submit" fullWidth variant="gold">
                Aufnehmen — Servus, Spezl!
              </Button>
            </form>
          </div>
        </details>
      )}
    </div>
  );
}

const detailsStyle: React.CSSProperties = {
  background: 'var(--weiss)', border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
};
const summaryStyle: React.CSSProperties = {
  padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)',
  cursor: 'pointer', listStyle: 'none', userSelect: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
  borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
  color: 'var(--ink-900)', background: 'var(--weiss)',
};
