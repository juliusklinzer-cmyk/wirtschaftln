'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ds';

export type TabDef = { href: string; label: string; icon: string };

/** Wandernder Stammtisch (Gründer): mit Archiv-Karte. */
export const TABS_WANDERND: TabDef[] = [
  { href: '/', label: 'Hoam', icon: 'home' },
  { href: '/termin', label: 'Termin', icon: 'calendar' },
  { href: '/karte', label: 'Archiv', icon: 'map' },
  { href: '/spezln', label: 'Spezln', icon: 'trophy' },
  { href: '/kasse', label: 'Kasse', icon: 'coins' },
];

/** Stammhaus: immer dasselbe Wirtshaus, dafür a Wirtshaus-Lexikon (entdecken + bewerten). */
export const TABS_STAMMHAUS: TabDef[] = TABS_WANDERND.map((t) => (t.href === '/karte' ? { ...t, label: 'Lexikon' } : t));

/**
 * Tab-Leiste (Hoam-Redesign 13.10.2026, Basis 1c): Navy wia der Kopf, oben
 * a schmales Rautenband als Abschluss, der aktive Tab in Gold.
 */
export function TabBar({ tabs = TABS_WANDERND }: { tabs?: TabDef[] }) {
  const TABS = tabs;
  const pathname = usePathname();
  return (
    <nav
      style={{
        flex: 'none',
        background: 'var(--navy-900)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        className="wn-raute"
        aria-hidden
        style={{ height: 6, backgroundSize: '18px 18px', backgroundPosition: '9px 0, 9px 0, 0 0, 0 0' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
          padding: '10px 0 calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        {TABS.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="wn-press"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '2px 0',
                textDecoration: 'none',
                color: active ? 'var(--gold-bright)' : 'rgba(246,240,226,0.55)',
                transition: 'color var(--dur-base)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Beim Aktiv-Werden hüpft's Icon kurz (key remountet → Pop spielt genau einmal) */}
              <span
                key={active ? `${t.href}-an` : t.href}
                className={active ? 'wn-tab-pop' : undefined}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 28 }}
              >
                <Icon name={t.icon} size={26} stroke={active ? 2.4 : 1.9} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em' }}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
