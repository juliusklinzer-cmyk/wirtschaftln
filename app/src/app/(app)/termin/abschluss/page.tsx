import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { getAktuellerTermin, getTerminMitWirtshaus, getVotesFuerTermin, getAktiveMitglieder, getBesucheFuerTermin, getWirtshausById } from '@/lib/queries';
import { abschlussOffen } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { datumKurz } from '@/lib/format';
import { Icon } from '@/components/ds';
import { bewertungsDaten } from '@/lib/bewertungs-daten';
import { tenantConfig } from '@/lib/tenant-config';
import { AbschlussZettel } from '../abschluss-zettel';
import { abschliessenUndZurueck } from '../actions';

export const metadata = { title: 'Abend abschließen · Wirtschaftln' };

/**
 * Abend abschließen als eigener Screen (Redesign 1c): zurück-Pfeil, drei
 * Schritte, eine Hauptaktion. Nur erreichbar, solang der Abend rum und der
 * Termin no offen is, sonst zurück zur Termin-Seite.
 */
export default async function AbschlussPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const termin = getAktuellerTermin();
  if (!termin || !abschlussOffen(termin, nowIso())) redirect('/termin');
  const { wirtshaus } = getTerminMitWirtshaus(termin);
  const mitglieder = getAktiveMitglieder();
  const alleVotes = getVotesFuerTermin(termin.id);
  const besucheLive = getBesucheFuerTermin(termin.id);
  const voteVon = (id: string) => alleVotes.find((x) => x.vote.memberId === id)?.vote.wert;
  const config = tenantConfig();
  const stammhaus = config.typ === 'stammhaus' && config.stammhausWirtshausId ? getWirtshausById(config.stammhausWirtshausId) : null;

  return (
    <div className="wn-eintritt" style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
        <Link href="/termin" aria-label="Zurück zum Termin" className="wn-press" style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'var(--weiss)', border: '1px solid var(--ink-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', textDecoration: 'none' }}>
          <Icon name="arrow-left" size={18} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--navy)' }}>Abend abschließen</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginTop: 3 }}>{wirtshaus?.name ?? 'Stammtisch'} · {datumKurz(termin.datum)}</span>
        </div>
      </div>

      <AbschlussZettel
        meId={me.id}
        mitglieder={mitglieder.map((m) => ({
          id: m.id,
          name: anzeigeName(m),
          photoUrl: m.photoUrl,
          verein: m.verein,
          zugesagt: voteVon(m.id) === 'zu',
          live: !!besucheLive.find((b) => b.memberId === m.id)?.anwesend,
        }))}
        meineWerte={bewertungsDaten(besucheLive, me.id).initial}
        naechsterTermin={!termin.abgeschlossenVon}
        action={abschliessenUndZurueck.bind(null, termin.id)}
        ohneSterne={!!stammhaus && wirtshaus?.id === stammhaus.id}
      />
    </div>
  );
}
