import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { LockSimple } from '@phosphor-icons/react/dist/ssr/LockSimple';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { tenantConfig, parseTenantConfig } from '@/lib/tenant-config';
import { findGruppe, tokensFuerGruppe, anfragenFuerGruppe } from '@/lib/db/directory';
import { eingeladenVon, mitgliederVon, tokensMitNamen } from '@/lib/verzeichnis';
import { tokenAnspruch } from '@/lib/gruendung';
import { hoibePreisEuro } from '@/lib/preise';
import { datumKurz, datumMitJahr } from '@/lib/format';
import { Avatar } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { AnfrageChip } from '@/components/domain/TokenKarte';
import { StammtischForm } from '@/app/(app)/stammtisch/stammtisch-form';
import { chipStil } from '../stil';
import { gruppeSpeichern } from '../actions';
import { BearbeitenKlappe, SchenkKnopf, SperrKnopf } from '../knoepfe';

export const metadata = { title: 'Stammtisch · Verzeichnis' };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };
const zeileStil: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EEF1F5' };

/**
 * Stammtisch-Detail im Verzeichnis (3b, 4b): Kopf mit Logo und Einlader,
 * Stammdaten (gleiches Formular wie „Stammtisch verwalten“), Tokens mit
 * Verlauf und „Token schenken“, Mitglieder nur lesend, Sperren ganz unten.
 */
