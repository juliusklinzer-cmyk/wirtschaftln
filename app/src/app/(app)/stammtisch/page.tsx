import Image from 'next/image';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { HouseLine } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import { Wine } from '@phosphor-icons/react/dist/ssr/Wine';
import { Cards } from '@phosphor-icons/react/dist/ssr/Cards';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { Key } from '@phosphor-icons/react/dist/ssr/Key';
import { auszeichnungsWahl, saisonBadges, AEMTER_INFO, pflichtenWahl } from '@/lib/badges';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { tenantConfig, auszeichnungAn } from '@/lib/tenant-config';
import { anzeigeName } from '@/lib/namen';
import { getAktiveMitglieder, getPraesidentId, getKassenwartId, getVergabeStand } from '@/lib/queries';
import { katalog, regelZusammenfassung } from '@/lib/strafen-regeln';
import { stammtischRekorde } from '@/lib/rekorde';
import { eingeladenVon } from '@/lib/verzeichnis';
import { bierLogo } from '@/lib/biersorten';
import { datumKurz } from '@/lib/format';
import { Avatar } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { bereichHinweisStil } from '@/components/domain/hero-stil';
import { StammdatenKlappe } from './stammdaten-klappe';
import { StrafenKatalog } from './strafen-katalog';
import { PraesidentVerwaltung } from './praesident-verwaltung';
import { PflichtenKlappe } from './pflichten-klappe';
import { kodexText, kodexSaetze } from '@/lib/aufnahme';
import { praesidentGewaehlt, eingetragenerPraesident } from '@/lib/praesident';
import { offeneWahl } from '@/lib/praesident-wahl';
import { regelSpeichern } from '../kasse/actions';

export const metadata = { title: 'Unser Stammtisch' };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };
const ikon = { size: 20, color: 'var(--gold-700)', style: { width: 22, flex: 'none' } as React.CSSProperties };

type Mitglied = ReturnType<typeof getAktiveMitglieder>[number];

/** Zeile im Steckbrief: Icon, Begriff, Wert (mit Logo oder Avatar). */
function Zeile({ icon, label, children, letzte }: { icon: React.ReactNode; label: string; children: React.ReactNode; letzte?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)' }}>
      {icon}
      <span style={{ width: 92, flex: 'none', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 8 }}>{children}</span>
    </div>
  );
}

function Person({ m, zusatz }: { m: Mitglied; zusatz?: string }) {
  return (
    <>
      <Avatar src={m.photoUrl} name={anzeigeName(m)} size={30} verein={m.verein} />
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span>{anzeigeName(m)}</span>
        {zusatz && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>{zusatz}</span>}
      </span>
    </>
  );
}

/**
 * „Unser Stammtisch“ (04.11.2026): das Profil vom Stammtisch, für alle.
 * Steckbrief, Ämter, Badges, Strafenkatalog, Rekorde. Bearbeiten dürfen
 * Präsident und Admin (Stammdaten und Strafen).
 */
