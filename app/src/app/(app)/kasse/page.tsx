import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { getSaldo, getKasseEintraege, getOffeneStrafen, getAktiveMitglieder, getKassenwartId, getPraesidentId } from '@/lib/queries';
import { HOIBE_KELLERPREIS_CENTS } from '@/lib/preise';
import { euro, datumKurz } from '@/lib/format';
import { Card, SectionHeader, Avatar, Badge, Input } from '@/components/ds';
import { AktionsChips, type AktionsChip } from '@/components/domain/AktionsChips';
import { melden, forderungStatus, einzahlung, spenden, auslage, ausgabe } from './actions';

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
  borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15,
  fontWeight: 500, color: 'var(--ink-900)', background: 'var(--weiss)',
};

export default async function KassePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const saldo = getSaldo();
  const eintraege = getKasseEintraege();
  const offene = getOffeneStrafen();
  const mitglieder = getAktiveMitglieder();
  const offeneSumme = offene.reduce((sum, o) => sum + Math.abs(o.eintrag.betragCents), 0);
  const kassenwartId = getKassenwartId();
  const kassenwart = mitglieder.find((m) => m.id === kassenwartId) ?? null;
  // Rollen: der Kassenwart wahrt d'Kasse (buchen, eintreiben), der Präsident erlässt Schulden
  const darfKasse = me.role === 'admin' || me.id === kassenwartId;
  const darfErlassen = me.role === 'admin' || me.id === getPraesidentId();
  const hoibePreis = (HOIBE_KELLERPREIS_CENTS / 100).toFixed(2).replace('.', ',');

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Kassenstand, Zeremonie-Karte mit Rauten-Band */}
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: '18px 20px' }}>
          <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Kassenstand</div>
          <div className="wn-tnum" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--gold-bright)', margin: '6px 0 2px' }}>
            {euro(saldo)}
          </div>
          {offene.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.75)' }}>
              ⚠️ davon no einzutreiben: {offene.length} {offene.length === 1 ? 'Forderung' : 'Forderungen'} · {euro(offeneSumme)}
            </div>
          )}
          {kassenwart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <Avatar src={kassenwart.photoUrl} name={kassenwart.name} size={24} ring />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pergament)', opacity: 0.85 }}>
                {anzeigeName(kassenwart)} wahrt d’Kasse
              </span>
            </div>
          )}
        </div>
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      </Card>

      {/* D'Maßeinheit: alles wird in Hoibe zahlt, Preis vom Bräustüberl */}
      <Card pad={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, flex: 'none' }}>🍺</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 19, color: 'var(--navy)', lineHeight: 1.1 }}>D’Maßeinheit</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 3, lineHeight: 1.5 }}>
              Zahlt wird in Hoibe: 1 Hoibe = <b className="wn-tnum">{hoibePreis} €</b>{' '}
              <a
                href="https://braeustuben.de/speisekarten-getraenke/#getraenkekarte"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--muc-blau)', fontWeight: 800, textDecoration: 'none' }}
              >
                (Bräustüberl)
              </a>
              . A Runde = Teilnehmer × Hoibe.
            </div>
          </div>
        </div>
      </Card>

      {/* Aktionen, kompakte Chips, nur die angetippte klappt auf */}
      <AktionsChips
        aktionen={[
          {
            key: 'melden',
            chip: '⚖️ Melden',
            titel: 'Na, des kost a Hoibe!',
            erfolgText: '✓ Gmeldt, des zahlt er in Hoibe!',
            submitLabel: 'Melden',
            submitVariant: 'danger',
            action: melden,
            felder: (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Wer war’s?</label>
                  <select name="memberId" required style={selectStyle} defaultValue="">
                    <option value="" disabled>Spezl auswählen…</option>
                    {mitglieder.filter((m) => m.id !== me.id).map((m) => (
                      <option key={m.id} value={m.id}>{anzeigeName(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
                    Was hat er o’gstellt?, frei formulieren
                  </label>
                  <input
                    name="grund"
                    list="wn-vergehen"
                    required
                    maxLength={200}
                    placeholder="z. B. Weißwurscht um 18 Uhr gessen…"
                    style={selectStyle}
                  />
                  <datalist id="wn-vergehen">
                    <option value="Weißwurscht nach zwölfe gessen" />
                    <option value="Ketchup aufn Leberkas" />
                    <option value="Maß mit Strohhalm trunka" />
                    <option value="Handy-Daddeln am Tisch" />
                    <option value="Spezi zum Schweinsbraten bestellt" />
                  </datalist>
                </div>
                <Input
                  label="Und des kost… (Hoibe)"
                  name="hoibe"
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  defaultValue="1"
                  hint={`1 Hoibe = ${hoibePreis} € · a Runde wären ${mitglieder.length} Hoibe`}
                  required
                />
              </>
            ),
          },
          {
            key: 'spenden',
            chip: '💝 Spenden',
            titel: 'Hoibe eini schmeißen (Spende)',
            erfolgText: '✓ Vergelt’s Gott, auf d’Hüttn gspart!',
            submitLabel: 'Hoibe spenden',
            submitVariant: 'gold',
            action: spenden,
            felder: (
              <>
                <Input
                  label="Wia vui Hoibe magst eini schmeißen?"
                  name="hoibe"
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  defaultValue="1"
                  hint={`1 Hoibe = ${hoibePreis} €, jede Hoibe bringt uns der Hüttn näher`}
                  required
                />
                <Input label="Anlass (optional)" name="grund" placeholder="z. B. Geburtstag, guade Laune, Aufstiegsfeier…" />
              </>
            ),
          },
          {
            key: 'auslage',
            chip: '💶 Auslage',
            titel: 'Auslage für’n Verein eintragen',
            erfolgText: '✓ Eingetragen, der Verein dankt dir!',
            submitLabel: 'Eintragen',
            submitVariant: 'secondary',
            action: auslage,
            felder: (
              <>
                <Input label="Wofür" name="grund" placeholder="z. B. Hosting-Server, Domain wirtschaftln.de…" required />
                <Input label="Betrag (€)" name="betrag" type="number" step="0.01" min="0.01" required />
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
                  Wennst privat was für’n Verein zahlt hast, steht dann mit deim Namen als Minus im Kassenbuch.
                </div>
              </>
            ),
          },
          ...(darfKasse
            ? ([
                {
                  key: 'einzahlung',
                  chip: '🍻 Einzahlung',
                  titel: 'Einzahlung eintragen (Kassenwart)',
                  erfolgText: '✓ Eingetragen, vergelt’s Gott!',
                  submitLabel: 'Eintragen',
                  action: einzahlung,
                  felder: (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Von wem</label>
                        <select name="memberId" defaultValue={me.id} style={selectStyle}>
                          {mitglieder.map((m) => (
                            <option key={m.id} value={m.id}>{anzeigeName(m)}</option>
                          ))}
                        </select>
                      </div>
                      <Input label="Grund" name="grund" placeholder="z. B. Hüttn-Sparbeitrag, Wiesn-Topf…" />
                      <Input label="Betrag (€)" name="betrag" type="number" step="0.50" min="0.50" required />
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
                        Bar zahlte Strafe? Ned extra buchen, im Kassenbuch einfach auf ✓ beglichen setzen (steht scho im Saldo).
                      </div>
                    </>
                  ),
                },
                {
                  key: 'ausgabe',
                  chip: '🧾 Ausgabe',
                  titel: 'Ausgabe buchen (Kassenwart)',
                  erfolgText: '✓ Ausgabe bucht.',
                  submitLabel: 'Buchen',
                  submitVariant: 'secondary',
                  felder: (
                    <>
                      <Input label="Wofür" name="grund" placeholder="z. B. Jahresfeier-Anzahlung" required />
                      <Input label="Betrag (€)" name="betrag" type="number" step="0.50" min="0.50" required />
                    </>
                  ),
                  action: ausgabe,
                },
              ] satisfies AktionsChip[])
            : []),
        ]}
      />

      {/* Bewegungen, alles aus Kassen-Perspektive: Plus kimmt eini, Minus geht außi */}
      <SectionHeader eyebrow="Kassenbuch" title="D’Bewegungen" fraktur />
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-500)', margin: '-8px 0 0', lineHeight: 1.5 }}>
        Ois aus Sicht vo da Kasse: <b style={{ color: 'var(--erfolg)' }}>Plus</b> kimmt eini, <b style={{ color: 'var(--strafe)' }}>Minus</b> geht außi.
        Offene Forderungen stehn scho als Plus im Kassenstand, da Kassenwart treibt’s nur no ei.
      </div>
      <Card pad={12}>
        {eintraege.length === 0 && (
          <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            No koane Bewegungen, brav seid’s.
          </div>
        )}
        {eintraege.map(({ eintrag, member, melder, termin, wirtshaus }, i) => {
          const istForderung = eintrag.kind === 'strafe';
          // Kassen-Perspektive: a Forderung is a Plus für d'Kasse, „offen" heißt nur, da Kassenwart hat's no ned kassiert
          const anzeigeCents = istForderung ? Math.abs(eintrag.betragCents) : eintrag.betragCents;
          const betragFarbe =
            eintrag.status === 'aufgehoben' ? 'var(--ink-300)'
            : istForderung ? (eintrag.status === 'beglichen' ? 'var(--erfolg)' : 'var(--warnung)')
            : anzeigeCents < 0 ? 'var(--strafe)' : 'var(--erfolg)';
          // Die ganze G'schicht: wann · wo · wer's gmeldt hat (App oder Spezl)
          const details = [
            datumKurz((termin?.datum ?? eintrag.createdAt).slice(0, 10)),
            wirtshaus ? `📍 ${wirtshaus.name}` : null,
            istForderung ? (melder ? `gmeldt vom ${anzeigeName(melder)}` : 'von der App erfasst') : melder && melder.id !== eintrag.memberId ? `bucht vom ${anzeigeName(melder)}` : null,
          ].filter(Boolean);
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
                  {member ? (anzeigeName(member)) : 'Vereinskasse'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {eintrag.grund}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {details.join(' · ')}
                </div>
                {istForderung && eintrag.status === 'aufgehoben' && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', marginTop: 2 }}>
                    👑 vom Präsidenten erlassen, kimmt nix eini
                  </div>
                )}
                {istForderung && (darfKasse || darfErlassen) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {darfKasse && eintrag.status !== 'beglichen' && (
                      <StatusForm id={eintrag.id} status="beglichen" label="✓ beglichen" farbe="var(--erfolg)" />
                    )}
                    {darfKasse && eintrag.status !== 'offen' && (
                      <StatusForm id={eintrag.id} status="offen" label="○ offen" farbe="var(--warnung)" />
                    )}
                    {darfErlassen && eintrag.status === 'offen' && (
                      <StatusForm id={eintrag.id} status="aufgehoben" label="👑 erlassen" farbe="var(--gold-700)" />
                    )}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div
                  className="wn-tnum"
                  style={{
                    fontSize: 15, fontWeight: 800, color: betragFarbe,
                    textDecoration: istForderung && eintrag.status === 'aufgehoben' ? 'line-through' : undefined,
                  }}
                >
                  {anzeigeCents > 0 ? '+' : ''}
                  {euro(anzeigeCents)}
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
