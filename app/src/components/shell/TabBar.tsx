'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ds';

const TABS = [
  { href: '/', label: 'Hoam', icon: 'home' },
  { href: '/termin', label: 'Termin', icon: 'calendar' },
  { href: '/karte', label: 'Archiv', icon: 'map' },
  { href: '/spezln', label: 'Spezln', icon: 'users' },
  { href: '/kasse', label: 'Kasse', icon: 'beer' },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        flex: 'none',
        display: 'flex',
        background: 'var(--weiss)',
        borderTop: '1px solid var(--ink-100)',
        padding: '8px 6px calc(10px + env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 20px rgba(12,43,90,0.06)',
      }}
    >
      {TABS.map((t) => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '4px 0',
              textDecoration: 'none',
              color: active ? 'var(--muc-blau)' : 'var(--ink-300)',
              transition: 'color var(--dur-base)',
            }}
          >
            <Icon name={t.icon} size={23} stroke={active ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: '0.02em' }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
