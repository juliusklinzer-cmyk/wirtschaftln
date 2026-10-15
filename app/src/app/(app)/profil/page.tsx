import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Flame } from '@phosphor-icons/react/dist/ssr/Flame';
import { Snowflake } from '@phosphor-icons/react/dist/ssr/Snowflake';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { IdentificationCard } from '@phosphor-icons/react/dist/ssr/IdentificationCard';
import { getCurrentMember } from '@/lib/session';
import { anzeigeName, urkundenName } from '@/lib/namen';
import { getStats, getAemter, getArchiv } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';
import { saisonBadgesVergeben, serienAbzeichen, amtInfo, AEMTER_INFO } from '@/lib/badges';
import { Avatar } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { SchrumpfKopf, MiniKopfLeiste } from '@/components/domain/SchrumpfKopf';
import { Steckbrief, steckbriefLeer } from '@/components/domain/Steckbrief';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { ProfilBearbeiten } from './profil-bearbeiten';
import { ProfilForm, type ProfilWerte } from './profil-form';
import { Einstellungen } from './einstellungen';
import { Schliessen } from './schliessen';
import { tokenErzeugen, tokenWidmen, tokenAnfragen } from './actions';
import { logout } from '@/app/login/actions';
import { tenantConfig } from '@/lib/tenant-config';
import { tokensFuerProfil, tokenLink, tokenAnspruch } from '@/lib/gruendung';
import { findGruppe } from '@/lib/db/directory';
import { currentTenant, db, members } from '@/lib/db';
import { datumKurz, datumMitJahr } from '@/lib/format';

export const metadata = { title: 'Mei Profil · Wirtschaftln' };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };

/**
 * Profil (Redesign 14.10.2026, 1a–1c): Urkunden-Kopf mit WP, Platz und Serie,
 * Auszeichnungen, Steckbrief, Einstellungen. Bearbeiten als Vollbild, beim
 * ersten Login steht das Formular direkt da (ohne X, ohne Tab-Leiste).
 */
