'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ds';

const TITLES: Record<string, string> = {
  '/termin': 'Termin & Abstimmung',
  '/karte': 'Archiv',
  '/spezln': 'Spezln',
  '/kasse': 'Vereinskasse',
};

export function AppBar({
  name,
  photoUrl,
  isAdmin,
  saison,
  onLogout,
}: {
  name: string;
  photoUrl: string | null;
  isAdmin: boolean;
  saison: string;
  onLogout: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p) && p !== '/')?.[1];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(8px + env(safe-area-inset-top)) 16px 12px',
        flex: 'none',
        borderBottom: '1px solid var(--ink-100)',
        background: 'var(--weiss)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/brand/shield-256.png" alt="" width={34} height={34} style={{ height: 34, width: 'auto' }} />
        <div>
          {title ? (
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{title}</div>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--navy)', lineHeight: 1 }}>
                Wirtschaftln
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>
                {saison}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setMenu((m) => !m)}
        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        aria-label="Profil"
      >
        <Avatar src={photoUrl} name={name} size={36} ring={isAdmin} />
      </button>

      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div
            style={{
              position: 'absolute',
              top: 54,
              right: 16,
              zIndex: 31,
              width: 210,
              background: 'var(--weiss)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--sh-lg)',
              border: '1px solid var(--ink-100)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--pergament)' }}>
              <Avatar src={photoUrl} name={name} size={40} ring={isAdmin} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-700)' }}>
                  {isAdmin ? 'Verwaltung' : 'Mitglied'}
                </div>
              </div>
            </div>
            <button
              onClick={() => onLogout()}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '13px 14px',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--strafe)',
              }}
            >
              Abmelden
            </button>
          </div>
        </>
      )}
    </header>
  );
}
