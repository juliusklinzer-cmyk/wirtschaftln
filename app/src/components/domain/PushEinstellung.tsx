'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ds';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26, flex: 'none', filter: stand === 'an' ? 'none' : 'grayscale(1) opacity(0.5)' }}>🔔</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Benachrichtigungen</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.4 }}>
            {stand === 'laedt' && 'Schau nach…'}
            {stand === 'unmoeglich' && 'Der Browser kann koa Push. Am iPhone: d’App erst zum Home-Bildschirm hinzufügen.'}
            {stand === 'blockiert' && 'Vom Handy blockiert. Freigeben geht nur in den Einstellungen, ned in der App.'}
            {stand === 'aus' && 'Bescheid kriegen bei neuem Termin, Reservierung, Kasse und Badges. Gilt für dieses Gerät.'}
            {stand === 'an' && 'An auf diesem Gerät: neuer Termin, Reservierung, Kasse, Badges.'}
          </div>
        </div>
        {(stand === 'an' || stand === 'aus') && (
          <Switch checked={stand === 'an'} onChange={(neu: boolean) => (laeuft ? undefined : neu ? void einschalten() : void ausschalten())} tone="gold" />
        )}
      </div>

      {stand === 'blockiert' && (
        <div style={{ padding: '10px 12px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>
          {ios ? (
            <>
              <b>iPhone:</b> Einstellungen → Mitteilungen → in der Liste die App auswählen → „Mitteilungen erlauben“ einschalten. Danach hier nomoi vorbeischauen.
            </>
          ) : (
            <>
              <b>Android/Chrome:</b> in der Adressleiste aufs Schloss-Symbol → Berechtigungen → Benachrichtigungen → Zulassen. Bei der installierten App: Handy-Einstellungen → Apps → die App → Benachrichtigungen. Danach hier nomoi vorbeischauen.
            </>
          )}
        </div>
      )}
      {fehler && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</div>
      )}
    </div>
  );
}
