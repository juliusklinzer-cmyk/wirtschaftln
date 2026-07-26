import Link from 'next/link';
import { anzeigeName } from '@/lib/namen';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import {
  getAktuellerTermin,
  getTerminMitWirtshaus,
  getVotesFuerTermin,
  getStats,
  getOffeneStrafen,
  getLetzterAbgeschlossenerTermin,
  getBesucheFuerTermin,
  getKasseFuerTermin,
  getVergabeStand,
  getAktiveMitglieder,
  getUmfragen,
  type MitgliedStats,
  getBekannteWirtshaeuser,
} from '@/lib/queries';
import { PTS, WACKELT_AB_UNENTSCHULDIGT, rechtzeitigAbgestimmt } from '@/lib/punkte';
import { vergabeWechsel, wechselTexte, AEMTER_INFO } from '@/lib/badges';
import { datumLang, datumKurz } from '@/lib/format';
import { euro } from '@/lib/format';
import { Card, SectionHeader, Avatar, Icon } from '@/components/ds';
import { MEDAILLE } from './spezln/rangliste';
import { VotePills } from '@/components/domain/VotePills';
import { StreakChip } from '@/components/domain/StreakChip';
import { PushAktivieren } from '@/components/domain/PushAktivieren';
import { WirtshausGfunden } from '@/components/domain/WirtshausGfunden';
import { BadgeFeier, type FeierBadge } from '@/components/domain/BadgeFeier';
import { UmfrageKarte } from '@/components/domain/UmfrageKarte';
import { UmfrageNeu } from '@/components/domain/UmfrageNeu';

const PAYPAL_POOL_URL = process.env.NEXT_PUBLIC_PAYPAL_POOL_URL;

