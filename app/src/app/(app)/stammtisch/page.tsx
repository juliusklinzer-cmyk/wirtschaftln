import Image from 'next/image';
import { auszeichnungsWahl } from '@/lib/badges';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { tenantConfig } from '@/lib/tenant-config';
import { anzeigeName } from '@/lib/namen';
import { getAktiveMitglieder, getPraesidentId } from '@/lib/queries';
import { katalog, regelZusammenfassung } from '@/lib/strafen-regeln';
import { datumKurz } from '@/lib/format';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { BearbeitenKlappe } from '@/app/(app)/verzeichnis/knoepfe';
import { StammtischForm } from './stammtisch-form';
import { StrafenKatalog } from './strafen-katalog';
import { regelSpeichern } from '../kasse/actions';

export const metadata = { title: 'Unser Stammtisch' };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)' };

/**
 * „Unser Stammtisch“ (04.11.2026): erst das Profil vom Stammtisch, das jeder
 * sieht, mit dem Strafenkatalog. Bearbeiten nur der Admin (Stammdaten) bzw.
 * Admin und Präsident (Strafen).
 */
export default async function StammtischPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const config = tenantConfig();
  const gruppe = currentTenant().gruppe;
  const istAdmin = me.role === 'admin';
  const mitglieder = getAktiveMitglieder();
  const praesidentId = getPraesidentId();
  const praesident = mitglieder.find((m) => m.id === praesidentId);
  const darfStrafen = istAdmin || me.id === praesidentId;
  const nameVon = (id: string | null) => {
    const m = id ? mitglieder.find((x) => x.id === id) : null;
    return m ? anzeigeName(m).split(' ')[0] : null;
  };

  const steckbrief: Array<[string, string]> = [
    ['Stadt', gruppe.stadt ?? '–'],
    ['Gegründet', gruppe.gruendungsjahr ? String(gruppe.gruendungsjahr) : '–'],
    ['Art', config.typ === 'stammhaus' ? 'Fester Stammtisch im Stammhaus' : 'Jedes Mal ein anderes Wirtshaus'],
    ['Bier', config.bierName],
    ['Schnaps', config.features.schnaps ? 'Ja' : 'Nein'],
    ['Spezln', String(mitglieder.length)],
    ['Präsident', praesident ? anzeigeName(praesident) : 'noch keiner'],
    ...(istAdmin ? ([['Gründungscode', gruppe.gruendungscode ?? 'Aufnahme zu'], ['Kennung', config.id]] as Array<[string, string]>) : []),
  ];

  const regeln = katalog().map((r) => ({
    id: r.id, art: r.art, name: r.name, detail: r.detail, abzuege: r.wpStaffel.map((w) => -w), betragCents: r.betragCents,
    fristArt: r.fristArt, fristWert: r.fristWert, nichtEingetragenZusage: r.nichtEingetragenZusage, erlassbar: r.erlassbar, aktiv: r.aktiv,
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
          {steckbrief.map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #EEF1F5' : 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', flex: 'none' }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{v}</span>
            </div>
          ))}
        </div>
        {istAdmin && (
          <BearbeitenKlappe>
            <div style={{ ...karteStil, padding: 16 }}>
              <StammtischForm
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
                }}
              />
            </div>
          </BearbeitenKlappe>
        )}
      </section>

      <StrafenKatalog regeln={regeln} darfPflegen={darfStrafen} speichern={regelSpeichern} />
    </div>
  );
}
