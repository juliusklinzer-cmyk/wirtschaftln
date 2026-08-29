'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ds';

/**
 * 🤳 Dani-Modus, Hommage an Danis kaputtes Handy: ein 3px breiter weißer
 * Streifen läuft von oben bis unten übers Display, drin wird nix angezeigt.
 * Pro Gerät (localStorage), rein für d'Gaudi.
 */
const KEY = 'wn_dani_modus';
const EVENT = 'wn-dani-modus';

function istAn(): boolean {
  try {
    return localStorage.getItem(KEY) === 'an';
  } catch {
    return false;
  }
}

/** Der Streifen selbst, sitzt im App-Layout über allem (auch über Modals). */
export function DaniStreifen() {
  const [an, setAn] = useState(false);
  useEffect(() => {
    const lesen = () => setAn(istAn());
    lesen();
    window.addEventListener(EVENT, lesen);
    window.addEventListener('storage', lesen);
    return () => {
      window.removeEventListener(EVENT, lesen);
      window.removeEventListener('storage', lesen);
    };
  }, []);
  if (!an) return null;
  return (
    <>
      {/* Dezenter Schleier über der ganzen App, der Streifen liegt drüber und wirkt so mehr */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)',
          zIndex: 9998, pointerEvents: 'none',
        }}
      />
      {/* Der weiße Streifen, leuchtet mit leichtem Glow gegen den Schleier */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, bottom: 0, left: '61%', width: 5,
          background: '#fff', zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 0 14px 2px rgba(255,255,255,0.75)',
        }}
      />
    </>
  );
}

/** Der Schalter im Profil. */
export function DaniModusSchalter() {
  const [an, setAn] = useState(false);
  useEffect(() => setAn(istAn()), []);

  const umschalten = (neu: boolean) => {
    setAn(neu);
    try {
      localStorage.setItem(KEY, neu ? 'an' : 'aus');
    } catch {
      /* koa localStorage, dann halt koa Streifen */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
      <span style={{ fontSize: 26, flex: 'none', filter: an ? 'none' : 'grayscale(1) opacity(0.5)' }}>🤳</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Dani-Modus</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.4 }}>
          Der legendäre weiße Streifen vom Dani seim Handy, für’s authentische Gfui. Gilt nur auf dem Gerät.
        </div>
      </div>
      <Switch checked={an} onChange={umschalten} tone="gold" />
    </div>
  );
}
