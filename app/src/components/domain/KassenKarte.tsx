import Link from 'next/link';
import { anzeigeName } from '@/lib/namen';
import { getSaldo, getKasseEintraege, getOffeneStrafen, getKassenwartId, getAktiveMitglieder } from '@/lib/queries';
import { euro } from '@/lib/format';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { Avatar, Icon } from '@/components/ds';

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/**
 * Vereinskasse als Karte rechts auf Dahoam (Responsive Redesign 1a): Stand,
 * wer die Kasse wahrt, die eigenen offenen Strafen, die letzten drei
 * Buchungen und die Wege zur Kasse. Nur am Tablet und Desktop.
 */
export function KassenKarte({ meId }: { meId: string }) {
  const saldo = getSaldo();
  const mitglieder = getAktiveMitglieder();
  const kassenwart = mitglieder.find((m) => m.id === getKassenwartId()) ?? null;
  const meineOffenen = getOffeneStrafen().filter((o) => o.eintrag.memberId === meId);
  const meineSumme = meineOffenen.reduce((sum, o) => sum + Math.abs(o.eintrag.betragCents), 0);
  const letzte = getKasseEintraege().filter((e) => e.eintrag.status !== 'aufgehoben').slice(0, 3);
  const knopf: React.CSSProperties = { flex: 1, minHeight: 44, borderRadius: 12, fontSize: 14, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' };

  return (
    <section style={{ background: 'var(--weiss)', borderRadius: 22, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>Vereinskasse</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="wn-tnum" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--navy)' }}>{euro(saldo)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
          {kassenwart ? (kassenwart.id === meId ? 'Du wahrst die Kasse' : `${vorname(anzeigeName(kassenwart))} wahrt die Kasse`) : 'Noch kein Kassenwart gewählt'}
        </span>
      </div>

      {meineOffenen.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--strafe-bg)' }}>
          <Icon name="warning" size={18} color="var(--strafe)" />
          <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: 'var(--strafe)' }}>
            {meineOffenen.length} offene {meineOffenen.length === 1 ? 'Strafe' : 'Strafen'} · {euro(meineSumme)}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--erfolg-bg)' }}>
          <Icon name="check-circle" size={18} color="var(--erfolg)" stroke={2.2} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--erfolg)' }}>Keine offene Strafe bei dir</span>
        </div>
      )}

      {letzte.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {letzte.map(({ eintrag, member }, i) => {
            const forderung = eintrag.kind === 'strafe';
            const cents = forderung ? Math.abs(eintrag.betragCents) : eintrag.betragCents;
            return (
              <div key={eintrag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < letzte.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
                {member ? (
                  <Avatar src={member.photoUrl} name={member.name} size={32} verein={member.verein} />
                ) : (
                  <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: 'var(--ink-50)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="bank" size={16} />
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member ? (member.id === meId ? 'Du' : vorname(anzeigeName(member))) : 'Vereinskasse'}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eintrag.grund}</span>
                </span>
                <span className="wn-tnum" style={{ flex: 'none', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', color: cents < 0 ? 'var(--strafe)' : 'var(--erfolg)' }}>
                  {cents > 0 ? '+' : ''}{euro(cents).replace('-', '−')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Link href="/kasse" className="wn-press" style={{ ...knopf, background: 'var(--strafe)', color: '#fff' }}>
          <Gavel size={16} weight="fill" />
          Melden
        </Link>
        <Link href="/kasse" className="wn-press" style={{ ...knopf, border: '1.5px solid var(--ink-200)', color: 'var(--navy)', background: 'var(--weiss)' }}>
          Spenden
        </Link>
      </div>
    </section>
  );
}
