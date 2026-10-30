import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { Rangliste } from './rangliste-b';
import { ladeRanglisteDaten } from './daten';
import { mitgliedAnlegen, amtZuweisen, wacklerEntscheidenAction } from './actions';
import { WacklerKarte } from './wackler-karte';
import { darfWacklerEntscheiden, offeneWackler } from '@/lib/wackler';
import { AmtZuweisen } from './amt-zuweisen';
import { SpezlAufnehmen } from './spezl-aufnehmen';
import { auszeichnungAn } from '@/lib/tenant-config';

export default async function SpezlnPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const { eintraege, aemterListe, galerie, badgeInfos, mitglieder, saison, praesidentId, letzterTerminId } = ladeRanglisteDaten(me.id);
  // Kassenwart trägt der Admin ODER der aktuelle Präsident ein
  const wackler = darfWacklerEntscheiden(me) ? offeneWackler() : [];
  const darfAmtZuweisen = (me.role === 'admin' || me.id === praesidentId) && auszeichnungAn('amt:kassenwart');

  return (
    <div className="wn-eintritt" style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Rangliste eintraege={eintraege} aemter={aemterListe} galerie={galerie} badgeInfos={badgeInfos} saisonLabel={saison.label} letzterTerminId={letzterTerminId} />

      {darfAmtZuweisen && (
        <AmtZuweisen
          mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m) }))}
          action={amtZuweisen}
        />
      )}

      {darfWacklerEntscheiden(me) && wackler.length > 0 && <WacklerKarte wackler={wackler} entscheiden={wacklerEntscheidenAction} />}

      {me.role === 'admin' && <SpezlAufnehmen action={mitgliedAnlegen} />}
    </div>
  );
}
