import Link from 'next/link';
import { getCurrentMember } from '@/lib/session';
import {
  getAktuellerTermin,
  getTerminMitWirtshaus,
  getVotesFuerTermin,
  getStats,
  getOffeneStrafen,
} from '@/lib/queries';
import { datumLang } from '@/lib/format';
import { euro } from '@/lib/format';
import { Card, SectionHeader, Avatar, Icon, Badge } from '@/components/ds';
import { VotePills } from '@/components/domain/VotePills';

export default async function HomePage() {
  const me = (await getCurrentMember())!;
  const termin = getAktuellerTermin();
  const stats = getStats();
  const meineStats = stats.find((s) => s.member.id === me.id);
  const topHoibe = [...stats].sort((a, b) => b.hoiben - a.hoiben).slice(0, 3);
  const meineStrafen = getOffeneStrafen().filter((s) => s.eintrag.memberId === me.id);
  const strafSumme = meineStrafen.reduce((sum, s) => sum + Math.abs(s.eintrag.betragCents), 0);

  let hero: React.ReactNode;
  if (termin) {
    const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
    const alleVotes = getVotesFuerTermin(termin.id);
    const meinVote = alleVotes.find((v) => v.vote.memberId === me.id)?.vote.wert ?? null;
    const zu = alleVotes.filter((v) => v.vote.wert === 'zu').length;
    const vielleicht = alleVotes.filter((v) => v.vote.wert === 'vielleicht').length;
    const ab = alleVotes.filter((v) => v.vote.wert === 'ab').length;

    hero = (
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: 20 }}>
          <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Nächster Stammtisch</div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, color: 'var(--pergament)', margin: '6px 0 2px' }}>
            {wirtshaus ? wirtshaus.name : `organisiert von ${planer?.spitzname ?? planer?.name ?? '—'}`}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(246,240,226,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={15} />
            {wirtshaus?.bezirk ?? 'Wirtshaus wird no g’suacht'} · {datumLang(termin.datum)}, {termin.zeit} Uhr
          </div>

          <div style={{ margin: '16px 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)' }}>
            Hast du Zeit?
          </div>
          <VotePills terminId={termin.id} current={meinVote} onDark />
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.65)' }}>
            ✅ {zu} zugesagt · 🤔 {vielleicht} vielleicht · ❌ {ab} abgesagt
          </div>
        </div>
      </Card>
    );
  } else {
    hero = (
      <Card tone="dark" framed>
        <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Nächster Stammtisch</div>
        <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, color: 'var(--pergament)', margin: '6px 0' }}>
          No nix ausg’macht
        </div>
        <Link href="/termin" style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-bright)', textDecoration: 'none' }}>
          → Neuen Termin anlegen
        </Link>
      </Card>
    );
  }

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hero}

      {strafSumme > 0 && (
        <Card tone="white" pad={14} style={{ borderLeft: '4px solid var(--strafe)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--strafe)' }}>
                {meineStrafen.length} offene {meineStrafen.length === 1 ? 'Strafe' : 'Strafen'} · {euro(strafSumme)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>
                Bitte bis zum nächsten Stammtisch begleichen.
              </div>
            </div>
            <Link href="/kasse" style={{ color: 'var(--muc-blau)', display: 'inline-flex' }}>
              <Icon name="chevron" size={18} />
            </Link>
          </div>
        </Card>
      )}

      <SectionHeader eyebrow="Deine Saison" title="So stehst du da" />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <StatBlock value={meineStats?.hoiben ?? 0} label="Hoibe" icon="🍺" />
          <StatBlock value={meineStats?.abende ?? 0} label="Abende" icon="🌙" />
          <StatBlock value={meineStats?.wirtshaeuser ?? 0} label="Wirtshäuser" icon="📍" />
        </div>
        {meineStats && meineStats.streak > 1 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ink-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--gold-700)', display: 'inline-flex' }}><Icon name="flame" size={18} /></span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>{meineStats.streak}er-Serie!</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Koa Abend verpasst — weiter so.</span>
          </div>
        )}
      </Card>

      <SectionHeader
        eyebrow="Rangliste"
        title="Hoibe-Spezln"
        action={
          <Link href="/spezln" style={{ fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>
            Alle →
          </Link>
        }
      />
      <Card pad={12}>
        {topHoibe.map((s, i) => (
          <div
            key={s.member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 8px',
              borderBottom: i < topHoibe.length - 1 ? '1px solid var(--ink-100)' : 'none',
            }}
          >
            <span className="wn-tnum" style={{ width: 22, fontWeight: 800, fontSize: 15, color: i === 0 ? 'var(--gold-700)' : 'var(--ink-300)' }}>
              {i + 1}.
            </span>
            <Avatar src={s.member.photoUrl} name={s.member.name} size={36} ring={i === 0} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
              {s.member.spitzname ?? s.member.name}
              {s.member.id === me.id && <Badge tone="blau" style={{ marginLeft: 8 }}>du</Badge>}
            </span>
            <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--muc-blau)' }}>{s.hoiben} 🍺</span>
          </div>
        ))}
        {topHoibe.every((s) => s.hoiben === 0) && (
          <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            No koane Hoibe dokumentiert — des ändert sich beim nächsten Stammtisch. 🍺
          </div>
        )}
      </Card>
    </div>
  );
}

function StatBlock({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13 }}>{icon}</div>
      <div className="wn-tnum" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--muc-blau)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
        {label}
      </div>
    </div>
  );
}
