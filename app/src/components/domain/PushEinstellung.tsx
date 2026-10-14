'use client';

import { useEffect, useState } from 'react';
import { BellRinging } from '@phosphor-icons/react/dist/ssr/BellRinging';
import { BellSlash } from '@phosphor-icons/react/dist/ssr/BellSlash';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Switch } from '@/components/ds';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';
import { pushAbonnieren, pushAbbestellen } from '@/app/(app)/termin/actions';

function base64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Stand = 'laedt' | 'unmoeglich' | 'blockiert' | 'aus' | 'an';

/**
 * Service-Worker-Registrierung holen; fehlt sie (lokal registriert RegisterSW
 * bewusst ned), wird sie hier fürs Push-Abo nachgeholt.
 */
async function swRegistrierung(anlegen: boolean): Promise<ServiceWorkerRegistration | null> {
  const vorhanden = await navigator.serviceWorker.getRegistration();
  if (vorhanden) return vorhanden;
  if (!anlegen) return null;
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Benachrichtigungen im Profil ein-/ausschalten, pro Gerät. Hat wer die
 * Browser-Abfrage amoi abgelehnt, kann die App ned mehr nachfragen — dann
 * steht hier, wo man's im Handy wieder freigibt.
 */
export function PushEinstellung() {
  const [stand, setStand] = useState<Stand>('laedt');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const ermitteln = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStand('unmoeglich');
      return;
    }
    if (Notification.permission === 'denied') {
      setStand('blockiert');
      return;
    }
    try {
      const reg = await swRegistrierung(false);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setStand(sub ? 'an' : 'aus');
    } catch {
      setStand('aus');
    }
  };

  useEffect(() => {
    void ermitteln();
    // Zurück aus den Einstellungen (Tab-Wechsel) → Stand neu lesen
    const sichtbar = () => { if (document.visibilityState === 'visible') void ermitteln(); };
    document.addEventListener('visibilitychange', sichtbar);
    return () => document.removeEventListener('visibilitychange', sichtbar);
  }, []);

  const einschalten = async () => {
    setLaeuft(true);
    setFehler(null);
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setFehler('Push is auf dem Server ned eingerichtet.');
        return;
      }
      const reg = (await swRegistrierung(true))!;
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(key).buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await pushAbonnieren({ endpoint: sub.endpoint, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } });
      setStand('an');
    } catch {
      if (Notification.permission === 'denied') setStand('blockiert');
      else setFehler('Hat ned klappt, probier’s nomoi.');
    } finally {
      setLaeuft(false);
    }
  };

  const ausschalten = async () => {
    setLaeuft(true);
    setFehler(null);
    try {
      const reg = await swRegistrierung(false);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await pushAbbestellen(sub.endpoint);
        await sub.unsubscribe();
      }
      setStand('aus');
    } catch {
      setFehler('Hat ned klappt, probier’s nomoi.');
    } finally {
      setLaeuft(false);
    }
  };

  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  const an = stand === 'an';
  const unter =
    stand === 'laedt' ? 'schau nach …'
    : stand === 'unmoeglich' ? 'geht in diesem Browser nicht'
    : stand === 'blockiert' ? 'vom Handy blockiert'
    : an ? 'auf diesem Gerät an' : 'auf diesem Gerät aus';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <EinstellungZeile
        icon={an ? <BellRinging size={19} weight="fill" /> : <BellSlash size={19} weight="fill" />}
        iconFarbe={an ? 'var(--navy)' : 'var(--ink-500)'}
        titel="Benachrichtigungen"
        unter={unter}
        rechts={(stand === 'an' || stand === 'aus') ? <Switch checked={an} onChange={(neu: boolean) => (laeuft ? undefined : neu ? void einschalten() : void ausschalten())} /> : null}
      />
      {stand === 'aus' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: 'var(--info-bg)', marginBottom: 8 }}>
          <Info size={18} color="var(--muc-blau)" style={{ flex: 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--navy)' }}>Ohne Benachrichtigung verpasst du Umfragen und den Check-in.</span>
        </div>
      )}
      {stand === 'unmoeglich' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: 'var(--info-bg)', marginBottom: 8 }}>
          <Info size={18} color="var(--muc-blau)" style={{ flex: 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--navy)' }}>Am iPhone: die App erst zum Home-Bildschirm hinzufügen, dann geht’s.</span>
        </div>
      )}
      {stand === 'blockiert' && (
        <div style={{ padding: '10px 12px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5, marginBottom: 8 }}>
          {ios ? (
            <>
              <b>iPhone:</b> Einstellungen, Mitteilungen, in der Liste die App auswählen, „Mitteilungen erlauben“ einschalten. Danach hier nochmal vorbeischauen.
            </>
          ) : (
            <>
              <b>Android/Chrome:</b> in der Adressleiste aufs Schloss-Symbol, Berechtigungen, Benachrichtigungen, Zulassen. Bei der installierten App: Handy-Einstellungen, Apps, die App, Benachrichtigungen. Danach hier nochmal vorbeischauen.
            </>
          )}
        </div>
      )}
      {fehler && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)', marginBottom: 8 }}>{fehler}</div>}
    </div>
  );
}
