'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps';
import { findeBekanntes, type BekanntesWirtshaus } from '@/lib/wirtshaus-abgleich';
import { useTenantConfig } from '@/components/shell/TenantProvider';
import { umkreisBounds, type TenantGeo } from '@/lib/tenant-config-public';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WirtshausTreffer = {
  name: string;
  adresse: string;
  bezirk: string;
  telefon: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string;
};

/**
 * Wirtshaus-Suche mit Google-Places-Autocomplete: füllt Name, Adresse, Bezirk,
 * Telefon, Koordinaten und Foto automatisch. Die Werte wandern als Hidden-Fields
 * mit ins umgebende <form>.
 */
export function WirtshausSuche({
  namePrefix = 'w',
  bekannte = [],
  bias,
  label = 'Wirtshaus',
}: {
  namePrefix?: string;
  /** Umkreis für die Google-Suche; undefined = Tenant-Config, null = ganz Deutschland (Gründungs-Wizard) */
  bias?: TenantGeo | null;
  label?: string;
  /** Alle bekannten Wirtshäuser (besucht/eingeplant/vorgeschlagen), Regel: koa Wirtshaus zweimal. */
  bekannte?: BekanntesWirtshaus[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const geoConfig = useTenantConfig().geo;
  const geo = bias === undefined ? geoConfig : bias;
  const geoRef = useRef(geo);
  geoRef.current = geo;
  const [treffer, setTreffer] = useState<WirtshausTreffer | null>(null);
  const [eingabe, setEingabe] = useState('');
  const [status, setStatus] = useState<'lade' | 'bereit' | 'fehler'>('lade');

  // Unscharfer Abgleich (gleiche Logik wie die Server-Regel beim Vorschlagen)
  const bekanntes = findeBekanntes(treffer?.name ?? eingabe, bekannte);

  useEffect(() => {
    let aufgeraeumt = false;
    let listener: any = null;
    let autocomplete: any = null;
    loadGoogleMaps()
      .then((google) => {
        if (aufgeraeumt || !inputRef.current) return;
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['name', 'formatted_address', 'address_components', 'geometry', 'formatted_phone_number', 'photos'],
          componentRestrictions: { country: 'de' },
          // Stadt + Umland bevorzugen (Umkreis aus der Tenant-Config)
          ...(geoRef.current
            ? (() => {
                const b = umkreisBounds(geoRef.current);
                return { bounds: new google.maps.LatLngBounds(b.sw, b.ne) };
              })()
            : {}),
        });
        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place?.name) return;
          const komponente = (typ: string) =>
            place.address_components?.find((c: any) => c.types.includes(typ))?.long_name ?? '';
          setTreffer({
            name: place.name,
            adresse: place.formatted_address ?? '',
            bezirk: komponente('sublocality_level_1') || komponente('sublocality') || komponente('locality'),
            telefon: place.formatted_phone_number ?? '',
            lat: place.geometry?.location?.lat() ?? null,
            lng: place.geometry?.location?.lng() ?? null,
            photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 640, maxHeight: 480 }) ?? '',
          });
        });
        setStatus('bereit');
      })
      .catch(() => setStatus('fehler'));
    return () => {
      aufgeraeumt = true;
      if (listener) listener.remove();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{label}</label>
      <input
        ref={inputRef}
        placeholder={status === 'fehler' ? 'Name eintippen (Google-Suche nicht verfügbar)' : 'Wirtshaus suchen, Google füllt den Rest aus…'}
        onChange={(e) => {
          setEingabe(e.target.value);
          // Freitext bleibt gültig, falls Google nix findet
          if (treffer && e.target.value !== treffer.name) setTreffer(null);
        }}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
          color: 'var(--ink-900)', background: 'var(--weiss)', outline: 'none',
        }}
      />

      {/* Autofill-Werte gehen als Hidden-Fields mit; ohne Treffer nur der Freitext-Name */}
      <input type="hidden" name={`${namePrefix}_name`} value={treffer?.name ?? ''} />
      <input type="hidden" name={`${namePrefix}_adresse`} value={treffer?.adresse ?? ''} />
      <input type="hidden" name={`${namePrefix}_bezirk`} value={treffer?.bezirk ?? ''} />
      <input type="hidden" name={`${namePrefix}_telefon`} value={treffer?.telefon ?? ''} />
      <input type="hidden" name={`${namePrefix}_lat`} value={treffer?.lat ?? ''} />
      <input type="hidden" name={`${namePrefix}_lng`} value={treffer?.lng ?? ''} />
      <input type="hidden" name={`${namePrefix}_photoUrl`} value={treffer?.photoUrl ?? ''} />
      <FreitextFallback namePrefix={namePrefix} inputRef={inputRef} hatTreffer={!!treffer} />

      {bekanntes && (
        <div
          style={{
            display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', alignItems: 'flex-start',
            background: bekanntes.art === 'vorgeschlagen' ? 'var(--pergament)' : 'var(--strafe-bg)',
            border: `1.5px solid ${bekanntes.art === 'vorgeschlagen' ? 'var(--gold)' : 'var(--strafe)'}`,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1.2 }}>{bekanntes.art === 'vorgeschlagen' ? '📍' : '⚠️'}</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: bekanntes.art === 'vorgeschlagen' ? 'var(--gold-700)' : 'var(--strafe)', lineHeight: 1.5 }}>
            {bekanntes.art === 'besucht' && <>Do warts’s scho! „{bekanntes.name}“ steht in eurer Chronik, und a Wirtshaus wird nie zweimal bsucht.</>}
            {bekanntes.art === 'eingeplant' && <>„{bekanntes.name}“ steht scho als nächster Stammtisch fest.</>}
            {bekanntes.art === 'vorgeschlagen' && <>„{bekanntes.name}“ {bekanntes.von ? `hat ${bekanntes.von} scho gfunden` : 'is scho vorgschlagen'}, steht als „Offen“ auf da Kartn.</>}
          </div>
        </div>
      )}

      {treffer && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', alignItems: 'center' }}>
          {treffer.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={treffer.photoUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--r-sm)', flex: 'none' }} />
          )}
          <div style={{ minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>✓ {treffer.name}</div>
            {treffer.adresse}
            {treffer.bezirk && <> · {treffer.bezirk}</>}
            {treffer.telefon && <> · ☎ {treffer.telefon}</>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Wenn Google nix liefert, zählt der getippte Text als Name. */
function FreitextFallback({
  namePrefix,
  inputRef,
  hatTreffer,
}: {
  namePrefix: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  hatTreffer: boolean;
}) {
  const [wert, setWert] = useState('');
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handler = () => setWert(el.value);
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [inputRef]);
  if (hatTreffer) return null;
  return <input type="hidden" name={`${namePrefix}_freitext`} value={wert} />;
}
