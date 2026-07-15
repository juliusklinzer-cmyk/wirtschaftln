import { getArchiv, getAktuellerTermin, getTerminMitWirtshaus } from '@/lib/queries';
import { datumKurz } from '@/lib/format';
import { Card, SectionHeader, Badge, Icon } from '@/components/ds';
import { Stars } from '@/components/domain/Stars';
import { MunichMap, type MapPin } from '@/components/domain/MunichMap';

export default async function KartePage() {
  const archiv = getArchiv();
  const aktueller = getAktuellerTermin();
  const naechstes = aktueller ? getTerminMitWirtshaus(aktueller).wirtshaus : null;

  const pins: MapPin[] = [
    ...archiv
      .filter((a) => a.wirtshaus.lat != null && a.wirtshaus.lng != null)
      .map((a) => ({
        id: a.wirtshaus.id,
        name: a.wirtshaus.name,
        lat: a.wirtshaus.lat!,
        lng: a.wirtshaus.lng!,
      })),
    ...(naechstes && naechstes.lat != null && naechstes.lng != null
      ? [{ id: naechstes.id, name: `${naechstes.name} (nächster)`, lat: naechstes.lat, lng: naechstes.lng, naechstes: true }]
      : []),
  ];

  const bezirke = new Set(archiv.map((a) => a.wirtshaus.bezirk).filter(Boolean));

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader eyebrow="Eroberte Wirtschaften" title="D’Sammlung" fraktur />

      {/* Sammel-Stats */}
      <Card tone="parchment" pad={14}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
          <div>
            <div className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, color: 'var(--gold-700)', lineHeight: 1.1 }}>
              {archiv.length}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
              Wirtshäuser
            </div>
          </div>
          <div>
            <div className="wn-tnum" style={{ fontSize: 30, fontWeight: 800, color: 'var(--gold-700)', lineHeight: 1.1 }}>
              {bezirke.size}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
              Bezirke
            </div>
          </div>
        </div>
      </Card>

      {/* Karte */}
      {pins.length > 0 ? (
        <MunichMap pins={pins} />
      ) : (
        <Card pad={14}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            Sobald a Wirtshaus mit Adresse abgeschlossen is’, erscheint’s hier auf der Karte. 🗺️
          </div>
        </Card>
      )}

      {/* Wirtshaus-Cards */}
      {archiv.map(({ termin, wirtshaus, planer, rating, hoiben }) => (
        <Card key={termin.id} pad={0} style={{ overflow: 'hidden' }}>
          <div
            className="wn-parchment"
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, color: 'var(--navy)' }}>{wirtshaus.name}</div>
            <Badge tone="erfolg">✓ besucht</Badge>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>
              <Icon name="pin" size={14} />
              {wirtshaus.bezirk ?? wirtshaus.adresse ?? 'München'} · {datumKurz(termin.datum)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stars rating={rating} />
              <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)' }}>{hoiben} 🍺</span>
            </div>
            {planer && (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
                organisiert von {planer.spitzname ?? planer.name}
              </div>
            )}
          </div>
        </Card>
      ))}

      {archiv.length === 0 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', padding: 8 }}>
            D’Sammlung is’ no leer — nach’m ersten abgeschlossenen Stammtisch geht’s los!
          </div>
        </Card>
      )}
    </div>
  );
}