export default async function VerzeichnisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  erzwingeProfil(me);
  if (me.role !== 'admin' || !tenantConfig().istGruender) redirect('/');
  const { id } = await params;
  const gruppe = findGruppe(id);
  if (!gruppe) notFound();

  const config = parseTenantConfig(gruppe);
  const von = eingeladenVon(gruppe.id);
  const tokens = tokensMitNamen(gruppe.id, tokensFuerGruppe(gruppe.id));
  const anfragen = anfragenFuerGruppe(gruppe.id);
  const fristen = tokenAnspruch(gruppe).gesperrt;
  const mitglieder = mitgliederVon(gruppe.id);
  const gesperrt = gruppe.status === 'gesperrt';
  const anspruchTokens = tokens.filter((t) => t.quelle === 'anspruch');
  const tokenTitel = (t: (typeof tokens)[number]) => {
    if (t.quelle === 'anspruch') {
      const nr = anspruchTokens.indexOf(t) + 1;
      return `Token ${nr} · nach ${nr === 1 ? 2 : 6} Monaten`;
    }
    return t.quelle === 'anfrage' ? 'Token aus Anfrage' : t.quelle === 'admin' ? (gruppe.istGruender ? `Token von ${t.vonName}` : 'Token geschenkt') : `Token von ${t.vonName}`;
  };

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Link href="/verzeichnis" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}><ArrowLeft size={16} weight="bold" />Verzeichnis</Link>

      {/* Kopf */}
      <div style={{ borderRadius: 24, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
        <div style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', flex: 'none', overflow: 'hidden' }}>
            {config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${config.logoUrl}?s=128`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Image src="/brand/rauten-app.svg" alt="" width={46} height={46} style={{ height: 46, width: 'auto' }} />
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--gold-bright)' }}>{gruppe.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.8)' }}>Kennung {gruppe.id} · {gruppe.typ === 'stammhaus' ? 'Stammhaus' : 'wandernd'}{gruppe.stadt ? ` · ${gruppe.stadt}` : ''}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.65)' }}>
              {gruppe.istGruender ? 'Der Gründer-Stammtisch' : von ? `eingeladen von ${von.vonName} (${von.gruppeName})${von.widmung ? ` · für ${von.widmung}` : ''}` : 'ohne Token angelegt'}
            </span>
            {gesperrt && <span style={{ ...chipStil('strafe'), alignSelf: 'flex-start', marginTop: 4 }}><Prohibit size={13} weight="fill" />gesperrt{gruppe.gesperrtAm ? ` seit ${datumKurz(gruppe.gesperrtAm.slice(0, 10))}` : ''}</span>}
          </div>
        </div>
      </div>

      {/* Stammdaten */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel>Stammdaten</HoamTitel>
        <div style={{ ...karteStil, padding: '2px 16px' }}>
          {[
            ['Name', gruppe.name], ['Stadt', gruppe.stadt ?? '—'], ['Gegründet', gruppe.gruendungsjahr ? String(gruppe.gruendungsjahr) : '—'], ['Motto', gruppe.motto ?? '—'],
            ['Gründungscode', gruppe.gruendungscode ?? 'Aufnahme zu'], ['Hoibe', `${hoibePreisEuro(config.hoibePreisCents)} €`], ['Angelegt', datumMitJahr(gruppe.createdAt.slice(0, 10))],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #EEF1F5' : 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', flex: 'none' }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{v}</span>
            </div>
          ))}
        </div>
        <BearbeitenKlappe>
          <div style={{ ...karteStil, padding: 16 }}>
            <StammtischForm
              speichern={gruppeSpeichern.bind(null, gruppe.id)}
              werte={{
                name: gruppe.name,
                motto: gruppe.motto ?? '',
                stadt: gruppe.stadt ?? '',
                gruendungsjahr: gruppe.gruendungsjahr ? String(gruppe.gruendungsjahr) : '',
                gruendungscode: gruppe.gruendungscode ?? '',
                hoibePreis: hoibePreisEuro(config.hoibePreisCents),
                logo: config.logo,
                bierName: config.bierName,
                schnaps: config.features.schnaps,
              }}
            />
          </div>
        </BearbeitenKlappe>
      </section>

      {/* Tokens */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>{tokens.length}</span>}>Tokens</HoamTitel>
        {(tokens.length > 0 || fristen.length > 0 || anfragen.length > 0) && (
          <div style={{ ...karteStil, padding: '2px 16px' }}>
            {tokens.map((t) => (
              <div key={t.token} style={zeileStil}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{tokenTitel(t)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.status === 'eingeloest'
                      ? `${t.eingeloestName ?? '—'} gegründet${t.eingeloestAm ? ` · ${datumKurz(t.eingeloestAm.slice(0, 10))}` : ''}${t.widmung ? ` · für ${t.widmung}` : ''}`
                      : t.widmung ? `gewidmet „${t.widmung}“ von ${t.vonName}${t.gewidmetAm ? ` · ${datumKurz(t.gewidmetAm.slice(0, 10))}` : ''}` : `${t.token} · noch nicht gewidmet`}
                  </span>
                </div>
                {t.status === 'eingeloest' ? <span style={chipStil('blau')}>eingelöst</span> : t.widmung ? <span style={chipStil('gold')}>gewidmet</span> : <span style={chipStil('grau')}>offen</span>}
              </div>
            ))}
            {fristen.map((f) => (
              <div key={f.nr} style={zeileStil}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Token {f.nr} · nach {f.monate} Monaten</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>ab {datumMitJahr(f.ab.slice(0, 10))}</span>
                </div>
                <span style={chipStil('grau')}><LockSimple size={13} weight="fill" />gesperrt</span>
              </div>
            ))}
            {anfragen.map((a) => (
              <div key={a.id} style={zeileStil}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Token-Anfrage</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{datumKurz(a.createdAt.slice(0, 10))} · „{a.grund}“</span>
                </div>
                <AnfrageChip status={a.status} />
              </div>
            ))}
          </div>
        )}
        {!gruppe.istGruender && <SchenkKnopf id={gruppe.id} />}
      </section>

      {/* Mitglieder */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>{mitglieder.length}</span>}>Mitglieder</HoamTitel>
        <div style={{ ...karteStil, padding: '2px 16px' }}>
          {mitglieder.map((m, i) => (
            <div key={m.id} style={{ ...zeileStil, padding: '10px 0', borderBottom: i < mitglieder.length - 1 ? '1px solid #EEF1F5' : 'none' }}>
              <Avatar src={m.photoUrl} name={m.name} size={34} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
              </div>
              {m.admin && <span style={{ ...chipStil('gold'), background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>Admin</span>}
              {m.erstanmeldung && <span style={chipStil('grau')}>noch nicht angemeldet</span>}
            </div>
          ))}
          {mitglieder.length === 0 && <div style={{ padding: '12px 0', fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Keine Mitglieder gefunden.</div>}
        </div>
      </section>

      {/* Zugang */}
      {!gruppe.istGruender && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel>Zugang</HoamTitel>
          <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Gesperrt bleiben alle Daten erhalten, aber niemand kommt mehr rein. Tokens des Stammtischs lassen sich nicht einlösen.</span>
            <SperrKnopf id={gruppe.id} name={gruppe.name} gesperrt={gesperrt} spezln={mitglieder.length} />
          </div>
        </section>
      )}
    </div>
  );
}
