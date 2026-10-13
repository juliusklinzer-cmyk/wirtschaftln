'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Einzel-Imports: das Barrel „@phosphor-icons/react“ zieht 1500 Icons in den Dev-Bundle
import { HouseLine } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { Coins } from '@phosphor-icons/react/dist/ssr/Coins';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/dist/lib/types';

export type TabDef = { href: string; label: string; icon: PhosphorIcon };

/** Wandernder Stammtisch (Gründer): Karte mit Archiv. Icons und Labels wia im Design (Menü 1c). */
export const TABS_WANDERND: TabDef[] = [
  { href: '/', label: 'Hoam', icon: HouseLine },
  { href: '/termin', label: 'Termin', icon: CalendarCheck },
  { href: '/karte', label: 'Karte', icon: MapPin },
  { href: '/spezln', label: 'Rang', icon: Trophy },
  { href: '/kasse', label: 'Kasse', icon: Coins },
];

/** Stammhaus: immer dasselbe Wirtshaus, dafür a Wirtshaus-Lexikon (entdecken + bewerten). */
export const TABS_STAMMHAUS: TabDef[] = TABS_WANDERND.map((t) => (t.href === '/karte' ? { ...t, label: 'Lexikon' } : t));

/**
 * Tab-Leiste (Hoam-Redesign 13.10.2026, Basis 1c): Navy wia der Kopf, oben
 * a schmales Rautenband als Abschluss, der aktive Tab in Gold mit gefülltem Icon.
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
          const Ikon = t.icon;
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
                <Ikon size={26} weight={active ? 'fill' : 'regular'} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em' }}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
