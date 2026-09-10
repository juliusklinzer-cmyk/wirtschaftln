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
  getCheckinsFuerTermin,
  nachtragsfristOffen,
} from '@/lib/queries';
import { PTS, WACKELT_AB_UNENTSCHULDIGT, rechtzeitigAbgestimmt, checkinOffen } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { vergabeWechsel, wechselTexte, AEMTER_INFO, saisonBadges } from '@/lib/badges';
import { datumLang, datumKurz } from '@/lib/format';
import { euro } from '@/lib/format';
import { Card, SectionHeader, Avatar, Icon, KlappenKopf } from '@/components/ds';
import { MEDAILLE } from './spezln/rangliste';
import { AbstimmungsStand } from '@/components/domain/AbstimmungsStand';
import { StreakChip } from '@/components/domain/StreakChip';
import { PushAktivieren } from '@/components/domain/PushAktivieren';
import { WirtshausGfunden } from '@/components/domain/WirtshausGfunden';
import { RichtungsKnopf } from '@/components/domain/RichtungsKnopf';
import { BadgeFeier, type FeierBadge } from '@/components/domain/BadgeFeier';
import { CheckinKarte } from '@/components/domain/CheckinKarte';
import { MeiBewertung } from '@/components/domain/MeiBewertung';
import { bewertungsDaten } from '@/lib/bewertungs-daten';
import { meineBewertung } from './termin/actions';
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
  // Eigener Rang je Kennzahl, für die kleinen Kreise in „So stehst du da"
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
            slug: amt ? amt.slug : (saisonBadges().find((b) => b.key === w.key)?.slug ?? null),
            icon: w.icon,
            name: w.label,
            spruch: wechselTexte(w, anzeigeName(me)).anNeuen,
            infos: amt ? [`Dei Patron: ${amt.patron}`, `Deine Pflichten: ${amt.duties}`] : null,
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
    const zugesagte = alleVotes
      .filter((v) => v.vote.wert === 'zu')
      .map((v) => ({ name: anzeigeName(v.member), photoUrl: v.member.photoUrl, verein: v.member.verein }));
    const ab = alleVotes.filter((v) => v.vote.wert === 'ab').length;
    const offen = Math.max(0, getAktiveMitglieder().length - zugesagte.length - ab);

    // Check-in: am Stammtisch-Tag (ab 2 Stund' vor Beginn) direkt in der Termin-Karte
    const checkin = checkinOffen(termin, nowIso());
    const eingecheckte = checkin
      ? getCheckinsFuerTermin(termin.id).map(({ checkin: c, member: m }) => ({
          name: anzeigeName(m),
          photoUrl: m.photoUrl,
          verein: m.verein,
          platz: c.platz,
          istIch: m.id === me.id,
        }))
      : [];

    hero = (
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: 20, position: 'relative' }}>
          {/* Schnell-Aktionen: Termin in Kalender speichern + Google-Navigation */}
          <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 8 }}>
            <a
              href={`/termin/${termin.id}/ics`}
              aria-label="Termin im Kalender speichern"
              title="Im Kalender speichern"
              style={{
                width: 40, height: 40, flex: 'none', borderRadius: '50%',
                background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)',
                color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <Icon name="calendar" size={19} />
            </a>
            {wirtshaus && (
              <RichtungsKnopf ziel={{ name: wirtshaus.name, adresse: wirtshaus.adresse, lat: wirtshaus.lat, lng: wirtshaus.lng }} />
            )}
          </div>
          <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Nächster Stammtisch</div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, color: 'var(--pergament)', margin: '6px 0 2px', paddingRight: wirtshaus ? 96 : 48 }}>
            {wirtshaus ? wirtshaus.name : planer ? `organisiert von ${anzeigeName(planer)}` : 'Wer reglt’s? Orga is frei!'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(246,240,226,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={15} />
            {wirtshaus?.bezirk ?? 'Wirtshaus wird no g’suacht'} · {datumLang(termin.datum)}, {termin.zeit} Uhr
          </div>

          <AbstimmungsStand
            terminId={termin.id}
            terminDatum={termin.datum}
            meinVote={meinVote}
            zugesagte={zugesagte}
            abgesagt={ab}
            offen={offen}
          />

          {/* Wer is scho da? Der Erste checkt ein (+1 WP) und sagt, wo ihr hockts */}
          {checkin && <CheckinKarte terminId={termin.id} eingecheckte={eingecheckte} />}
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
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {letzterFuerFeier && feiern.length > 0 && <BadgeFeier terminId={letzterFuerFeier.id} feiern={feiern} />}
      {hero}

      {wackelt && (
        <Card tone="white" pad={16} style={{ background: 'var(--strafe-bg)', border: '1px solid rgba(192,57,43,0.28)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--strafe)' }}>Du wackelst!</div>
              <div style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 600, marginTop: 2 }}>
                {meineStats!.unentschuldigtStreak}× unentschuldigt gfehlt, dafür is a Strafrunde fällig. Beim nächsten Stammtisch wieder dabei sein!
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
                  Runde per PayPal zahlen
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
        <Card tone="white" pad={14} style={{ background: 'var(--strafe-bg)', border: '1px solid rgba(192,57,43,0.28)' }}>
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
                    {', '}
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

      <SectionHeader eyebrow="Deine Saison" title="So stehst du da" fraktur style={{ marginTop: 8 }} />
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
                ? 'Koa Abend verpasst, weiter so.'
                : wackelt
                  ? '3× unentschuldigt gfehlt, du wackelst.'
                  : 'Beim nächsten Stammtisch wieder dabei sein!'}
            </span>
          </div>
        )}
      </Card>

      <SectionHeader
        eyebrow="Rangliste · Wirtschaftln-Punkte"
        title="D’Spezln"
        fraktur
        style={{ marginTop: 8 }}
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
            No koane Punkte dokumentiert, des ändert sich beim nächsten Stammtisch.
          </div>
        )}
      </Card>

      <PushAktivieren />

      {/* Wirtshaus gfunden, darf jeder: landet als offener Pin auf der Karte.
          Als Klappe, damit das Formular d'Startseite ned in d'Länge zieht. */}
      <details
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <KlappenKopf
          chip={
            <span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'var(--pergament)', color: 'var(--gold-700)' }}>
              +{PTS.vorschlag} WP
            </span>
          }
        >
          Wirtshaus gfunden?
        </KlappenKopf>
        <div style={{ padding: '4px 18px 18px' }}>
          <WirtshausGfunden bekannte={getBekannteWirtshaeuser()} />
        </div>
      </details>

      {/* Umfragen: neue starten + scho beantwortete mit Ergebnis */}
      <SectionHeader eyebrow="Vom Stammtisch" title="Umfragen" fraktur style={{ marginTop: 8 }} />
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
  // deshalb nicht zur Abend-Ausbeute, hier rausgerechnet.
  const delta = nach.punkte - vor.punkte - (nach.abstimmBonus - vor.abstimmBonus);

  const rangVon = (liste: MitgliedStats[]) =>
    [...liste].sort((a, b) => b.punkte - a.punkte).findIndex((s) => s.member.id === meId) + 1;
  const rangVor = rangVon(statsVorher);
  const rangNach = rangVon(stats);

  // Punkte-Herkunft aus diesem Abend, Differenz der fest verbuchten Bestandteile
  const besuche = getBesucheFuerTermin(letzter.id);
  const meinBesuch = besuche.find((b) => b.memberId === meId);
  const dabei = !!meinBesuch?.anwesend;
  // Mei Bewertung direkt in der Karte: Knopf solange no ned bewertet,
  // danach die eigene Wertung samt Team-Schnitt (7-Tage-Fenster)
  const bewertung = bewertungsDaten(besuche, meId);
  const bewertungsFenster = nachtragsfristOffen(letzter.abgeschlossenAm);
  const meineRunden = getKasseFuerTermin(letzter.id).filter(
    (k) => k.kind === 'runde' && k.memberId === meId && k.status !== 'aufgehoben',
  ).length;
  const serienDelta = nach.serienBonus - vor.serienBonus;
  const fehlDelta = nach.fehlMalus - vor.fehlMalus;
  const bewertungDelta = nach.bewertungsBonus - vor.bewertungsBonus;
  const textDelta = nach.textBonus - vor.textBonus;
  const checkinDelta = nach.checkinBonus - vor.checkinBonus;
  const vorschlagDelta = nach.vorschlagPunkte - vor.vorschlagPunkte;
  const orgaDelta = nach.orgaSumme - vor.orgaSumme;
  const posten: Array<[string, string, number]> = [];
  if (dabei) posten.push(['🎟️', 'Dabei', PTS.teilnahme]);
  if (checkinDelta !== 0) posten.push(['🪑', 'Als Erster eingecheckt', checkinDelta]);
  if (dabei && meinBesuch!.hoiben > 0) posten.push(['🍺', `${meinBesuch!.hoiben} Hoibe`, meinBesuch!.hoiben * PTS.hoibe]);
  if (dabei && meinBesuch!.taxi) posten.push(['🚕', 'Gfahren', PTS.taxi]);
  if (letzter.planerId === meId) posten.push(['📋', 'Organisiert', orgaDelta]);
  if (letzter.abgeschlossenVon === meId) posten.push(['✅', 'Abgschlossen', PTS.abschluss]);
  if (meineRunden > 0) posten.push(['🍻', meineRunden === 1 ? 'Runde gschmissen' : `${meineRunden} Runden`, meineRunden * PTS.runde]);
  if (bewertungDelta !== 0) posten.push(['⭐', 'Abend bewertet', bewertungDelta]);
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
      <SectionHeader eyebrow="Letzter Stammtisch" title="So is’ glaufen" fraktur style={{ marginTop: 8 }} />
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {/* Wirtshaus-Kopf mit Foto, kompakt gedeckelt, damit d'Zusammenfassung
            auf der Startseite ned den halben Schirm frisst */}
        <div style={{ position: 'relative', background: 'var(--grad-navy)' }}>
          {wirtshaus?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wirtshaus.photoUrl} alt={wirtshaus.name} style={{ width: '100%', height: 'auto', maxHeight: 150, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ height: 84 }} />
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

        <div style={{ padding: '12px 14px 14px' }}>
          {/* Ausbeute & Rang als Kacheln */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: '8px 8px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
              <div className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: delta >= 0 ? 'var(--muc-blau)' : 'var(--strafe)' }}>
                {delta >= 0 ? '+' : ''}{delta} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)' }}>WP</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>
                {dabei ? 'Dei Ausbeute' : 'Du warst ned dabei'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 8px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
              <div className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
                {rangVor} → {rangNach}{' '}
                <span style={{ fontSize: 13, color: rangNach < rangVor ? 'var(--erfolg)' : rangNach > rangVor ? 'var(--strafe)' : 'var(--ink-300)' }}>
                  {rangNach < rangVor ? `▲${rangVor - rangNach}` : rangNach > rangVor ? `▼${rangNach - rangVor}` : '='}
                </span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>
                Dei Rang
              </div>
            </div>
          </div>

          {/* Mei Bewertung zum Abend: Knopf, Bestätigung, danach die eigene
              Wertung in der Karte, solange das 7-Tage-Fenster offen is.
              Danach bleibt die abgegebene Wertung als stille Zeile stehen. */}
          {dabei && bewertungsFenster && (
            <div style={{ marginTop: 10 }}>
              <MeiBewertung
                variante="eingebettet"
                wirtshausName={wirtshaus?.name ?? null}
                initial={bewertung.initial}
                team={bewertung.team}
                action={meineBewertung.bind(null, letzter.id)}
              />
            </div>
          )}
          {dabei && !bewertungsFenster && bewertung.initial.sterne != null && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--pergament)' }}>
              <span style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                Dei Wertung
              </span>
              <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
                {bewertung.initial.sterne.toFixed(1).replace('.', ',')} <span style={{ color: 'var(--gold)' }}>★</span>
                {bewertung.team.anzahl > 1 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}> · Team Ø {bewertung.team.schnitt.toFixed(1).replace('.', ',')}</span>
                )}
              </span>
            </div>
          )}

          {posten.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {posten.map(([icon, label, wp]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'var(--weiss)', border: '1px solid var(--pergament-edge)', fontSize: 11, fontWeight: 700, color: 'var(--ink-700)' }}>
                  {icon} {label}
                  <span className="wn-tnum" style={{ fontWeight: 800, color: wp >= 0 ? 'var(--gold-700)' : 'var(--strafe)' }}>
                    {wp >= 0 ? '+' : ''}{wp}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Badge-/Amt-Wechsel: zugeklappt hinter „Mehr anzeigen", damit die
              Karte kompakt bleibt, wer's wissen will, klappt auf */}
          {wechsel.length > 0 && (
            <details style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--ink-100)' }}>
              <summary style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', listStyle: 'none', userSelect: 'none', padding: '4px 0' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>
                  {wechsel.length} {wechsel.length === 1 ? 'Badge/Amt is' : 'Badges & Ämter san'} gwandert
                </span>
                <span className="wn-klappe-pfeil" style={{ flex: 'none', display: 'inline-flex', color: 'var(--ink-300)' }}>
                  <Icon name="chevron" size={15} />
                </span>
              </summary>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wechsel.map((w) => (
                  <div key={w.key} style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.45 }}>
                    {wechselTexte(w, nameVon(w.neuId)).anAlle}
                    {w.altId && <span style={{ fontWeight: 600, color: 'var(--ink-500)' }}> (vorher {nameVon(w.altId)})</span>}
                  </div>
                ))}
              </div>
            </details>
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
        // Die eigene Zeile im B-Stil: Navy-Gold statt Badge, unübersehbar
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
  // Pergament-Kachel wie im Spezl-Detail, oben rechts der eigene Rang in der Kennzahl
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
