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
        // Fix an der ECHTEN Bildschirm-Unterkante verankert: iOS (Vollbild-
        // Modus) gibt dem App-Rahmen unten sonst eine verkürzte Fläche und
        // d'Leiste „schwebt". Auf Android/alten iPhones ändert sich optisch
        // nix, nur die Befestigung.
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 45,
        maxWidth: 'var(--container-app)',
        margin: '0 auto',
        display: 'flex',
        background: 'var(--weiss)',
        borderTop: '1px solid var(--ink-100)',
        // Safe-Area unten nur teilweise mitnehmen: volle 34px Insel-Abstand
        // schieben d'Icons ~1cm hoch (Julius, 29.08.) — knapp überm
        // Home-Balken schaut's dichter und wertiger aus
        padding: '8px 6px max(10px, calc(env(safe-area-inset-bottom) - 14px))',
        boxShadow: '0 -4px 20px rgba(12,43,90,0.06)',
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '2px 0',
              textDecoration: 'none',
              color: active ? 'var(--muc-blau)' : 'var(--ink-300)',
              transition: 'color var(--dur-base)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Aktiver Tab kriegt a Pill hinterm Icon; beim Wechsel hüpft's kurz
                (key remountet beim Aktiv-Werden → Pop spielt genau einmal) */}
            <span
              key={active ? `${t.href}-an` : t.href}
              className={active ? 'wn-tab-pop' : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 46, height: 27, borderRadius: 999,
                background: active ? 'var(--info-bg)' : 'transparent',
                transition: 'background 200ms var(--ease-standard)',
              }}
            >
              <Icon name={t.icon} size={23} stroke={active ? 2.4 : 2} />
            </span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: '0.02em' }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