export default async function StammtischPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const config = tenantConfig();
  const gruppe = currentTenant().gruppe;
  const mitglieder = getAktiveMitglieder();
  const praesidentId = getPraesidentId();
  const praesident = mitglieder.find((m) => m.id === praesidentId);
  const kassenwart = mitglieder.find((m) => m.id === getKassenwartId());
  const darfBearbeiten = me.role === 'admin' || me.id === praesidentId;
  const gruender = mitglieder.filter((m) => m.role === 'admin').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const einladung = config.istGruender ? null : eingeladenVon(gruppe.id);
  const schafkopfer = mitglieder.filter((m) => m.schafkopfer).length;
  const logo = bierLogo(config.bierName);
  const vergabe = getVergabeStand();
  const nameVon = (id: string | null | undefined) => {
    const m = id ? mitglieder.find((x) => x.id === id) : null;
    if (!m) return null;
    // „da Toni“ bleibt ganz, „Moritz Fleischmann“ wird „Moritz“
    const [erster, ...rest] = anzeigeName(m).split(' ');
    return erster.length <= 3 && rest.length > 0 ? anzeigeName(m) : erster;
  };
  const badges = [
    ...['Präsident', 'Schriftführer', 'Kassenwart']
      .filter((t) => t === 'Präsident' || auszeichnungAn(`amt:${t === 'Schriftführer' ? 'schriftfuehrer' : 'kassenwart'}`))
      .map((t) => ({ key: `amt:${t}`, name: t, icon: AEMTER_INFO[t].icon, slug: AEMTER_INFO[t].slug as string | null, traeger: t === 'Präsident' ? nameVon(praesidentId) : t === 'Kassenwart' ? nameVon(kassenwart?.id) : null })),
    ...saisonBadges().map((b) => ({ key: b.key, name: b.name, icon: b.icon, slug: b.slug, traeger: nameVon(vergabe.get(b.key)) })),
  ];
  const rekorde = stammtischRekorde();
  // Präsident nach WP oder gewählt (06.11.2026)
  const gewaehlt = praesidentGewaehlt();
  const eingetragen = gewaehlt ? eingetragenerPraesident() : null;
  const wahl = gewaehlt ? offeneWahl() : null;
  const praesidentZusatz = !gewaehlt
    ? 'die meisten WP der Saison'
    : eingetragen && eingetragen.memberId === praesidentId
      ? `gewählt für ${eingetragen.saison}${wahl ? ', Wahl läuft' : ''}`
      : `nach WP, bis gewählt wird${wahl ? ' (Wahl läuft)' : ''}`;

  const regeln = katalog().map((r) => ({
    id: r.id, art: r.art, name: r.name, detail: r.detail, abzuege: r.wpStaffel.map((w) => -w), betragCents: r.betragCents,
    fristArt: r.fristArt, fristWert: r.fristWert, nichtEingetragenZusage: r.nichtEingetragenZusage, erlassbar: r.erlassbar, aktiv: r.aktiv,
    ausloeser: r.ausloeser, ausloeserWert: r.ausloeserWert,
    zusammenfassung: regelZusammenfassung(r),
    geaendert: r.geaendertAm
      ? `geändert am ${datumKurz(r.geaendertAm.slice(0, 10))}${nameVon(r.geaendertVon) ? ` von ${nameVon(r.geaendertVon)}` : ''}`
      : r.erstelltVon
        ? `angelegt am ${datumKurz(r.erstelltAm.slice(0, 10))}${nameVon(r.erstelltVon) ? ` von ${nameVon(r.erstelltVon)}` : ''}`
        : null,
  }));

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Kopf wie eine Urkunde */}
      <div style={{ borderRadius: 24, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', color: 'var(--pergament)', boxShadow: 'var(--sh-lg)' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <span style={{ width: 84, height: 84, borderRadius: 20, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${config.logoUrl}?s=168`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Image src="/brand/rauten-app.svg" alt="" width={60} height={60} style={{ height: 60, width: 'auto' }} />
            )}
          </span>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 34, lineHeight: 1.05, color: 'var(--gold-bright)' }}>{gruppe.name}</span>
          {gruppe.motto && <span style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', color: 'rgba(246,240,226,0.85)' }}>„{gruppe.motto}“</span>}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.7)' }}>
            {[gruppe.stadt, gruppe.gruendungsjahr ? `seit ${gruppe.gruendungsjahr}` : null, `${mitglieder.length} Spezln`].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* Steckbrief */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel>Steckbrief</HoamTitel>
        <div style={{ ...karteStil, padding: '2px 16px' }}>
          <Zeile icon={<MapPin {...ikon} />} label="Stadt">{gruppe.stadt ?? '–'}</Zeile>
          <Zeile icon={<CalendarBlank {...ikon} />} label="Gegründet">{gruppe.gruendungsjahr ?? '–'}</Zeile>
          <Zeile icon={<HouseLine {...ikon} />} label="Art">{config.typ === 'stammhaus' ? 'Fest im Stammhaus' : 'Jedes Mal ein anderes Wirtshaus'}</Zeile>
          <Zeile icon={<BeerStein {...ikon} />} label="Bier">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain', flex: 'none' }} />
            )}
            <span style={{ minWidth: 0 }}>{config.bierName}</span>
          </Zeile>
          <Zeile icon={<Wine {...ikon} />} label="Schnaps">{config.features.schnaps ? 'Wird gschnapselt' : 'Nein'}</Zeile>
          <Zeile icon={<Cards {...ikon} />} label="Schafkopf">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vereine/eichel.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', flex: 'none' }} />
            <span>{schafkopfer === 0 ? 'Noch keiner' : `${schafkopfer} von ${mitglieder.length} Spezln`}</span>
          </Zeile>
          <Zeile icon={<UsersThree {...ikon} />} label="Spezln" letzte={!darfBearbeiten}>{mitglieder.length}</Zeile>
          {darfBearbeiten && (
            <Zeile icon={<Key {...ikon} />} label="Aufnahme" letzte>{gruppe.gruendungscode ? `Code ${gruppe.gruendungscode}` : 'zu'}</Zeile>
          )}
        </div>
      </section>

      {/* Leute */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel>Wer den Laden schmeißt</HoamTitel>
        <div style={{ ...karteStil, padding: '2px 16px' }}>
          <Zeile icon={<span style={{ width: 22, textAlign: 'center', fontSize: 18 }}>{AEMTER_INFO['Präsident'].icon}</span>} label="Präsident" letzte={!kassenwart && !gruender && !einladung}>
            {praesident ? <Person m={praesident} zusatz={praesidentZusatz} /> : <span>Noch keiner</span>}
          </Zeile>
          {kassenwart && (
            <Zeile icon={<span style={{ width: 22, textAlign: 'center', fontSize: 18 }}>{AEMTER_INFO['Kassenwart'].icon}</span>} label="Kassenwart" letzte={!gruender && !einladung}>
              <Person m={kassenwart} />
            </Zeile>
          )}
          {gruender && (
            <Zeile icon={<span style={{ width: 22, textAlign: 'center', fontSize: 18 }}>📱</span>} label="App-Gründer" letzte={!einladung}>
              <Person m={gruender} zusatz={`seit ${datumKurz(gruender.createdAt.slice(0, 10))} in der App`} />
            </Zeile>
          )}
          {einladung && (
            <Zeile icon={<span style={{ width: 22, textAlign: 'center', fontSize: 18 }}>✉️</span>} label="Eingeladen" letzte>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>von {einladung.vonName}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>{einladung.gruppeName}{einladung.widmung ? ` · „${einladung.widmung}“` : ''}</span>
              </span>
            </Zeile>
          )}
        </div>
        {darfBearbeiten && (
          <StammdatenKlappe
            werte={{
              name: gruppe.name,
              motto: gruppe.motto ?? '',
              stadt: gruppe.stadt ?? '',
              gruendungsjahr: gruppe.gruendungsjahr ? String(gruppe.gruendungsjahr) : '',
              gruendungscode: gruppe.gruendungscode ?? '',
              logo: config.logo,
              bierName: config.bierName,
              schnaps: config.features.schnaps,
              auszeichnungen: auszeichnungsWahl(config.auszeichnungenAus),
              praesidentModus: me.role === 'admin' ? config.praesidentModus : undefined,
              praesidentWahlZeit: config.praesidentWahlZeit,
              praesidentSpezln: me.role === 'admin' ? mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein })) : undefined,
              praesidentId,
              kodex: kodexText(),
            }}
          />
        )}
        {me.role === 'admin' && gewaehlt && (
          <PraesidentVerwaltung
            spezln={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein }))}
            praesidentId={praesidentId}
            wahlOffen={!!wahl}
            wahlZeit={config.praesidentWahlZeit}
          />
        )}
      </section>

      {/* Kodex, den jeder Neue beim Beitritt bestätigt (WIR-013) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel>Unser Kodex</HoamTitel>
        <ol style={{ ...karteStil, margin: 0, padding: '14px 16px 14px 36px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {kodexSaetze().map((k) => (
            <li key={k} style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--navy)' }}>{k}</li>
          ))}
        </ol>
      </section>

      {/* Ämter & Badges, klein, darunter die Pflichten (WIR-003) */}
      {badges.length > 0 && (
        <section id="pflichten" style={{ display: 'flex', flexDirection: 'column', gap: 12, scrollMarginTop: 'calc(var(--wn-kopf-h, 80px) + 16px)' }}>
          <HoamTitel action={<span style={bereichHinweisStil}>diese Saison</span>}>Ämter & Badges</HoamTitel>
          <div style={{ ...karteStil, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 6px' }}>
            {badges.map((b) => (
              <div key={b.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', minWidth: 0 }}>
                <BadgeBild slug={b.slug} icon={b.icon} name={b.name} size={40} />
                <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.2, color: 'var(--ink-900)' }}>{b.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{b.traeger ?? 'frei'}</span>
              </div>
            ))}
          </div>
          <PflichtenKlappe wahl={pflichtenWahl()} darfPflegen={darfBearbeiten} />
        </section>
      )}

      <StrafenKatalog regeln={regeln} darfPflegen={darfBearbeiten} speichern={regelSpeichern} />

      {/* Rekorde ganz unten */}
      {rekorde.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>seit es die App gibt</span>}>Stammtisch-Rekorde</HoamTitel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {rekorde.map((r) => (
              <div key={r.titel} style={{ ...karteStil, borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{r.titel}</span>
                <span className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{r.wert}</span>
                {r.wer && <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35, color: 'var(--ink-500)' }}>{r.wer}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
