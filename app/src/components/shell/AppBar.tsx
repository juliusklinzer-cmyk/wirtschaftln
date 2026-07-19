'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ds';

const TITLES: Record<string, string> = {
  '/termin': 'Termin & Abstimmung',
  '/karte': 'Archiv',
  '/spezln': 'Spezln',
  '/kasse': 'Vereinskasse',
  '/profil': 'Mei Profil',
};

export function AppBar({
  name,
  photoUrl,
  isAdmin,
  saison,
  wp,
  onLogout,
}: {
  name: string;
  photoUrl: string | null;
  isAdmin: boolean;
  saison: string;
  /** Eigene Saison-WP — steht als Pill neben dem Profilbild. */
  wp: number;
  onLogout: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p) && p !== '/')?.[1];

  // Menü schließen bei Tap außerhalb ODER beim Scrollen — OHNE ein Vollbild-Overlay,
  // das sonst die Scroll-Geste vom Seiteninhalt abfängt (nerviger Handy-Bug).
  useEffect(() => {
    if (!menu) return;
    const ausserhalb = (e: Event) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setMenu(false);
    };
    const beiScroll = () => setMenu(false);
    document.addEventListener('pointerdown', ausserhalb);
    window.addEventListener('scroll', beiScroll, true);
    return () => {
      document.removeEventListener('pointerdown', ausserhalb);
      window.removeEventListener('scroll', beiScroll, true);
    };
  }, [menu]);

  // Frisch verdiente Punkte zählen sichtbar hoch: kleiner „+n WP"-Flug an der Pill
  const [wpDelta, setWpDelta] = useState<number | null>(null);
  const vorherWp = useRef(wp);
  useEffect(() => {
    const delta = wp - vorherWp.current;
    vorherWp.current = wp;
    if (delta > 0) {
      setWpDelta(delta);
      const timer = setTimeout(() => setWpDelta(null), 1600);
      return () => clearTimeout(timer);
    }
  }, [wp]);

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          {wpDelta != null && (
            <>
              <style>{`@keyframes wnWpFlug { 0% { transform: translateY(4px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-18px); opacity: 0; } }`}</style>
              <span
                className="wn-tnum"
                style={{
                  position: 'absolute', right: 4, top: -14, fontSize: 12, fontWeight: 800,
                  color: 'var(--gold-700)', pointerEvents: 'none', whiteSpace: 'nowrap',
                  animation: 'wnWpFlug 1.4s ease-out both',
                }}
              >
                +{wpDelta} WP
              </span>
            </>
          )}
          <Link
            href="/spezln"
            className="wn-tnum"
            style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 4, padding: '4px 11px',
              borderRadius: 999, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)',
              fontSize: 13, fontWeight: 800, color: 'var(--navy)', textDecoration: 'none',
              transform: wpDelta != null ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {wp}
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold-700)' }}>WP</span>
          </Link>
        </div>
        <button
          ref={buttonRef}
          onClick={() => setMenu((m) => !m)}
          style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
          aria-label="Profil"
        >
          <Avatar src={photoUrl} name={name} size={36} ring={isAdmin} />
        </button>
      </div>

      {menu && (
        <>
          <div
            ref={menuRef}
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
            <Link
              href="/profil"
              onClick={() => setMenu(false)}
              style={{
                display: 'block',
                padding: '13px 14px',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink-900)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--ink-100)',
              }}
            >
              🍺 Mei Profil
            </Link>
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
