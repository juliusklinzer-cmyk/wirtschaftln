import { getCurrentMember } from '@/lib/session';
import { getSaldo, getKasseEintraege, getOffeneStrafen, getAktiveMitglieder } from '@/lib/queries';
import { euro, datumKurz } from '@/lib/format';
import { Card, SectionHeader, Avatar, Badge, Button, Input } from '@/components/ds';
import { melden, forderungStatus, einzahlung, ausgabe } from './actions';

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
  borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15,
  fontWeight: 500, color: 'var(--ink-900)', background: 'var(--weiss)',
};

export default async function KassePage() {
  const me = (await getCurrentMember())!;
  const saldo = getSaldo();
  const eintraege = getKasseEintraege();
  const offene = getOffeneStrafen();
  const mitglieder = getAktiveMitglieder();
  const offeneSumme = offene.reduce((sum, o) => sum + Math.abs(o.eintrag.betragCents), 0);

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Kassenstand */}
      <Card tone="dark" framed>
        <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Kassenstand</div>
        <div className="wn-tnum" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--gold-bright)', margin: '6px 0 2px' }}>
          {euro(saldo)}
        </div>
        {offene.length > 0 && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.75)' }}>
            ⚠️ {offene.length} offene {offene.length === 1 ? 'Forderung' : 'Forderungen'} · {euro(offeneSumme)}
          </div>
        )}
      </Card>

      {/* Aktionen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Klappbox titel="💸 Wirtschaftler melden">
          <form action={melden} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Wer war’s?</label>
              <select name="memberId" required style={selectStyle} defaultValue="">
                <option value="" disabled>Spezl auswählen…</option>
                {mitglieder.filter((m) => m.id !== me.id).map((m) => (
                  <option key={m.id} value={m.id}>{m.spitzname ?? m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Vorwurf</label>
              <select name="grund" required style={selectStyle} defaultValue="Zugesagt & nicht erschienen">
                <option>Zugesagt & nicht erschienen</option>
                <option>Zu spät — über 30 min</option>
                <option>Falsches Wirtshaus vorgeschlagen</option>
                <option>Handy am Tisch</option>
                <option>Weißbier bestellt</option>
                <option>Sonstiges Vergehen</option>
              </select>
            </div>
            <Input label="Forderung (€)" name="betrag" type="number" step="0.50" min="0.50" defaultValue="10" required />
            <Button type="submit" variant="danger" fullWidth>Melden & Forderung stellen</Button>
          </form>
        </Klappbox>

        <Klappbox titel="🍻 Einzahlung / Runde">
          <form action={einzahlung} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Von wem</label>
              <select name="memberId" defaultValue={me.id} style={selectStyle}>
                {mitglieder.map((m) => (
                  <option key={m.id} value={m.id}>{m.spitzname ?? m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Art</label>
              <select name="kind" defaultValue="einzahlung" style={selectStyle}>
                <option value="einzahlung">Einzahlung</option>
                <option value="runde">Runde geschmissen 🍻</option>
              </select>
            </div>
            <Input label="Grund" name="grund" placeholder="z. B. Strafe beglichen" />
            <Input label="Betrag (€)" name="betrag" type="number" step="0.50" min="0.50" required />
            <Button type="submit" fullWidth>Eintragen</Button>
          </form>
        </Klappbox>

        <Klappbox titel="🧾 Ausgabe buchen">
          <form action={ausgabe} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Wofür" name="grund" placeholder="z. B. Jahresfeier-Anzahlung" required />
            <Input label="Betrag (€)" name="betrag" type="number" step="0.50" min="0.50" required />
            <Button type="submit" variant="secondary" fullWidth>Ausgabe buchen</Button>
          </form>
        </Klappbox>
      </div>

      {/* Bewegungen */}
      <SectionHeader eyebrow="Kassenbuch" title="Bewegungen" />
      <Card pad={12}>
        {eintraege.length === 0 && (
          <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            No koane Bewegungen — brav seid’s. 😇
          </div>
        )}
        {eintraege.map(({ eintrag, member }, i) => {
          const istForderung = eintrag.kind === 'strafe';
          const betragFarbe =
            eintrag.status === 'aufgehoben' ? 'var(--ink-300)' : eintrag.betragCents < 0 ? 'var(--strafe)' : 'var(--erfolg)';
          return (
            <div
              key={eintrag.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                borderBottom: i < eintraege.length - 1 ? '1px solid var(--ink-100)' : 'none',
                opacity: eintrag.status === 'aufgehoben' ? 0.55 : 1,
              }}
            >
              {member ? (
                <Avatar src={member.photoUrl} name={member.name} size={36} />
              ) : (
                <span style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--ink-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  🧾
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member ? (member.spitzname ?? member.name) : 'Vereinskasse'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {eintrag.grund} · {datumKurz(eintrag.createdAt.slice(0, 10))}
                </div>
                {istForderung && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {eintrag.status !== 'beglichen' && (
                      <StatusForm id={eintrag.id} status="beglichen" label="✓ beglichen" farbe="var(--erfolg)" />
                    )}
                    {eintrag.status !== 'offen' && (
                      <StatusForm id={eintrag.id} status="offen" label="○ offen" farbe="var(--warnung)" />
                    )}
                    {eintrag.status !== 'aufgehoben' && (
                      <StatusForm id={eintrag.id} status="aufgehoben" label="✕ aufheben" farbe="var(--ink-500)" />
                    )}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: betragFarbe }}>
                  {eintrag.betragCents > 0 ? '+' : ''}
                  {euro(eintrag.betragCents)}
                </div>
                {istForderung && (
                  <Badge tone={eintrag.status === 'beglichen' ? 'erfolg' : eintrag.status === 'offen' ? 'strafe' : 'neutral'} style={{ marginTop: 4 }}>
                    {eintrag.status}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Klappbox({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <details
      style={{
        background: 'var(--weiss)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
      }}
    >
      <summary
        style={{
          padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)',
          cursor: 'pointer', listStyle: 'none', userSelect: 'none',
        }}
      >
        {titel}
      </summary>
      <div style={{ padding: '4px 18px 18px' }}>{children}</div>
    </details>
  );
}

function StatusForm({ id, status, label, farbe }: { id: string; status: 'offen' | 'beglichen' | 'aufgehoben'; label: string; farbe: string }) {
  return (
    <form action={forderungStatus.bind(null, id, status)}>
      <button
        type="submit"
        style={{
          border: `1px solid ${farbe}`, background: 'transparent', color: farbe,
          borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: 11, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
        }}
      >
        {label}
      </button>
    </form>
  );
}
