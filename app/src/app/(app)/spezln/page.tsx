import { getCurrentMember } from '@/lib/session';
import { getStats, getAemter } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';
import { Card, SectionHeader, Avatar, Button, Input } from '@/components/ds';
import { Rangliste, type RanglisteEintrag } from './rangliste';
import { mitgliedAnlegen } from './actions';

export default async function SpezlnPage() {
  const me = (await getCurrentMember())!;
  const stats = getStats();
  const saison = aktuelleSaison();
  const aemter = getAemter(String(saison.jahr));

  const eintraege: RanglisteEintrag[] = stats.map((s) => {
    const amt = aemter.find((a) => a.amt.memberId === s.member.id);
    return {
      id: s.member.id,
      name: s.member.spitzname ?? s.member.name,
      photoUrl: s.member.photoUrl,
      hoiben: s.hoiben,
      abende: s.abende,
      wirtshaeuser: s.wirtshaeuser,
      streak: s.streak,
      istIch: s.member.id === me.id,
      amt: amt ? { titel: amt.amt.titel, icon: amt.amt.icon } : null,
    };
  });

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader eyebrow={saison.label} title="D’Rangliste" fraktur />
      <Rangliste eintraege={eintraege} />

      {aemter.length > 0 && (
        <>
          <SectionHeader eyebrow="Ehrenämter" title="D’Ämter" fraktur />
          <Card tone="parchment" pad={14}>
            {aemter.map(({ amt, member }, i) => (
              <div
                key={amt.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '9px 6px',
                  borderBottom: i < aemter.length - 1 ? '1px solid var(--pergament-edge)' : 'none',
                }}
              >
                <span style={{ fontSize: 20 }}>{amt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 18, color: 'var(--navy)' }}>{amt.titel}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>
                    {member ? (member.spitzname ?? member.name) : 'unbesetzt'}
                  </div>
                </div>
                {member && <Avatar src={member.photoUrl} name={member.name} size={34} ring />}
              </div>
            ))}
          </Card>
        </>
      )}

      {me.role === 'admin' && (
        <details
          style={{
            background: 'var(--weiss)', border: '1px solid var(--ink-100)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
          }}
        >
          <summary style={{ padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}>
            ➕ Neuen Spezl aufnehmen
          </summary>
          <div style={{ padding: '4px 18px 18px' }}>
            <form action={mitgliedAnlegen} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Name" name="name" placeholder="Sepp Brunner" required />
              <Input label="Spitzname" name="spitzname" placeholder="da Sepp" />
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
