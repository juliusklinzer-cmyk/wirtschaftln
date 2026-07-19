import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { anzeigeName, urkundenName } from '@/lib/namen';
import { getStats, getAemter, getArchiv } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';
import { saisonBadgesVergeben, serienAbzeichen, amtInfo, AEMTER_INFO } from '@/lib/badges';
import { Avatar, Card, SectionHeader } from '@/components/ds';
import { StreakChip } from '@/components/domain/StreakChip';
import { Steckbrief, steckbriefLeer } from '@/components/domain/Steckbrief';
import { BadgeBild, SerienLeiste } from '@/components/domain/BadgeBild';
import { ProfilBearbeiten } from './profil-bearbeiten';
import { DaniModusSchalter } from '@/components/domain/DaniModus';

export const metadata = { title: 'Mei Profil · Wirtschaftln' };

export default async function ProfilPage() {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  const saison = aktuelleSaison();
  const statsSaison = getStats({ abDatum: saison.start });
  const statsAllzeit = getStats();
  const meineSaison = statsSaison.find((s) => s.member.id === me.id);
  const meineAllzeit = statsAllzeit.find((s) => s.member.id === me.id);

  // Aktuelles Amt (Präsident/Schriftführer automatisch, Rest aus der DB)
  const praesident = [...statsSaison].sort((a, b) => b.punkte - a.punkte)[0]?.member;
  const fleissigster = [...statsSaison].sort((a, b) => b.abschluesse - a.abschluesse)[0];
  let amt: { titel: string; icon: string } | null = null;
  if (praesident?.id === me.id) amt = { titel: 'Präsident', icon: AEMTER_INFO['Präsident'].icon };
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

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {me.erstanmeldung && (
        <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
          <div style={{ padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, color: 'var(--gold-bright)', lineHeight: 1.1 }}>
              Servus beim Wirtschaftln!
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(246,240,226,0.85)', marginTop: 8, lineHeight: 1.5 }}>
              Bevor’s losgeht: Setz dir dei eigenes Passwort und stell di kurz vor — damit d’Spezln wissen, wen’s vor sich ham. 🍺
            </div>
          </div>
        </Card>
      )}

      {/* ── Urkunden-Kopf: wie im Spezl-Detail der Rangliste ── */}
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <style>{`
          @keyframes wnFederPop { 0% { transform: scale(0.4); opacity: 0; } 62% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
        <div style={{ background: 'var(--grad-navy)', paddingBottom: 18 }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 0' }}>
            <div style={{ position: 'relative', animation: 'wnFederPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              <Avatar src={me.photoUrl} name={anzeigeName(me)} size={88} ring={rang === 1} verein={me.verein} />
              {me.verein ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.verein === 'bayern' ? '/brand/vereine/fcb.png' : '/brand/vereine/1860.png'} alt="" style={{ position: 'absolute', left: -4, bottom: 2, width: 24, height: 24, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 2, boxShadow: 'var(--sh-sm)' }} />
              ) : (
                // Freund des Fußball: statt Vereinslogo gibt's die Brezn
                <span title="Freund des Fußball" style={{ position: 'absolute', left: -4, bottom: 2, width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: '#fff', borderRadius: '50%', boxShadow: 'var(--sh-sm)' }}>
                  🥨
                </span>
              )}
              {rang > 0 && (
                <span
                  className="wn-tnum"
                  style={{
                    position: 'absolute', right: -6, bottom: 0, width: 30, height: 30, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, border: '2px solid var(--navy-900)',
                    background: rang <= 3 ? 'var(--grad-gold)' : 'var(--weiss)',
                    color: 'var(--navy)', boxShadow: 'var(--sh-sm)',
                  }}
                >
                  {rang}
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 32, color: 'var(--gold-bright)', lineHeight: 1.1, marginTop: 12, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {anzeigeName(me)}
            </div>
            {urkundenName(me) && urkundenName(me) !== anzeigeName(me) && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pergament)', opacity: 0.85, marginTop: 4 }}>
                {urkundenName(me)}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.85, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {amt ? `${amt.icon} ${amt.titel}` : 'Mitglied'}
              {me.herkunft && <span>· 📍 {me.herkunft}</span>}
              {me.schafkopfer && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/vereine/eichel.png" alt="Schafkopfer" title="Schafkopfer" style={{ width: 15, height: 15, objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12, animation: 'wnFederPop 500ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              <span className="wn-tnum" style={{ fontSize: 44, fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1 }}>{meineSaison?.punkte ?? 0}</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginLeft: 6 }}>WP</span>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.6, marginTop: 4 }}>
                {saison.label}{rang > 0 && ` · Platz ${rang}`}
              </div>
            </div>
            {(meineAllzeit?.streak ?? 0) !== 0 && (
              <div style={{ marginTop: 10 }}>
                <StreakChip streak={meineAllzeit!.streak} bestStreak={meineAllzeit!.bestStreak} wackelt={(meineAllzeit?.unentschuldigtStreak ?? 0) >= 3} />
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      </Card>

      {/* ── D'Auszeichnungen: große Grafiken, koa Text — Details stehen im Badge ── */}
      {(badges.length > 0 || serien.length > 0) && (
        <Card pad={14}>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', marginBottom: 10 }}>D’Auszeichnungen</div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {badges.map((b) => (
                <span key={b.key} style={{ flex: 'none' }}>
                  <BadgeBild slug={b.key} icon={b.icon} name={`${b.name} — ${b.tag}`} size={92} />
                </span>
              ))}
            </div>
          )}
          {serien.length > 0 && (
            <div style={{ marginTop: badges.length > 0 ? 8 : 0 }}>
              <SerienLeiste serien={[...serien]} size={46} />
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginTop: 8 }}>
            G’schichtl & Pflichten zeigt da Klick auf der Rangliste.
          </div>
        </Card>
      )}

      {!steckbriefLeer(me) && (
        <Card pad={14}>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', marginBottom: 8 }}>Da Steckbrief</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 8 }}>So sehng di d’Spezln:</div>
          <Steckbrief daten={me} />
        </Card>
      )}

      {me.erstanmeldung && <SectionHeader eyebrow="Dei Steckbrief" title="Stell di vor" fraktur />}
      <ProfilBearbeiten
        werte={{
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
          beschreibung: me.beschreibung,
          erstanmeldung: me.erstanmeldung,
        }}
      />

      {/* 🤳 Gaudi-Ecke */}
      {!me.erstanmeldung && (
        <Card pad={14}>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)', marginBottom: 10 }}>D’Gaudi</div>
          <DaniModusSchalter />
        </Card>
      )}
    </div>
  );
}
