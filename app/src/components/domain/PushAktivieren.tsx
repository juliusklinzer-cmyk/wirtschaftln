'use client';

import { useEffect, useState } from 'react';
import { pushAbonnieren } from '@/app/(app)/termin/actions';

function base64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Dezenter Hinweis, solange das Gerät noch keine Push-Benachrichtigungen
 * abonniert hat (z. B. für „Reserviert"-Meldungen). Verschwindet nach dem Abo.
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
      // Nutzer hat abgelehnt oder Browser mag nicht — Hinweis einfach stehen lassen
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <button
      onClick={aktivieren}
      disabled={laeuft}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '12px 14px', background: 'var(--weiss)', border: '1.5px dashed var(--ink-200)',
        borderRadius: 'var(--r-lg)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
      }}
    >
      <span style={{ fontSize: 20 }}>🔔</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>
          {laeuft ? 'Moment…' : 'Benachrichtigungen aktivieren'}
        </span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
          Bescheid kriegen, wenn’s nächste Wirtshaus reserviert is.
        </span>
      </span>
    </button>
  );
}