export default async function HomePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const stats = getStats();
  const meineStats = stats.find((s) => s.member.id === me.id);
  const rangliste = [...stats].sort((a, b) => b.punkte - a.punkte);
  const top3 = rangliste.slice(0, 3);
  const meinRang = rangliste.findIndex((s) => s.member.id === me.id) + 1;
  const inTop3 = meinRang >= 1 && meinRang <= 3;
  const termin = getAktuellerTermin();
  const meineStrafen = getOffeneStrafen().filter((s) => s.eintrag.memberId === me.id);
  const strafSumme = meineStrafen.reduce((sum, s) => sum + Math.abs(s.eintrag.betragCents), 0);
  const wackelt = (meineStats?.unentschuldigtStreak ?? 0) >= WACKELT_AB_UNENTSCHULDIGT;
  // Eigener Rang je Kennzahl — für die kleinen Kreise in „So stehst du da"
  const meinRangIn = (feld: 'punkte' | 'hoiben' | 'wirtshaeuser') =>
    [...stats].sort((a, b) => b[feld] - a[feld]).findIndex((s) => s.member.id === me.id) + 1;

  // Umfragen: offene (no ned abgstimmt) stehen prominent über „Deine Saison",
  // scho beantwortete rutschen mit Ergebnis ans Seitenende.
  const alleUmfragen = getUmfragen();
  const offeneUmfragen = alleUmfragen.filter((u) => !u.stimmen.some((s) => s.memberId === me.id));
  const beantworteteUmfragen = alleUmfragen.filter((u) => u.stimmen.some((s) => s.memberId === me.id));

  // Neues Badge/Amt durch den letzten Stammtisch? → große Feier beim Öffnen (einmalig pro Gerät).
  // Bei Ämtern: Patron-Grafik groß, Patron + Pflichten drunter, und wer abglöst wurde.
  const letzterFuerFeier = getLetzterAbgeschlossenerTermin();
  const AMT_TITEL: Record<string, string> = { 'amt:praesident': 'Präsident', 'amt:schriftfuehrer': 'Schriftführer', 'amt:kassenwart': 'Kassenwart' };
  const feierMitglieder = letzterFuerFeier ? getAktiveMitglieder() : [];
  const feierName = (id: string | null) => {
    const m = feierMitglieder.find((x) => x.id === id);
    return m ? (anzeigeName(m)) : null;
  };
  const feiern: FeierBadge[] = letzterFuerFeier
    ? vergabeWechsel(getVergabeStand(letzterFuerFeier.id), getVergabeStand())
        .filter((w) => w.neuId === me.id)
        .map((w) => {
          const amt = AMT_TITEL[w.key] ? AEMTER_INFO[AMT_TITEL[w.key]] : null;
          return {
            key: w.key,
            slug: amt ? amt.slug : w.key.startsWith('amt:') ? null : w.key,
            icon: w.icon,
            name: w.label,
            spruch: wechselTexte(w, anzeigeName(me)).anNeuen,
            infos: amt ? [`⚜️ Dei Patron: ${amt.patron}`, `📜 Deine Pflichten: ${amt.duties}`] : null,
            vorherName: feierName(w.altId),
          };
        })
    : [];

  let hero: React.ReactNode;
  if (termin) {
    const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
    const alleVotes = getVotesFuerTermin(termin.id);
    const meinVoteRow = alleVotes.find((v) => v.vote.memberId === me.id)?.vote ?? null;
    const meinVote = meinVoteRow?.wert ?? null;
    const zu = alleVotes.filter((v) => v.vote.wert === 'zu').length;
    const ab = alleVotes.filter((v) => v.vote.wert === 'ab').length;

    hero = (
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: 20 }}>
          <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Nächster Stammtisch</div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, color: 'var(--pergament)', margin: '6px 0 2px' }}>
            {wirtshaus ? wirtshaus.name : `organisiert von ${(planer ? anzeigeName(planer) : '—')}`}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(246,240,226,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={15} />
            {wirtshaus?.bezirk ?? 'Wirtshaus wird no g’suacht'} · {datumLang(termin.datum)}, {termin.zeit} Uhr
          </div>

          <div style={{ margin: '16px 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)' }}>
            Hast du Zeit?
          </div>
          <VotePills
            terminId={termin.id}
            current={meinVote}
            terminDatum={termin.datum}
            links={<>✅ {zu} zugesagt · ❌ {ab} abgesagt</>}
            onDark
          />
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
      {letzterFuerFeier && feiern.length > 0 && <BadgeFeier terminId={letzterFuerFeier.id} feiern={feiern} />}
      {hero}

      {wackelt && (
        <Card tone="white" pad={16} style={{ borderLeft: '4px solid var(--strafe)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--strafe)' }}>Du wackelst!</div>
              <div style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 600, marginTop: 2 }}>
                {meineStats!.unentschuldigtStreak}× unentschuldigt gfehlt — dafür is a Strafrunde fällig. Beim nächsten Stammtisch wieder dabei sein!
              </div>
              {PAYPAL_POOL_URL && (
                <a
                  href={PAYPAL_POOL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
                    padding: '10px 18px', minHeight: 40, borderRadius: 'var(--r-md)',
                    background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)',
                    fontSize: 14, fontWeight: 800, color: 'var(--navy-900)', textDecoration: 'none',
                  }}
                >
                  🍺 Runde per PayPal zahlen
                </a>
              )}
              <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600, marginTop: 8 }}>
                … oder bar beim Kassenwart.
              </div>
            </div>
          </div>
        </Card>
      )}

      {strafSumme > 0 && (
        <Card tone="white" pad={14} style={{ borderLeft: '4px solid var(--strafe)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--strafe)' }}>
                {meineStrafen.length} offene {meineStrafen.length === 1 ? 'Strafe' : 'Strafen'} · {euro(strafSumme)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>
                Bitte bis zum nächsten Stammtisch begleichen
                {PAYPAL_POOL_URL ? (
                  <>
                    {' — '}
                    <a href={PAYPAL_POOL_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muc-blau)', fontWeight: 800 }}>
                      per PayPal
                    </a>
                    {' oder bar beim Kassenwart.'}
                  </>
                ) : (
                  '.'
                )}
              </div>
            </div>
            <Link href="/kasse" style={{ color: 'var(--muc-blau)', display: 'inline-flex' }}>
              <Icon name="chevron" size={18} />
            </Link>
          </div>
        </Card>
      )}

      <LetzterStammtisch meId={me.id} stats={stats} />

      {offeneUmfragen.length > 0 && (
        <>
          <SectionHeader eyebrow="Umfrage" title="Dei Stimm’ zählt" fraktur />
          {offeneUmfragen.map((u) => (
            <UmfrageKarte key={u.umfrage.id} daten={u} meId={me.id} meRole={me.role} />
          ))}
        </>
      )}

      <SectionHeader eyebrow="Deine Saison" title="So stehst du da" fraktur />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <StatBlock value={meineStats?.punkte ?? 0} label="Punkte" icon="🏆" rang={meinRangIn('punkte')} />
          <StatBlock value={meineStats?.hoiben ?? 0} label="Hoibe" icon="🍺" rang={meinRangIn('hoiben')} />
          <StatBlock value={meineStats?.wirtshaeuser ?? 0} label="Wirtshäuser" icon="🏠" rang={meinRangIn('wirtshaeuser')} />
        </div>
        {meineStats && meineStats.streak !== 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ink-100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StreakChip streak={meineStats.streak} bestStreak={meineStats.bestStreak} wackelt={wackelt} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
              {meineStats.streak > 0
                ? 'Koa Abend verpasst — weiter so.'
                : wackelt
                  ? '3× unentschuldigt gfehlt — du wackelst.'
                  : 'Beim nächsten Stammtisch wieder dabei sein!'}
            </span>
          </div>
        )}
      </Card>

      <SectionHeader
        eyebrow="Rangliste · Wirtschaftln-Punkte"
        title="D’Spezln"
        fraktur
        action={
          <Link href="/spezln" style={{ fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>
            Alle →
          </Link>
        }
      />
      <Card pad={12}>
        {top3.map((s, i) => (
          <RankRow key={s.member.id} s={s} rang={i + 1} istIch={s.member.id === me.id} letzte={i === top3.length - 1 && (inTop3 || meinRang === 0)} />
        ))}
        {!inTop3 && meinRang > 0 && meineStats && (
          <>
            <div style={{ textAlign: 'center', color: 'var(--ink-300)', fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', padding: '2px 0' }}>
              ···
            </div>
            <RankRow s={meineStats} rang={meinRang} istIch letzte />
          </>
        )}
        {top3.every((s) => s.punkte === 0) && (
          <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            No koane Punkte dokumentiert — des ändert sich beim nächsten Stammtisch. 🍺
          </div>
        )}
      </Card>

      <PushAktivieren />

      {/* Wirtshaus gfunden — darf jeder: landet als offener Pin auf der Karte */}
      <SectionHeader eyebrow="Für’s nächste Mal" title="Wirtshaus gfunden?" fraktur />
      <Card>
        <WirtshausGfunden bekannte={getBekannteWirtshaeuser()} />
      </Card>

      {/* Umfragen: neue starten + scho beantwortete mit Ergebnis */}
      <SectionHeader eyebrow="Vom Stammtisch" title="Umfragen" fraktur />
      <UmfrageNeu />
      {beantworteteUmfragen.map((u) => (
        <UmfrageKarte key={u.umfrage.id} daten={u} meId={me.id} meRole={me.role} />
      ))}
    </div>
  );
}

/**
 * Letzter Stammtisch: woher die neuen WP kommen, wie sich der eigene Rang
 * verändert hat und wer wem ein Badge/Amt abgluchst hat.
 */
function LetzterStammtisch({ meId, stats }: { meId: string; stats: MitgliedStats[] }) {
  const letzter = getLetzterAbgeschlossenerTermin();
  if (!letzter) return null;
  const { wirtshaus } = getTerminMitWirtshaus(letzter);
  const statsVorher = getStats({ ohneTerminId: letzter.id });

  const vor = statsVorher.find((s) => s.member.id === meId);
  const nach = stats.find((s) => s.member.id === meId);
  if (!vor || !nach) return null;
  // Abstimm-Bonus zählt LIVE beim Voten (Punkteflug + Header-Pill) und gehört
  // deshalb nicht zur Abend-Ausbeute — hier rausgerechnet.
  const delta = nach.punkte - vor.punkte - (nach.abstimmBonus - vor.abstimmBonus);

  const rangVon = (liste: MitgliedStats[]) =>
    [...liste].sort((a, b) => b.punkte - a.punkte).findIndex((s) => s.member.id === meId) + 1;
  const rangVor = rangVon(statsVorher);
  const rangNach = rangVon(stats);

  // Punkte-Herkunft aus diesem Abend — Differenz der fest verbuchten Bestandteile
  const meinBesuch = getBesucheFuerTermin(letzter.id).find((b) => b.memberId === meId);
  const dabei = !!meinBesuch?.anwesend;
  const meineRunden = getKasseFuerTermin(letzter.id).filter(
    (k) => k.kind === 'runde' && k.memberId === meId && k.status !== 'aufgehoben',
  ).length;
  const serienDelta = nach.serienBonus - vor.serienBonus;
  const fehlDelta = nach.fehlMalus - vor.fehlMalus;
  const textDelta = nach.textBonus - vor.textBonus;
  const vorschlagDelta = nach.vorschlagPunkte - vor.vorschlagPunkte;
  const orgaDelta = nach.orgaSumme - vor.orgaSumme;
  const posten: Array<[string, string, number]> = [];
  if (dabei) posten.push(['🎟️', 'Dabei', PTS.teilnahme]);
  if (dabei && meinBesuch!.hoiben > 0) posten.push(['🍺', `${meinBesuch!.hoiben} Hoibe`, meinBesuch!.hoiben * PTS.hoibe]);
  if (dabei && meinBesuch!.taxi) posten.push(['🚕', 'Gfahren', PTS.taxi]);
  if (letzter.planerId === meId) posten.push(['📋', 'Organisiert', orgaDelta]);
  if (letzter.abgeschlossenVon === meId) posten.push(['✅', 'Abgschlossen', PTS.abschluss]);
  if (meineRunden > 0) posten.push(['🍻', meineRunden === 1 ? 'Runde gschmissen' : `${meineRunden} Runden`, meineRunden * PTS.runde]);
  if (textDelta !== 0) posten.push(['✍️', 'Bewertung gschrieben', textDelta]);
  if (vorschlagDelta !== 0) posten.push(['📍', 'Dei Wirtshaus-Vorschlag', vorschlagDelta]);
  if (serienDelta !== 0) posten.push(['🔥', 'Serien-Bonus', serienDelta]);
  if (fehlDelta !== 0) posten.push(['🥶', 'Gfehlt', fehlDelta]);

  // Badge-/Amt-Wechsel durch diesen Abend
  const mitglieder = getAktiveMitglieder();
  const nameVon = (id: string) => {
    const m = mitglieder.find((x) => x.id === id);
    return (m ? anzeigeName(m) : '—');
  };
  const wechsel = vergabeWechsel(getVergabeStand(letzter.id), getVergabeStand());

  return (
    <>
      <SectionHeader eyebrow="Letzter Stammtisch" title="So is’ glaufen" fraktur />
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {/* Wirtshaus-Kopf mit Foto (wie im Archiv-Detail) */}
        <div style={{ position: 'relative', height: 96, background: 'var(--grad-navy)' }}>
          {wirtshaus?.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wirtshaus.photoUrl} alt={wirtshaus.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,25,58,0.05) 20%, rgba(7,25,58,0.82) 100%)' }} />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--gold-bright)', lineHeight: 1.1, textShadow: '0 1px 4px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {wirtshaus?.name ?? 'Stammtisch'}
              </div>
              {wirtshaus?.bezirk && (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pergament)', opacity: 0.85, marginTop: 2 }}>{wirtshaus.bezirk}</div>
              )}
            </div>
            <span className="wn-tnum" style={{ flex: 'none', fontSize: 11, fontWeight: 800, color: 'var(--pergament)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '3px 10px' }}>
              {datumKurz(letzter.datum)}
            </span>
          </div>
        </div>

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Ausbeute & Rang als Kacheln */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
              <div className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: delta >= 0 ? 'var(--muc-blau)' : 'var(--strafe)' }}>
                {delta >= 0 ? '+' : ''}{delta} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-700)' }}>WP</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 5 }}>
                {dabei ? 'Dei Ausbeute' : 'Du warst ned dabei'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
              <div className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
                {rangVor} → {rangNach}{' '}
                <span style={{ fontSize: 14, color: rangNach < rangVor ? 'var(--erfolg)' : rangNach > rangVor ? 'var(--strafe)' : 'var(--ink-300)' }}>
                  {rangNach < rangVor ? `▲${rangVor - rangNach}` : rangNach > rangVor ? `▼${rangNach - rangVor}` : '='}
                </span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 5 }}>
                Dei Rang
              </div>
            </div>
          </div>

          {posten.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {posten.map(([icon, label, wp]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'var(--weiss)', border: '1px solid var(--pergament-edge)', fontSize: 12, fontWeight: 700, color: 'var(--ink-700)' }}>
                  {icon} {label}
                  <span className="wn-tnum" style={{ fontWeight: 800, color: wp >= 0 ? 'var(--gold-700)' : 'var(--strafe)' }}>
                    {wp >= 0 ? '+' : ''}{wp}
                  </span>
                </span>
              ))}
            </div>
          )}

          {wechsel.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ink-100)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>
                Badges & Ämter gwandert
              </div>
              {wechsel.map((w) => (
                <div key={w.key} style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.45 }}>
                  {wechselTexte(w, nameVon(w.neuId)).anAlle}
                  {w.altId && <span style={{ fontWeight: 600, color: 'var(--ink-500)' }}> (vorher {nameVon(w.altId)})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function RankRow({ s, rang, istIch, letzte }: { s: MitgliedStats; rang: number; istIch: boolean; letzte: boolean }) {
  const medal = MEDAILLE[rang];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: istIch ? '9px 10px' : '9px 8px',
        borderBottom: !istIch && !letzte ? '1px solid var(--ink-100)' : 'none',
        // Die eigene Zeile im B-Stil: Navy-Gold statt Badge — unübersehbar
        border: istIch ? '1.5px solid var(--gold)' : undefined,
        borderRadius: istIch ? 'var(--r-md)' : undefined,
        background: istIch ? 'var(--grad-navy)' : 'transparent',
        margin: istIch ? '2px 0' : undefined,
        boxShadow: istIch ? 'var(--sh-sm)' : undefined,
      }}
    >
      <span style={{ width: 26, flex: 'none', display: 'inline-flex', justifyContent: 'center' }}>
        {medal ? (
          <span className="wn-tnum" style={{ width: 24, height: 24, borderRadius: '50%', background: medal.disc, color: medal.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, boxShadow: 'var(--sh-xs)' }}>
            {rang}
          </span>
        ) : (
          <span className="wn-tnum" style={{ fontWeight: 800, fontSize: 14, color: istIch ? 'rgba(246,240,226,0.6)' : 'var(--ink-300)' }}>{rang}</span>
        )}
      </span>
      <Avatar src={s.member.photoUrl} name={s.member.name} size={36} ring={rang === 1} verein={s.member.verein} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: istIch ? 'var(--pergament)' : 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {anzeigeName(s.member)}
        </span>
        {s.streak !== 0 && <StreakChip streak={s.streak} size="sm" wackelt={s.unentschuldigtStreak >= WACKELT_AB_UNENTSCHULDIGT} />}
      </span>
      <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: istIch ? 'var(--gold-bright)' : 'var(--muc-blau)', whiteSpace: 'nowrap' }}>
        {s.punkte} <span style={{ fontSize: 11, fontWeight: 700, color: istIch ? 'var(--gold)' : 'var(--ink-500)' }}>WP</span>
      </span>
    </div>
  );
}

function StatBlock({ value, label, icon, rang }: { value: number; label: string; icon: string; rang?: number }) {
  const medal = rang ? MEDAILLE[rang] : undefined;
  // Pergament-Kachel wie im Spezl-Detail — oben rechts der eigene Rang in der Kennzahl
  // (unten rechts hat er das Kennzahl-Label verdeckt)
  return (
    <div style={{ position: 'relative', textAlign: 'center', padding: '12px 4px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--navy)', lineHeight: 1.1, marginTop: 3 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 3 }}>
        {label}
      </div>
      {rang != null && rang > 0 && (
        <span
          className="wn-tnum"
          title={`Platz ${rang} bei ${label}`}
          style={{
            position: 'absolute', right: 5, top: 5, width: 20, height: 20, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800,
            background: medal ? medal.disc : 'var(--weiss)',
            color: medal ? medal.fg : 'var(--ink-500)',
            border: medal ? 'none' : '1px solid var(--pergament-edge)',
            boxShadow: 'var(--sh-xs)',
          }}
        >
          {rang}
        </span>
      )}
    </div>
  );
}
