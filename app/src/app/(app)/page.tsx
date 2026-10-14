import Link from 'next/link';
import { anzeigeName, urkundenName } from '@/lib/namen';
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
  getWirtshausById,
} from '@/lib/queries';
import { PTS, WACKELT_AB_UNENTSCHULDIGT, checkinOffen, bierdeckelOffen, abschlussOffen, berlinTag } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { aktuelleSaison } from '@/lib/saison';
import { vergabeWechsel, wechselTexte, AEMTER_INFO, saisonBadges, feierTexte } from '@/lib/badges';
import { SERIEN_ABZEICHEN } from '@/lib/serien';
import { datumMittel, datumKurz, euro } from '@/lib/format';
import { Card, Avatar, Icon, KlappenKopf } from '@/components/ds';
import { AbstimmungsStand } from '@/components/domain/AbstimmungsStand';
import { StreakChip } from '@/components/domain/StreakChip';
import { PushAktivieren } from '@/components/domain/PushAktivieren';
import { AppInstallieren } from '@/components/domain/AppInstallieren';
import { WirtshausGfunden } from '@/components/domain/WirtshausGfunden';
import { tenantConfig } from '@/lib/tenant-config';
import { RichtungsKnopf } from '@/components/domain/RichtungsKnopf';
import { BadgeFeier, type FeierBadge } from '@/components/domain/BadgeFeier';
import { CheckinKarte } from '@/components/domain/CheckinKarte';
import { MeiBewertung } from '@/components/domain/MeiBewertung';
import { bewertungsDaten } from '@/lib/bewertungs-daten';
import { meineBewertung, orgaSchnappen, wirtshausFestlegen } from './termin/actions';
import { UmfrageKarte } from '@/components/domain/UmfrageKarte';
import { UmfragenBereich } from '@/components/domain/UmfrageNeu';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { OrgaKnopf } from '@/components/domain/OrgaKnopf';
import { VorschlagenKnopf } from '@/components/domain/VorschlagenKnopf';
import { eyebrowStil, titelStil, zeileStil, hinweisStil, goldKnopfStil, rundKnopfStil, blockStil } from '@/components/domain/hero-stil';

// Der PayPal-Pool gehört dem Gründer-Stammtisch (Env, ned pro Mandant):
// andere Stammtische zahlen bar beim Kassenwart, sonst landet ihr Geld bei uns.
const GRUENDER_PAYPAL_URL = process.env.NEXT_PUBLIC_PAYPAL_POOL_URL;

