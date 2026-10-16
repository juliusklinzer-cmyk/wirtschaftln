import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { getAktuellerTermin, getNaechsterTermin, getKasseFuerTermin, getTerminMitWirtshaus, getVotesFuerTermin, getAktiveMitglieder, getBesucheFuerTermin } from '@/lib/queries';
import { abschlussOffen } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { datumKurz } from '@/lib/format';
import { Icon } from '@/components/ds';
import { STRAFE_GRUND_PREFIX } from '@/lib/abend';
import { AbschlussZettel } from '../abschluss-zettel';
import { abschliessenUndZurueck } from '../actions';

export const metadata = { title: 'Wer war da · Wirtschaftln' };

/**
 * „Wer war da“ + nächster Termin als eigener Screen (Redesign 1c): zurück-Pfeil,
 * drei Schritte, eine Hauptaktion. Erreichbar ab 2 Std. nach Beginn, solang der
 * Abend no offen is (bis 3 Uhr früh), sonst zurück zur Termin-Seite. Wer's
 * scho abgehakt hat, kann's no ändern, der Termin is dann scho ausgemacht.
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
  // Scho abgehakt? Dann den gespeicherten Stand (da / z’spät / weg + Strafe) wieder laden
  const strafen = new Set(getKasseFuerTermin(termin.id).filter((k) => k.kind === 'strafe' && k.grund.startsWith(STRAFE_GRUND_PREFIX) && k.memberId).map((k) => k.memberId));
  const standVon = (id: string) => {
    if (!termin.erfasstVon) return undefined;
    const b = besucheLive.find((x) => x.memberId === id);
    return { status: b?.anwesend ? (b.zuSpaet ? 'spaet' : 'da') : 'weg', strafe: strafen.has(id) } as const;
  };
  const voteVon = (id: string) => alleVotes.find((x) => x.vote.memberId === id)?.vote.wert;

  return (
    <div className="wn-eintritt" style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
        <Link href="/termin" aria-label="Zurück zum Termin" className="wn-press" style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'var(--weiss)', border: '1px solid var(--ink-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', textDecoration: 'none' }}>
          <Icon name="arrow-left" size={18} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--navy)' }}>{termin.erfasstVon ? 'Wer war da' : 'Nächster Termin'}</span>
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
          stand: standVon(m.id),
        }))}
        naechsterTermin={!termin.erfasstVon && !getNaechsterTermin(termin)}
        ersterErfasser={!termin.erfasstVon}
        mindestDatum={termin.datum}
        action={abschliessenUndZurueck.bind(null, termin.id)}
      />
    </div>
  );
}
