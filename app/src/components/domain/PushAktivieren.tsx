'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ds';
import { pushAbonnieren } from '@/app/(app)/termin/actions';

function base64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Hinweis-Zeile über der Termin-Karte (Zustand 3b), solange das Gerät noch
 * keine Push-Benachrichtigungen abonniert hat. Verschwindet nach dem Einschalten.
 */
export function PushAktivieren() {
  const [zeigen, setZeigen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission === 'denied') return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) setZeigen(true);
    });
  }, []);

  if (!zeigen) return null;

  const aktivieren = async () => {
    setLaeuft(true);
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(key).buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await pushAbonnieren({ endpoint: sub.endpoint, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } });
      setZeigen(false);
    } catch {
      // Nutzer hat abgelehnt oder Browser mag nicht, Hinweis einfach stehen lassen
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--info-bg)' }}>
      <Icon name="bell-ring" size={22} color="var(--muc-blau)" />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Benachrichtigungen an?</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Wir sagen dir, sobald reserviert ist.</span>
      </div>
      <button
        type="button"
        className="wn-press"
        onClick={aktivieren}
        disabled={laeuft}
        style={{
          flex: 'none', height: 34, padding: '0 14px', border: 'none', borderRadius: 'var(--r-sm)',
          background: 'var(--muc-blau)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800,
          cursor: laeuft ? 'default' : 'pointer', opacity: laeuft ? 0.7 : 1,
        }}
      >
        {laeuft ? 'Moment…' : 'Einschalten'}
      </button>
    </div>
  );
}