export default async function HomePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const config = tenantConfig();
  const PAYPAL_POOL_URL = config.istGruender ? GRUENDER_PAYPAL_URL : undefined;
  const jetzt = nowIso();
  const heute = berlinTag(jetzt);

  // Punkte & Ränge in der laufenden Saison (wia Header-Pill und Rangliste),
  // Serien übers Ganze (a Serie hört ned am Saisonwechsel auf)
  const saison = aktuelleSaison();
  const stats = getStats({ abDatum: saison.start });
  const allzeit = getStats();
  const meineStats = stats.find((s) => s.member.id === me.id);
  const meineAllzeit = allzeit.find((s) => s.member.id === me.id);
  const rangliste = [...stats].sort((a, b) => b.punkte - a.punkte);
  const meinRang = rangliste.findIndex((s) => s.member.id === me.id) + 1;
  const meineStrafen = getOffeneStrafen().filter((s) => s.eintrag.memberId === me.id);
  const strafSumme = meineStrafen.reduce((sum, s) => sum + Math.abs(s.eintrag.betragCents), 0);
  const unentschuldigt = meineAllzeit?.unentschuldigtStreak ?? 0;
  const wackelt = unentschuldigt >= WACKELT_AB_UNENTSCHULDIGT;
  const termin = getAktuellerTermin();
  const letzter = getLetzterAbgeschlossenerTermin();
  // Stammtisch-Typ „Stammhaus“ (Hoam · Stammhaus 5a–5c): immer dasselbe Wirtshaus, Ausflüge als Ausnahme
  const stammhaus = config.typ === 'stammhaus' && config.stammhausWirtshausId ? getWirtshausById(config.stammhausWirtshausId) : null;

  // Umfragen: offene (no ned abgstimmt) stehen prominent unter der Termin-Karte,
  // scho beantwortete rutschen mit Ergebnis ans Seitenende.
  const alleUmfragen = getUmfragen();
  const offeneUmfragen = alleUmfragen.filter((u) => !u.stimmen.some((s) => s.memberId === me.id));
  const beantworteteUmfragen = alleUmfragen.filter((u) => u.stimmen.some((s) => s.memberId === me.id));

  // Neues Badge, Amt oder Serien-Abzeichen durch den letzten Stammtisch? → Vollbild-Feier beim
  // Öffnen (einmalig pro Gerät). Bei Ämtern: Patron-Grafik groß, Patron + Pflichten drunter, und wer
  // abgelöst wurde. Zu Badges und Ämtern gibt's eine Urkunde zum Teilen (Badge-Feier-Redesign 14.10.2026).
  const AMT_TITEL: Record<string, string> = { 'amt:praesident': 'Präsident', 'amt:schriftfuehrer': 'Schriftführer', 'amt:kassenwart': 'Kassenwart' };
  const mitglieder = getAktiveMitglieder();
  const nameVon = (id: string | null) => {
    const m = mitglieder.find((x) => x.id === id);
    return m ? anzeigeName(m) : null;
  };
  const feiern: FeierBadge[] = [];
  if (letzter) {
    const standVor = getVergabeStand(letzter.id);
    const standNach = getVergabeStand();
    const abendDatum = new Date(`${letzter.datum}T12:00:00`);
    const saisonAbend = aktuelleSaison(abendDatum);
    const urkundeBasis = {
      stammtisch: /stammtisch/i.test(config.name) ? config.name : `Stammtisch ${config.name}`,
      name: urkundenName(me) ?? anzeigeName(me),
      saison: `${saisonAbend.label.includes('Herbst') ? 'Herbst' : 'Frühjahrs'}-Saison ${saisonAbend.jahr}`,
      praesident: nameVon(standNach.get('amt:praesident') ?? null),
      datum: abendDatum.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
      ort: config.stadt,
    };
    for (const w of vergabeWechsel(standVor, standNach)) {
      if (w.neuId !== me.id) continue;
      const amt = AMT_TITEL[w.key] ? AEMTER_INFO[AMT_TITEL[w.key]] : null;
      const badge = saisonBadges().find((b) => b.key === w.key);
      const slug = amt ? amt.slug : (badge?.slug ?? null);
      const texte = feierTexte(w.key, w.label, badge?.tag);
      const artikel = w.label.startsWith('Die ') ? `die neue ${w.label.slice(4)}` : `der neue ${w.label}`;
      const pflichten = amt ? amt.duties.split(' · ').map((t) => t.trim()).filter(Boolean) : [];
      const heiwong = w.key === 'heiwong';
      feiern.push({
        key: w.key,
        art: amt ? 'amt' : 'badge',
        slug,
        icon: w.icon,
        name: w.label,
        titel1: 'Du bist jetzt',
        titel2: `${artikel}!`,
        spruch: texte.spruch,
        infos: amt ? [{ icon: 'patron', text: `Patron: ${amt.patron}` }, ...pflichten.map((t, i) => ({ icon: i === 0 ? ('modus' as const) : ('pflicht' as const), text: t }))] : null,
        vorherName: nameVon(w.altId),
        urkunde: heiwong ? null : { ...urkundeBasis, badgeName: w.label, slug, icon: w.icon, grund: texte.urkundeGrund },
        knopf: heiwong ? 'Passt, i kimm wieder!' : undefined,
      });
    }
    // Serien-Abzeichen: Rekord-Serie vor und nach dem Abend vergleichen, neue Stufen feiern (kleiner, ruhiger)
    const rekordVor = getStats({ ohneTerminId: letzter.id }).find((s) => s.member.id === me.id)?.bestStreak ?? 0;
    const rekordNach = meineAllzeit?.bestStreak ?? 0;
    for (const a of SERIEN_ABZEICHEN) {
      if (rekordNach >= a.ab && rekordVor < a.ab) {
        feiern.push({
          key: `serie-${a.ab}`,
          art: 'serie',
          slug: `serie-${a.ab}`,
          icon: a.icon,
          name: a.name,
          eyebrow: 'Serien-Abzeichen',
          titel1: `${a.name}!`,
          titel2: `${a.ab} Abende in Folge`,
          spruch: 'Dieses Abzeichen bleibt für immer, auch wenn die Serie reißt.',
          knopf: 'Weiter geht’s',
        });
      }
    }
  }

  /* ---------- Termin-Karte: a Karte, alle Phasen (Zustände 2a–2h) ---------- */
  let heroInhalt: React.ReactNode;
  if (!termin) {
    heroInhalt = (
      <>
        <span style={eyebrowStil}>Nächster Stammtisch</span>
        <h2 style={{ ...titelStil, fontSize: 38 }}>Noch nix ausgemacht</h2>
        <span style={zeileStil}>Es gibt no koan Termin. Leg oan an, dann schnappt sich wer den Organisator-Posten.</span>
        <Link href="/termin" className="wn-press" style={goldKnopfStil}>Termin anlegen</Link>
        <span style={hinweisStil}>Organisieren bringt bis zu +{PTS.orgaMax} WP, je nach Sternen fürs Wirtshaus.</span>
      </>
    );
  } else {
    const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
    const alleVotes = getVotesFuerTermin(termin.id);
    const meinVote = alleVotes.find((v) => v.vote.memberId === me.id)?.vote.wert ?? null;
    const zugesagte = alleVotes
      .filter((v) => v.vote.wert === 'zu')
      .map((v) => ({ name: anzeigeName(v.member), photoUrl: v.member.photoUrl, verein: v.member.verein }));
    const ab = alleVotes.filter((v) => v.vote.wert === 'ab').length;
    const offen = Math.max(0, mitglieder.length - zugesagte.length - ab);
    const heuteTag = termin.datum === heute;
    const vorbei = termin.datum < heute;

    const kalenderKnopf = (
      <a href={`/termin/${termin.id}/ics`} aria-label="Termin im Kalender speichern" title="Im Kalender speichern" style={rundKnopfStil}>
        <Icon name="calendar-plus" size={20} />
      </a>
    );

    if (termin.phase === 'planung' && !termin.planerId) {
      /* 2a: Termin steht, Orga frei */
      heroInhalt = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={eyebrowStil}>Nächster Stammtisch</span>
            {kalenderKnopf}
          </div>
          <h2 style={{ ...titelStil, fontSize: 38 }}>Noch nix ausgemacht</h2>
          <span style={zeileStil}>
            {datumMittel(termin.datum)} · {termin.zeit} · Der Organisator-Posten ist frei. Wer zuerst zugreift, plant den Abend.
          </span>
          <OrgaKnopf action={orgaSchnappen.bind(null, termin.id)} gesperrt={letzter?.planerId === me.id} />
          <span style={hinweisStil}>Organisieren bringt bis zu +{PTS.orgaMax} WP, je nach Sternen fürs Wirtshaus.</span>
        </>
      );
    } else if (termin.phase === 'planung') {
      /* 2b: Planung, Wirtshaus wird gesucht */
      const ichPlane = planer?.id === me.id;
      const planerName = planer ? anzeigeName(planer) : 'der Organisator';
      heroInhalt = stammhaus ? (
        /* 5b: Stammhaus steht scho drin, ein Tipp bestätigt den Tisch, oder man trägt einen Ausflug ein */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={eyebrowStil}>{datumMittel(termin.datum)} · {termin.zeit}</span>
            {kalenderKnopf}
          </div>
          <h2 style={{ ...titelStil, fontSize: 36 }}>{ichPlane ? 'Wo geht’s hin?' : `${planerName} reglt’s`}</h2>
          <span style={zeileStil}>{ichPlane ? 'Du organisierst diesmal.' : 'Der Tisch wird noch bestätigt.'}</span>
          {ichPlane && (
            <>
              <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column' }}>
                <input type="hidden" name="vorhandenesWirtshausId" value={stammhaus.id} />
                <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>
                  <Icon name="check-circle" size={20} />Wie immer im {stammhaus.name}
                </button>
              </form>
              <Link href="/termin" className="wn-press" style={{ ...goldKnopfStil, minHeight: 48, background: 'transparent', boxShadow: 'none', border: '1.5px solid rgba(246,240,226,0.3)', color: 'var(--pergament)', fontSize: 15, fontWeight: 700 }}>
                <Icon name="pin-plus" size={18} />Ausflug: heute mal woanders
              </Link>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={eyebrowStil}>Nächster Stammtisch · Planung</span>
            {kalenderKnopf}
          </div>
          <h2 style={{ ...titelStil, fontSize: 38 }}>{ichPlane ? 'Du suchst noch' : `${planerName} sucht noch`}</h2>
          <span style={zeileStil}>{datumMittel(termin.datum)} · {termin.zeit} · Wirtshaus wird gesucht</span>
          {ichPlane ? (
            <Link href="/termin" className="wn-press" style={goldKnopfStil}>Wirtshaus reservieren</Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(208,173,102,0.5)' }}>
              <Icon name="pin-plus" size={22} color="var(--gold-bright)" />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--pergament)' }}>
                Du kennst ein gutes? Schlag’s {planerName} vor.
              </span>
              <VorschlagenKnopf />
            </div>
          )}
        </>
      );
    } else {
      /* 2c–2h: reserviert, Stammtisch-Tag, Abend vorbei */
      const checkin = checkinOffen(termin, jetzt);
      const abend = bierdeckelOffen(termin, jetzt);
      const abschluss = abschlussOffen(termin, jetzt);
      const stammtischTag = checkin || abend || abschluss;
      const eingecheckte = checkin
        ? getCheckinsFuerTermin(termin.id).map(({ checkin: c, member: m }) => ({
            name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, platz: c.platz, istIch: m.id === me.id,
          }))
        : [];
      const meinBesuch = abend ? getBesucheFuerTermin(termin.id).find((b) => b.memberId === me.id) : undefined;
      const name = wirtshaus?.name ?? (planer ? `${anzeigeName(planer)} reglt’s` : 'Stammtisch');
      // Stammhaus-Abend („wie immer“) oder Ausflug woanders hin (5a/5c)
      const stammhausAbend = !!stammhaus && wirtshaus?.id === stammhaus.id;
      const ausflug = !!stammhaus && !!wirtshaus && !stammhausAbend;
      heroInhalt = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={eyebrowStil}>
                {heuteTag ? 'Heute ist Stammtisch' : vorbei ? 'Der Abend ist vorbei' : stammhausAbend ? 'Nächster Stammtisch · Stammhaus' : 'Nächster Stammtisch'}
              </span>
              <h2 style={{ ...titelStil, fontSize: name.length > 16 ? 30 : 40, overflowWrap: 'anywhere' }}>{name}</h2>
              <span style={zeileStil}>
                {heuteTag ? 'Heute' : datumMittel(termin.datum)} · {termin.zeit}
                {stammhausAbend ? ' · wie immer' : wirtshaus?.bezirk ? ` · ${wirtshaus.bezirk}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
              {ausflug && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="compass" size={13} />Ausflug
                </span>
              )}
            <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
              {!stammtischTag && kalenderKnopf}
              {wirtshaus && (
                <RichtungsKnopf
                  ziel={{ name: wirtshaus.name, adresse: wirtshaus.adresse, lat: wirtshaus.lat, lng: wirtshaus.lng }}
                  style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--pergament)' }}
                />
              )}
            </div>
            </div>
          </div>

          {/* Vorher: Zusagen/Absagen. Am Stammtisch-Tag is die Abstimmung durch. */}
          {!stammtischTag && <AbstimmungsStand terminId={termin.id} terminDatum={termin.datum} meinVote={meinVote} />}
          {!stammtischTag && stammhausAbend && planer && (
            <span style={hinweisStil}>Tisch bestätigt von {anzeigeName(planer)}</span>
          )}

          {/* Stammtisch-Tag ab 2 Stund’ vor Beginn: Wer is scho da? */}
          {checkin && <CheckinKarte terminId={termin.id} eingecheckte={eingecheckte} />}

          {/* Ab der Termin-Uhrzeit: Dein Deckel als Kurzinfo, gstrichelt wird im Termin-Tab */}
          {abend && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <span style={{ width: 52, height: 52, flex: 'none', borderRadius: '50%', background: 'var(--pergament)', border: '3px double var(--gold)', color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="beer" size={24} stroke={2.2} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--pergament)' }}>
                    {meinBesuch?.hoiben ?? 0} Hoibe{config.features.schnaps ? ` · ${meinBesuch?.schnaps ?? 0} Schnaps` : ''}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.7)' }}>Dein Deckel heute</span>
                </div>
              </div>
              {!abschluss && (
                <Link href="/termin" className="wn-press" style={goldKnopfStil}>
                  Zum Bierdeckel <Icon name="arrow-right" size={18} />
                </Link>
              )}
            </>
          )}

          {/* Abend rum: wer zuerst abschließt, kriegt die WP (Zettel liegt im Termin-Tab) */}
          {abschluss && (
            <div style={blockStil}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-bright)' }}>Der Abend ist vorbei. Wer trägt ein?</span>
              <span style={{ ...hinweisStil, color: 'rgba(246,240,226,0.75)' }}>
                Wer zuerst abschließt, bekommt +{PTS.abschluss} WP. Bis 7 Tage danach kann noch nachgetragen werden.
              </span>
              <Link href="/termin" className="wn-press" style={goldKnopfStil}>Abend abschließen</Link>
            </div>
          )}

          {/* Wer kommt: Avatare der Zugesagten + Zählerstand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(208,173,102,0.3)' }}>
            {zugesagte.length > 0 && (
              <span style={{ display: 'inline-flex', flex: 'none' }}>
                {zugesagte.slice(0, 6).map((s, i) => (
                  <span key={s.name} style={{ marginLeft: i === 0 ? 0 : -8, display: 'inline-flex', borderRadius: '50%', border: '2px solid var(--navy)', zIndex: 6 - i }}>
                    <Avatar src={s.photoUrl} name={s.name} size={26} verein={s.verein} />
                  </span>
                ))}
                {zugesagte.length > 6 && (
                  <span className="wn-tnum" style={{ marginLeft: -8, width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--navy)', background: 'rgba(255,255,255,0.18)', color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    +{zugesagte.length - 6}
                  </span>
                )}
              </span>
            )}
            <span className="wn-tnum" style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(246,240,226,0.85)' }}>
              {zugesagte.length} dabei · {ab} abgesagt{!stammtischTag ? ` · ${offen} offen` : ''}
            </span>
          </div>
        </>
      );
    }
  }

  const hero = (
    <Card tone="dark" framed pad={0} style={{ overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
      <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
      <div style={{ padding: '14px 20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>{heroInhalt}</div>
    </Card>
  );

  return (
    <div className="wn-eintritt" style={{ padding: '20px 16px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {letzter && feiern.length > 0 && <BadgeFeier terminId={letzter.id} feiern={feiern} />}

      {/* Nur im Browser: App aufs Handy (am iPhone gehen Benachrichtigungen erst nach der Installation) */}
      <AppInstallieren variante="hoam" />
      <PushAktivieren />

      {hero}

      {/* 3c: ab 3× unentschuldigt in Folge, Strafrunde fällig */}
      {wackelt && (
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--strafe-bg)', border: '1.5px solid var(--strafe)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warning" size={24} color="var(--strafe)" />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--strafe)' }}>Du wackelst!</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-700)' }}>
            {unentschuldigt}× unentschuldigt gefehlt, dafür ist eine Strafrunde fällig. Beim nächsten Stammtisch wieder dabei sein!
          </span>
          {PAYPAL_POOL_URL && (
            <a
              href={PAYPAL_POOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="wn-press"
              style={{ ...goldKnopfStil, minHeight: 44, fontSize: 14, borderRadius: 12 }}
            >
              Runde per PayPal zahlen{strafSumme > 0 ? ` · ${euro(strafSumme)}` : ''}
            </a>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>… oder bar beim Kassenwart.</span>
        </div>
      )}

      {/* 3d: offene Strafen, ohne fällt der Block weg */}
      {strafSumme > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--strafe-bg)', border: '1px solid rgba(192,57,43,0.25)' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="wn-tnum" style={{ fontSize: 14, fontWeight: 800, color: 'var(--strafe)' }}>
              {meineStrafen.length} offene {meineStrafen.length === 1 ? 'Strafe' : 'Strafen'} · {euro(strafSumme)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
              Bis zum nächsten Stammtisch begleichen{PAYPAL_POOL_URL ? ', per PayPal oder bar beim Kassenwart.' : '.'}
            </span>
          </div>
          {PAYPAL_POOL_URL ? (
            <a href={PAYPAL_POOL_URL} target="_blank" rel="noopener noreferrer" className="wn-press" style={{ flex: 'none', height: 34, padding: '0 14px', borderRadius: 'var(--r-sm)', background: 'var(--strafe)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Zahlen
            </a>
          ) : (
            <Link href="/kasse" className="wn-press" style={{ flex: 'none', height: 34, padding: '0 14px', borderRadius: 'var(--r-sm)', background: 'var(--strafe)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Zur Kasse
            </Link>
          )}
        </div>
      )}

      {/* Offene Umfragen: dei Stimm’ fehlt no */}
      {offeneUmfragen.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel>{offeneUmfragen.length === 1 ? 'Umfrage' : 'Umfragen'}</HoamTitel>
          {offeneUmfragen.map((u) => (
            <UmfrageKarte key={u.umfrage.id} daten={u} meId={me.id} meRole={me.role} />
          ))}
        </section>
      )}

      {letzter && <LetzterStammtisch letzter={letzter} meId={me.id} stats={stats} saisonStart={saison.start} />}

      <SaisonKarte
        me={meineStats}
        allzeit={meineAllzeit}
        rang={meinRang}
        rangliste={rangliste}
        schnapsAn={config.features.schnaps}
        wackelt={wackelt}
      />

      {/* Wirtshaus entdeckt, darf jeder: landet als Pin auf der Karte, wer scho dort war, bewertet gleich mit. */}
      <details
        id="wirtshaus-gfunden"
        style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', overflow: 'hidden', scrollMarginTop: 12 }}
      >
        <KlappenKopf
          pad="16px"
          icon={<Icon name="pin-plus" size={22} />}
          chip={
            <span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'var(--pergament)', color: 'var(--gold-700)' }}>
              +{PTS.vorschlag} WP
            </span>
          }
        >
          {config.typ === 'stammhaus' ? 'Wirtshaus fürs Lexikon?' : 'Wirtshaus gefunden?'}
        </KlappenKopf>
        <div style={{ padding: '0 16px 16px' }}>
          <WirtshausGfunden bekannte={getBekannteWirtshaeuser()} />
        </div>
      </details>

      {/* Umfragen: neue starten + scho beantwortete mit Ergebnis */}
      <UmfragenBereich anzahl={beantworteteUmfragen.length}>
        {beantworteteUmfragen.map((u) => (
          <UmfrageKarte key={u.umfrage.id} daten={u} meId={me.id} meRole={me.role} />
        ))}
      </UmfragenBereich>
    </div>
  );
}

/**
 * Letzter Stammtisch: woher die neuen WP kommen, wie sich der eigene Rang
 * verändert hat und wer wem ein Badge/Amt abgluchst hat.
 */
function LetzterStammtisch({
  letzter,
  meId,
  stats,
  saisonStart,
}: {
  letzter: NonNullable<ReturnType<typeof getLetzterAbgeschlossenerTermin>>;
  meId: string;
  stats: MitgliedStats[];
  saisonStart: string;
}) {
  const { wirtshaus } = getTerminMitWirtshaus(letzter);
  // Liegt der Abend in der laufenden Saison, zählt die Saison-Rangliste,
  // sonst (Saisonwechsel grad passiert) die Gesamt-Rangliste
  const inSaison = letzter.datum >= saisonStart;
  const statsNach = inSaison ? stats : getStats();
  const statsVorher = getStats({ ...(inSaison ? { abDatum: saisonStart } : {}), ohneTerminId: letzter.id });

  const vor = statsVorher.find((s) => s.member.id === meId);
  const nach = statsNach.find((s) => s.member.id === meId);
  if (!vor || !nach) return null;
  // Abstimm-Bonus zählt LIVE beim Voten (Punkteflug + Header-Pill) und gehört
  // deshalb nicht zur Abend-Ausbeute, hier rausgerechnet.
  const delta = nach.punkte - vor.punkte - (nach.abstimmBonus - vor.abstimmBonus);

  const rangVon = (liste: MitgliedStats[]) =>
    [...liste].sort((a, b) => b.punkte - a.punkte).findIndex((s) => s.member.id === meId) + 1;
  const rangVor = rangVon(statsVorher);
  const rangNach = rangVon(statsNach);

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
  const posten: Array<[string, number]> = [];
  if (dabei) posten.push(['Dabei', PTS.teilnahme]);
  if (checkinDelta !== 0) posten.push(['Als Erster eingecheckt', checkinDelta]);
  if (dabei && meinBesuch!.hoiben > 0) posten.push([`${meinBesuch!.hoiben} Hoibe`, meinBesuch!.hoiben * PTS.hoibe]);
  if (dabei && meinBesuch!.taxi) posten.push(['Gfahren', PTS.taxi]);
  if (letzter.planerId === meId) posten.push(['Organisiert', orgaDelta]);
  if (letzter.abgeschlossenVon === meId) posten.push(['Abgschlossen', PTS.abschluss]);
  if (meineRunden > 0) posten.push([meineRunden === 1 ? 'Runde gschmissen' : `${meineRunden} Runden`, meineRunden * PTS.runde]);
  if (bewertungDelta !== 0) posten.push(['Abend bewertet', bewertungDelta]);
  if (textDelta !== 0) posten.push(['Bewertung gschrieben', textDelta]);
  if (vorschlagDelta !== 0) posten.push(['Dei Wirtshaus-Vorschlag', vorschlagDelta]);
  if (serienDelta !== 0) posten.push(['Serienbonus', serienDelta]);
  if (fehlDelta !== 0) posten.push(['Gfehlt', fehlDelta]);

  // Badge-/Amt-Wechsel durch diesen Abend
  const mitglieder = getAktiveMitglieder();
  const nameVon = (id: string) => {
    const m = mitglieder.find((x) => x.id === id);
    return m ? anzeigeName(m) : '—';
  };
  const wechsel = vergabeWechsel(getVergabeStand(letzter.id), getVergabeStand());
  const kachelLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' };
  const config = tenantConfig();
  // Stammhaus-Abend: „Euer Stammhaus“ statt Bezirk, koa Sterne, nur Brodn & Schmarrn (Hoam · Stammhaus 5a)
  const stammhausAbend = config.typ === 'stammhaus' && !!wirtshaus && wirtshaus.id === config.stammhausWirtshausId;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel>Letzter Stammtisch</HoamTitel>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {/* Wirtshaus-Kopf mit Foto, gedeckelt, damit die Karte ned den halben Schirm frisst */}
        <div style={{ position: 'relative', background: 'var(--grad-navy)' }}>
          {wirtshaus?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wirtshaus.photoUrl} alt={wirtshaus.name} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ height: 96 }} />
          )}
          <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 90, background: 'linear-gradient(180deg, rgba(7,25,58,0) 0%, rgba(7,25,58,0.85) 100%)' }} />
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--gold-bright)', textShadow: '0 1px 4px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {wirtshaus?.name ?? 'Stammtisch'}
              </span>
              {(stammhausAbend || wirtshaus?.bezirk) && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.85)', marginTop: 2 }}>{stammhausAbend ? 'Euer Stammhaus' : wirtshaus?.bezirk}</span>
              )}
            </div>
            <span className="wn-tnum" style={{ flex: 'none', fontSize: 11, fontWeight: 800, color: 'var(--pergament)', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
              {datumKurz(letzter.datum)}
            </span>
          </div>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Ausbeute & Rang als Kacheln */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--navy)', color: 'var(--pergament)', borderRadius: 'var(--r-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: delta >= 0 ? 'var(--gold-bright)' : '#F0A49A' }}>
                {delta >= 0 ? '+' : ''}{delta} <span style={{ fontSize: 16 }}>WP</span>
              </span>
              <span style={{ ...kachelLabel, color: 'rgba(246,240,226,0.7)' }}>{dabei ? 'Eingesackt' : 'Nicht dabei'}</span>
            </div>
            <div style={{ background: 'var(--pergament)', borderRadius: 'var(--r-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {rangVor}
                <Icon name="arrow-right" size={18} stroke={3} />
                {rangNach}
                <span style={{ fontSize: 18, marginLeft: 2, color: rangNach < rangVor ? 'var(--erfolg)' : rangNach > rangVor ? 'var(--strafe)' : 'var(--ink-300)' }}>
                  {rangNach < rangVor ? '▲' : rangNach > rangVor ? '▼' : '='}
                </span>
              </span>
              <span style={{ ...kachelLabel, color: 'var(--ink-500)' }}>Dein Rang</span>
            </div>
          </div>

          {posten.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {posten.map(([label, wp]) => (
                <span key={label} className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 999, background: 'var(--info-bg)', color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                  {label} <strong style={{ color: wp >= 0 ? 'var(--muc-blau)' : 'var(--strafe)' }}>{wp >= 0 ? '+' : ''}{wp}</strong>
                </span>
              ))}
            </div>
          )}

          {/* 3h: Bewertung in drei Stufen (Knopf → Formular → Wertung), 7 Tage offen.
              Danach bleibt die abgegebene Wertung als stille Zeile stehen. */}
          {dabei && bewertungsFenster && (
            <MeiBewertung
              variante="eingebettet"
              wirtshausName={wirtshaus?.name ?? null}
              initial={bewertung.initial}
              team={bewertung.team}
              action={meineBewertung.bind(null, letzter.id)}
              ohneSterne={stammhausAbend}
            />
          )}
          {dabei && !bewertungsFenster && stammhausAbend && (bewertung.initial.brodnGessen || bewertung.initial.kaisiProbiert || bewertung.initial.kommentar) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--ink-50)', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink-700)' }}>Brodn & Schmarrn</span>
              <span style={{ fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap', display: 'flex', gap: 10 }}>
                <span style={{ color: bewertung.initial.brodnGessen ? 'var(--erfolg)' : 'var(--ink-300)' }}>Brodn {bewertung.initial.brodnGessen ? '✓' : '–'}</span>
                <span style={{ color: bewertung.initial.kaisiProbiert ? 'var(--erfolg)' : 'var(--ink-300)' }}>Schmarrn {bewertung.initial.kaisiProbiert ? '✓' : '–'}</span>
              </span>
            </div>
          )}
          {dabei && !bewertungsFenster && !stammhausAbend && bewertung.initial.sterne != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--ink-50)', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink-700)' }}>Deine Wertung</span>
              <span className="wn-tnum" style={{ fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                {bewertung.initial.sterne.toFixed(1).replace('.', ',')} <span style={{ color: 'var(--gold)' }}>★</span>
                {bewertung.team.anzahl > 1 && (
                  <span style={{ fontWeight: 700, color: 'var(--ink-300)' }}> · Team Ø {bewertung.team.schnitt.toFixed(1).replace('.', ',')}</span>
                )}
              </span>
            </div>
          )}

          {wechsel.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--ink-100)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>
                {wechsel.length} {wechsel.length === 1 ? 'Badge gewandert' : 'Badges gewandert'}
              </span>
              {wechsel.map((w) => (
                <span key={w.key} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.45 }}>
                  {wechselTexte(w, nameVon(w.neuId)).anAlle}
                  {w.altId && <span style={{ color: 'var(--ink-300)' }}> (vorher {nameVon(w.altId)})</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

/**
 * Saison-Karte: eigene WP groß, Abstand zum Platz davor (oder Vorsprung),
 * Fortschrittsbalken bis zur Spitze, drei Kennzahlen mit Platz, drunter die
 * Serie als Kästchen (gefüllt = laufende Serie, gestrichelt = bis zum Rekord).
 */
function SaisonKarte({
  me,
  allzeit,
  rang,
  rangliste,
  schnapsAn,
  wackelt,
}: {
  me: MitgliedStats | undefined;
  allzeit: MitgliedStats | undefined;
  rang: number;
  rangliste: MitgliedStats[];
  schnapsAn: boolean;
  wackelt: boolean;
}) {
  const wp = me?.punkte ?? 0;
  const spitze = rangliste[0]?.punkte ?? 0;
  const davor = rang > 1 ? rangliste[rang - 2] : null;
  const dahinter = rang === 1 ? rangliste[1] : null;
  let abstand: string;
  if (rang === 0 || !me) abstand = 'No koane Punkte, des ändert sich beim nächsten Stammtisch.';
  else if (rang === 1) abstand = dahinter ? `Platz 1 · ${wp - dahinter.punkte} WP vor ${anzeigeName(dahinter.member)}` : 'Platz 1';
  else if (davor!.punkte === wp) abstand = `Platz ${rang} · gleichauf mit ${anzeigeName(davor!.member)}`;
  else abstand = `Platz ${rang} · ${davor!.punkte - wp} WP hinter ${anzeigeName(davor!.member)}`;
  const fortschritt = spitze > 0 ? Math.min(100, Math.round((wp / spitze) * 100)) : 0;
  // Platz-Kreis: Stockerl in Gold (wia im Design), dahinter weiß
  const stockerl = rang >= 1 && rang <= 3;

  const platzIn = (feld: 'hoiben' | 'abende' | 'schnaps') =>
    me ? [...rangliste].sort((a, b) => b[feld] - a[feld]).findIndex((s) => s.member.id === me.member.id) + 1 : 0;
  const spalten: Array<[number, string, number]> = [
    [me?.hoiben ?? 0, 'Hoibe', platzIn('hoiben')],
    ...(schnapsAn ? ([[me?.schnaps ?? 0, 'Schnaps', platzIn('schnaps')]] as Array<[number, string, number]>) : []),
    [me?.abende ?? 0, 'Abende', platzIn('abende')],
  ];

  const streak = allzeit?.streak ?? 0;
  const rekord = allzeit?.bestStreak ?? 0;
  const kaestchen = Math.min(10, Math.max(streak, rekord, 1));

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel>Saison</HoamTitel>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="wn-tnum" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--muc-blau)' }}>
              {wp} <span style={{ fontSize: 16, color: 'var(--gold-700)' }}>WP</span>
            </span>
            <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{abstand}</span>
          </div>
          {rang > 0 && (
            <span
              className="wn-tnum"
              style={{
                width: 52, height: 52, flex: 'none', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800,
                background: stockerl ? 'var(--grad-gold)' : 'var(--weiss)', color: stockerl ? 'var(--navy-900)' : 'var(--navy)',
                border: stockerl ? 'none' : '1.5px solid var(--ink-100)', boxShadow: stockerl ? 'var(--sh-gold)' : 'var(--sh-xs)',
              }}
            >
              {rang}
            </span>
          )}
        </div>
        <div style={{ margin: '0 18px', height: 8, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 999, background: 'var(--muc-blau)', width: `${fortschritt}%`, transition: 'width 500ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${spalten.length}, 1fr)`, marginTop: 18, borderTop: '1px solid var(--ink-100)' }}>
          {spalten.map(([wert, label, platz], i) => (
            <div key={label} style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRight: i < spalten.length - 1 ? '1px solid var(--ink-100)' : 'none' }}>
              <span className="wn-tnum" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>{wert}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{label}</span>
              {platz > 0 && <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-700)' }}>Platz {platz}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--pergament)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {streak >= 0 ? (
            <>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {Array.from({ length: kaestchen }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 14, height: 14, borderRadius: 4,
                      background: i < streak ? 'var(--gold)' : 'transparent',
                      border: i < streak ? 'none' : '1.5px dashed var(--gold-600)',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
              <span className="wn-tnum" style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                {streak > 0 ? `${streak}er-Serie` : 'Koa Serie'}
                {rekord > 0 && <span style={{ fontWeight: 600, color: 'var(--ink-500)' }}> · Rekord {rekord}</span>}
              </span>
            </>
          ) : (
            <>
              <StreakChip streak={streak} bestStreak={rekord} wackelt={wackelt} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
                {wackelt ? 'Du wackelst, beim nächsten Stammtisch wieder dabei sein!' : 'Beim nächsten Stammtisch wieder dabei sein!'}
              </span>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}
