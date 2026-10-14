'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ds';
import { PunkteInfo } from '@/components/domain/PunkteInfo';
// Einzel-Imports: das Barrel „@phosphor-icons/react“ zieht 1500 Icons in den Dev-Bundle
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal';
import { UserPlus } from '@phosphor-icons/react/dist/ssr/UserPlus';
import { Bell } from '@phosphor-icons/react/dist/ssr/Bell';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/dist/lib/types';

const TITLES: Record<string, string> = {
  '/termin': 'Termin & Abstimmung',
  '/karte': 'Archiv',
  '/spezln': 'Rang',
  '/kasse': 'Vereinskasse',
  '/profil': 'Mei Profil',
  '/stammtisch': 'Stammtisch',
  '/einladen': 'Spezln einladen',
};

/**
 * Kopfzeile (Hoam-Redesign 13.10.2026, Basis 1a/1b): Navy wia die Tab-Leiste,
 * Wortmarke in Fraktur, rechts die eigene WP-Pill und das Profilbild. Drunter
 * das Rautenband. Antippen vom Profilbild öffnet das Profil-Menü als Vollbild.
 */
export function AppBar({
  appName = 'Wirtschaftln',
  logoSrc = '/brand/shield-256.png',
  name,
  photoUrl,
  isAdmin,
  saison,
  wp,
  rang,
  badges,
  amt,
  onLogout,
}: {
  /** Name des Stammtischs (Tenant-Config), Wortmarke im Header */
  appName?: string;
  /** Logo links oben: eigenes Stammtisch-Logo oder das Wirtschaftln-Wappen */
  logoSrc?: string;
  name: string;
  photoUrl: string | null;
  isAdmin: boolean;
  saison: string;
  /** Eigene Saison-WP, steht als Pill neben dem Profilbild. */
  wp: number;
  /** Eigener Platz in der Saison-Rangliste (0 = no koane Punkte). */
  rang: number;
  /** Getragene Badges + Ämter (fürs Profil-Menü). */
  badges: number;
  /** Aktuelles Amt („Präsident“), falls eins. */
  amt: string | null;
  onLogout: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p) && p !== '/')?.[1];

  // Seitenwechsel aus dem Menü raus → Menü zua
  useEffect(() => setMenu(false), [pathname]);

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

  // Karte, Rang und Kasse: Vollbild ohne Kopfleiste (Julius, 29.08.2026 bzw. Redesign 13./14.10.2026)
  if (pathname.startsWith('/karte') || pathname.startsWith('/spezln') || pathname.startsWith('/kasse') || pathname.startsWith('/profil')) return null;

  return (
    <header
      style={{
        flex: 'none',
        background: 'var(--navy-900)',
        color: 'var(--pergament)',
        position: 'relative',
        zIndex: 20,
        // Header is Bedien-Chrome: ned markierbar, koa Callout beim Draufhalten
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: 'calc(10px + env(safe-area-inset-top)) 16px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {logoSrc.startsWith('/brand/') ? (
            <Image src={logoSrc} alt="" width={30} height={30} style={{ height: 30, width: 'auto' }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" width={30} height={30} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
          )}
          {title ? (
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pergament)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          ) : (
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--pergament)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appName}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <div style={{ position: 'relative' }}>
            {wpDelta != null && (
              <>
                <style>{`@keyframes wnWpFlug { 0% { transform: translateY(4px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-18px); opacity: 0; } }`}</style>
                <span
                  className="wn-tnum"
                  style={{
                    position: 'absolute', right: 4, top: -14, fontSize: 12, fontWeight: 800,
                    color: 'var(--gold-bright)', pointerEvents: 'none', whiteSpace: 'nowrap',
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
                display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 12px',
                borderRadius: 999, border: '1.5px solid rgba(208,173,102,0.5)',
                fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)', textDecoration: 'none',
                transform: wpDelta != null ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {wp}
              <span>WP</span>
            </Link>
          </div>
          <button
            onClick={() => setMenu(true)}
            className="wn-press"
            style={{
              border: '2px solid var(--gold)', background: 'var(--muc-blau)', padding: 0, cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%', display: 'inline-flex', overflow: 'hidden',
            }}
            aria-label="Profil-Menü öffnen"
          >
            <Avatar src={photoUrl} name={name} size={32} style={{ margin: 0 }} />
          </button>
        </div>
      </div>
      <div className="wn-raute wn-raute--sm" aria-hidden style={{ height: 8 }} />

      {menu && (
        <ProfilMenue
          name={name}
          photoUrl={photoUrl}
          isAdmin={isAdmin}
          saison={saison}
          wp={wp}
          rang={rang}
          badges={badges}
          amt={amt}
          onLogout={onLogout}
          onClose={() => setMenu(false)}
        />
      )}
    </header>
  );
}

/**
 * Profil-Menü als Vollbild (Basis 1b): Kopf mit Profilbild und Amt, drei
 * Kacheln (Punkte, Platz, Badges), die Menü-Zeilen und ganz unten Abmelden.
 */
function ProfilMenue({
  name,
  photoUrl,
  isAdmin,
  saison,
  wp,
  rang,
  badges,
  amt,
  onLogout,
  onClose,
}: {
  name: string;
  photoUrl: string | null;
  isAdmin: boolean;
  saison: string;
  wp: number;
  rang: number;
  badges: number;
  amt: string | null;
  onLogout: () => Promise<void>;
  onClose: () => void;
}) {
  // Benachrichtigungen: An/Aus pro Gerät (Push-Abo vorhanden?)
  const [push, setPush] = useState<'An' | 'Aus' | ''>('');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setPush(sub ? 'An' : 'Aus');
    }).catch(() => {});
  }, []);

  // Für Link UND Button gleich: nur a Haarlinie unten, sonst koa Rahmen
  const zeileStil: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14, minHeight: 54, padding: '0 16px',
    borderWidth: '0 0 1px 0', borderStyle: 'solid', borderColor: 'var(--ink-50)',
    textDecoration: 'none', color: 'var(--ink-900)', fontFamily: 'var(--font-ui)',
    background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer',
  };
  // Zeilen mit Phosphor-Icons, exakt wia im Design (1b)
  const Zeile = ({ icon: Ikon, label, hint }: { icon: PhosphorIcon; label: string; hint?: string }) => (
    <>
      <span style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'var(--info-bg)', color: 'var(--muc-blau)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ikon size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700 }}>{label}</span>
      {hint && <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-300)' }}>{hint}</span>}
      <CaretRight size={16} color="var(--ink-200)" />
    </>
  );
  const kachel: React.CSSProperties = { borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 };
  const kachelLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };

  return (
    <div
      className="wn-profil-auf"
      role="dialog"
      aria-label="Profil-Menü"
      style={{
        position: 'fixed', inset: 0, zIndex: 60, maxWidth: 'var(--container-app)', margin: '0 auto',
        background: 'var(--ink-50)', color: 'var(--ink-900)', display: 'flex', flexDirection: 'column',
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      <div
        className="wn-scroll-still"
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
          padding: 'calc(16px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 4px 0' }}>
          <span style={{ display: 'inline-flex', borderRadius: '50%', border: '2.5px solid var(--gold)', flex: 'none' }}>
            <Avatar src={photoUrl} name={name} size={60} />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-700)' }}>
              {amt ?? (isAdmin ? 'Verwaltung' : 'Spezl')} · {saison}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menü schließen"
            className="wn-press"
            style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div style={{ ...kachel, background: 'var(--navy)' }}>
            <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold-bright)' }}>{wp}</span>
            <span style={{ ...kachelLabel, color: 'rgba(246,240,226,0.7)' }}>Punkte</span>
          </div>
          <div style={{ ...kachel, background: 'var(--weiss)' }}>
            <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{rang > 0 ? `${rang}.` : '–'}</span>
            <span style={{ ...kachelLabel, color: 'var(--ink-500)' }}>Platz</span>
          </div>
          <div style={{ ...kachel, background: 'var(--weiss)' }}>
            <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{badges}</span>
            <span style={{ ...kachelLabel, color: 'var(--ink-500)' }}>Badges</span>
          </div>
        </div>

        <div style={{ background: 'var(--weiss)', borderRadius: 18, overflow: 'hidden' }}>
          <Link href="/profil" style={zeileStil}><Zeile icon={UserCircle} label="Mein Profil" hint="Steckbrief" /></Link>
          <Link href="/profil#badges" style={zeileStil}><Zeile icon={Medal} label="Badges & Ämter" hint={String(badges)} /></Link>
          <Link href="/einladen" style={zeileStil}><Zeile icon={UserPlus} label="Spezl einladen" /></Link>
          <Link href="/profil#push" style={zeileStil}><Zeile icon={Bell} label="Benachrichtigungen" hint={push || undefined} /></Link>
          <PunkteInfo
            knopf={(oeffnen) => (
              <button type="button" onClick={oeffnen} style={zeileStil}>
                <Zeile icon={Info} label="Punktesystem" />
              </button>
            )}
          />
          <Link href="/willkommen" style={{ ...zeileStil, ...(isAdmin ? {} : { borderWidth: 0 }) }}><Zeile icon={BookOpen} label="So geht’s" hint="Erklär-Slides" /></Link>
          {isAdmin && (
            <Link href="/stammtisch" style={{ ...zeileStil, borderWidth: 0 }}><Zeile icon={Gear} label="Stammtisch verwalten" /></Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => onLogout()}
          className="wn-press"
          style={{
            marginTop: 'auto', minHeight: 52, borderRadius: 16, border: 'none', background: 'var(--weiss)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, color: 'var(--strafe)',
          }}
        >
          <SignOut size={18} />
          Abmelden
        </button>
      </div>
    </div>
  );
}
