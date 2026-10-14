import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { Rangliste } from './rangliste-b';
import { ladeRanglisteDaten } from './daten';
import { mitgliedAnlegen, amtZuweisen } from './actions';
import { AmtZuweisen } from './amt-zuweisen';
import { SpezlAufnehmen } from './spezl-aufnehmen';

export default async function SpezlnPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const { eintraege, aemterListe, galerie, badgeInfos, mitglieder, saison, praesidentId, letzterTerminId } = ladeRanglisteDaten(me.id);
  // Kassenwart trägt der Admin ODER der aktuelle Präsident ein
  const darfAmtZuweisen = me.role === 'admin' || me.id === praesidentId;

  return (
    <div className="wn-eintritt" style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Rangliste eintraege={eintraege} aemter={aemterListe} galerie={galerie} badgeInfos={badgeInfos} saisonLabel={saison.label} letzterTerminId={letzterTerminId} />

      {darfAmtZuweisen && (
        <AmtZuweisen
          mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m) }))}
          action={amtZuweisen}
        />
      )}

      {me.role === 'admin' && <SpezlAufnehmen action={mitgliedAnlegen} />}
    </div>
  );
}