export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ steckbrief?: string }> }) {
  // ?steckbrief=1: der Gründer kommt nach den Slides her, der Editor geht gleich auf
  const { steckbrief } = await searchParams;
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  const config = tenantConfig();
  // 🎟️ Gründungs-Token (Token-Verzeichnis-Redesign): beim Gründer die eigenen, sonst
  // (nur Admins) die des Stammtischs samt Fristen und Anfragen, lazy gemünzt
  const tokenProfil = me.erstanmeldung ? null : tokensFuerProfil(me);
  const saison = aktuelleSaison();
  const statsSaison = getStats({ abDatum: saison.start });
  const statsAllzeit = getStats();
  const meineSaison = statsSaison.find((s) => s.member.id === me.id);
  const meineAllzeit = statsAllzeit.find((s) => s.member.id === me.id);

  // Aktuelles Amt (Präsident/Schriftführer automatisch, Rest aus der DB)
  const praesident = [...statsSaison].sort((a, b) => b.punkte - a.punkte)[0];
  const fleissigster = [...statsSaison].sort((a, b) => b.abschluesse - a.abschluesse)[0];
  let amt: { titel: string; icon: string } | null = null;
  if (praesident?.member.id === me.id && praesident.punkte > 0) amt = { titel: 'Präsident', icon: AEMTER_INFO['Präsident'].icon };
  else if (fleissigster?.member.id === me.id && fleissigster.abschluesse > 0) amt = { titel: 'Schriftführer', icon: AEMTER_INFO['Schriftführer'].icon };
  else {
    const amtDb = getAemter(String(saison.jahr)).find(({ amt: a }) => a.memberId === me.id && a.titel !== 'Schriftführer');
    if (amtDb) amt = { titel: amtDb.amt.titel, icon: amtInfo(amtDb.amt.titel).icon };
  }

  // Getragene Saison-Badges + dauerhafte Serien-Abzeichen
  const archivSaison = getArchiv().filter((a) => a.termin.datum >= saison.start && a.rating > 0);
  const bestes = [...archivSaison].sort((a, b) => b.rating - a.rating)[0];
  const badges = saisonBadgesVergeben(statsSaison, bestes?.planer?.id ?? null).filter((b) => b.holderId === me.id);
  const serien = serienAbzeichen(meineAllzeit?.bestStreak ?? 0);
  const rang = [...statsSaison].sort((a, b) => b.punkte - a.punkte).findIndex((s) => s.member.id === me.id) + 1;
  const streak = meineAllzeit?.streak ?? 0;
  const name = anzeigeName(me);
  const voll = urkundenName(me);
  const kurzSaison = saison.label.replace(/^Saison \d+ · /, 'Saison ');

  const werte: ProfilWerte = {
    name: me.name,
    vorname: me.vorname,
    nachname: me.nachname,
    spitzname: me.spitzname,
    photoUrl: me.photoUrl,
    herkunft: me.herkunft,
    lieblingsbier: me.lieblingsbier,
    lieblingsweissbier: me.lieblingsweissbier,
    leibspeise: me.leibspeise,
    lieblingsbiergarten: me.lieblingsbiergarten,
    lieblingswirtshaus: me.lieblingswirtshaus,
    verein: me.verein,
    schafkopfer: me.schafkopfer,
    weisswuerste: me.weisswuerste,
    beschreibung: me.beschreibung,
    erstanmeldung: me.erstanmeldung,
    vereinsWahl: config.features.vereinsWahl,
  };

  // ── Erster Login (1c): Willkommen + Formular, sonst nix ──
  if (me.erstanmeldung) {
    return (
      <div className="wn-eintritt" style={{ padding: 'calc(16px + env(safe-area-inset-top)) 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ borderRadius: 22, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', boxShadow: 'var(--sh-lg)' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 32, lineHeight: 1, color: 'var(--gold-bright)' }}>{config.istGruender ? 'Servus beim Wirtschaftln!' : 'Servus, willkommen in der Runde!'}</span>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.85)' }}>Setz dir dein eigenes Passwort und stell dich kurz vor, damit die Spezln wissen, wen sie vor sich haben.</span>
          </div>
        </div>
        <ProfilForm werte={werte} />
      </div>
    );
  }

  const leer = steckbriefLeer(me);

  // Token-Bereich fürs Einstellungs-Blatt (Namen der Widmenden aus dem eigenen Mandanten)
  const gruppe = currentTenant().gruppe;
  const nameVon = (id: string) => {
    if (id === me.id) return 'dir';
    const m = db.select().from(members).where(eq(members.id, id)).get();
    return m ? anzeigeName(m) : '—';
  };
  const tokenBereich = tokenProfil
    ? {
        tokens: tokenProfil.tokens.map((t) => {
          const g = t.eingeloestVonGruppeId ? findGruppe(t.eingeloestVonGruppeId) : null;
          return {
            token: t.token,
            link: tokenLink(t.token),
            widmung: t.widmung,
            gewidmetZeile: t.widmung ? `von ${nameVon(t.memberId)}${t.gewidmetAm ? ` · ${datumKurz(t.gewidmetAm.slice(0, 10))}` : ''}` : null,
            eingeloest: t.status === 'eingeloest' ? { gruppeName: g?.name ?? '—', stadt: g?.stadt ?? null, am: t.eingeloestAm ? datumKurz(t.eingeloestAm.slice(0, 10)) : '—' } : null,
          };
        }),
        fristen: gruppe.istGruender
          ? []
          : (() => {
              const { gesperrt } = tokenAnspruch(gruppe);
              return [2, 6].map((monate, i) => {
                const offen = gesperrt.find((f) => f.nr === i + 1);
                const ab = offen ? offen.ab : null;
                const d = ab ?? new Date(new Date(gruppe.createdAt).setMonth(new Date(gruppe.createdAt).getMonth() + monate)).toISOString();
                return { nr: i + 1, monate, abLang: datumMitJahr(d.slice(0, 10)), abKurz: datumKurz(d.slice(0, 10)), offen: !!offen };
              });
            })(),
        gruendung: datumKurz(gruppe.createdAt.slice(0, 10)),
        anfragen: tokenProfil.anfragen.map((a) => ({ id: a.id, status: a.status, am: datumKurz((a.entschiedenAm ?? a.createdAt).slice(0, 10)), grund: a.grund })),
        darfAnfragen: tokenProfil.darfAnfragen,
        eigene: gruppe.istGruender && me.role !== 'admin',
        widmen: tokenWidmen,
        anfrageSchicken: tokenProfil.darfAnfragen || tokenProfil.anfragen.length > 0 ? tokenAnfragen : undefined,
        neuerToken: tokenProfil.darfMuenzen ? tokenErzeugen : undefined,
      }
    : null;

  return (
    <div className="wn-eintritt" style={{ padding: 'calc(14px + env(safe-area-inset-top)) 16px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      <Schliessen />

      {/* ── Urkunden-Kopf (1a), beim Scrollen die Mini-Pille (2a) ── */}
      <SchrumpfKopf
        gapAusgleich={24}
        kompakt={
          <div style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
            <MiniKopfLeiste photoUrl={me.photoUrl} name={name} wp={meineSaison?.punkte ?? 0} verein={me.verein} rechts={<Schliessen klein />} />
          </div>
        }
      >
        <div style={{ borderRadius: 24, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', boxShadow: 'var(--sh-lg)' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
          <div style={{ padding: '22px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="wn-pop" style={{ position: 'relative', width: 96, height: 96 }}>
              <Avatar src={me.photoUrl} name={name} size={96} style={{ borderRadius: '50%', boxShadow: '0 0 0 3px var(--pergament), 0 0 0 5px var(--gold)' }} />
              <span style={{ position: 'absolute', left: -4, bottom: 2, width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                {me.verein === 'bayern' || me.verein === 'sechzig' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.verein === 'bayern' ? '/brand/vereine/fcb.png' : '/brand/vereine/1860.png'} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 15 }}>🥨</span>
                )}
              </span>
              {rang > 0 && (
                <span className="wn-tnum" style={{ position: 'absolute', right: -6, bottom: 0, width: 32, height: 32, borderRadius: '50%', background: rang <= 3 ? 'var(--grad-gold)' : 'var(--weiss)', border: '2px solid var(--navy-900)', color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{rang}</span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 34, lineHeight: 1, marginTop: 14, color: 'var(--gold-bright)', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>{name}</span>
            {voll && voll !== name && <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(246,240,226,0.85)', marginTop: 4 }}>{voll}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.85)' }}>
              {amt ? <><span style={{ fontSize: 13 }}>{amt.icon}</span>{amt.titel}</> : 'Mitglied'}
              {me.herkunft && <><span style={{ opacity: 0.5 }}>·</span><MapPin size={13} weight="fill" color="#fff" />{me.herkunft}</>}
              {me.schafkopfer && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/vereine/eichel.png" alt="Schafkopfer" title="Schafkopfer" style={{ width: 15, height: 15, objectFit: 'contain' }} />
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'stretch', marginTop: 18, alignSelf: 'stretch', borderTop: '1px solid rgba(208,173,102,0.3)', paddingTop: 14 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: 'var(--gold-bright)' }}>{meineSaison?.punkte ?? 0}<span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginLeft: 4 }}>WP</span></span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.6)' }}>{kurzSaison}</span>
              </div>
              <span style={{ width: 1, background: 'rgba(208,173,102,0.3)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: 'var(--pergament)' }}>{rang > 0 ? `${rang}.` : '–'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.6)' }}>Platz</span>
              </div>
              <span style={{ width: 1, background: 'rgba(208,173,102,0.3)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: 'var(--pergament)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {streak > 0 ? <Flame size={22} weight="fill" color="#E8833A" /> : streak < 0 ? <Snowflake size={22} weight="fill" color="#8EC5E8" /> : null}
                  {Math.abs(streak)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.6)' }}>{streak < 0 ? 'gefehlt' : 'in Folge'}</span>
              </div>
            </div>
          </div>
        </div>
      </SchrumpfKopf>

      {/* ── Auszeichnungen (Anker #badges fürs Profil-Menü) ── */}
      <span id="badges" aria-hidden style={{ scrollMarginTop: 12 }} />
      {(badges.length > 0 || serien.length > 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel>Auszeichnungen</HoamTitel>
          <div style={{ ...karteStil, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {badges.map((b) => (
              <div key={b.key} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={92} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Saison-Badge · {b.tag}</span>
                </div>
              </div>
            ))}
            {serien.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: badges.length > 0 ? 12 : 0, borderTop: badges.length > 0 ? '1px solid var(--ink-50)' : 'none', flexWrap: 'wrap' }}>
                {serien.map((a) => <BadgeBild key={a.ab} slug={`serie-${a.ab}`} icon={a.icon} name={a.name} size={40} />)}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Serien: {serien.map((a) => a.name).join(' · ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Steckbrief (1a) bzw. leer (2f) ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>so sehen dich die Spezln</span>}>Steckbrief</HoamTitel>
        {leer ? (
          <div style={{ ...karteStil, padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '14px 0', textAlign: 'center' }}>
              <IdentificationCard size={34} color="var(--ink-200)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-500)' }}>Die Spezln wissen noch nichts über dich.</span>
              <ProfilBearbeiten werte={werte} variante="ausfuellen" anfangsOffen={steckbrief === '1'} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ ...karteStil, padding: '4px 16px 12px' }}>
              <Steckbrief daten={me} logos={config.features.brauereiLogos} mitHerkunft={false} />
            </div>
            <ProfilBearbeiten werte={werte} />
          </>
        )}
      </section>

      {/* ── Einstellungen ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel>Einstellungen</HoamTitel>
        <Einstellungen token={tokenBereich} gaudi={config.features.daniModus} logout={logout} />
      </section>
    </div>
  );
}
