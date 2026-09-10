import type { Metadata, Viewport } from 'next';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/pirata-one/400.css';
import '@fontsource/libre-caslon-text/400.css';
import '@fontsource/libre-caslon-text/400-italic.css';
import './globals.css';
import { RegisterSW } from '@/components/shell/RegisterSW';
import { tenantConfigAusCookie } from '@/lib/session';
import { appUrl } from '@/lib/tenant-config';

/** Beschreibung wie bisher beim Gründer („… Der Stammtisch, München · seit 2019“), sonst aus der Config. */
function beschreibung(c: { motto: string | null; stadt: string | null; gruendungsjahr: number | null } | null): string {
  if (!c) return 'Die Stammtisch-App: Termine, Abstimmung, Kasse, Rangliste und Chronik für eure Runde.';
  const wo = [c.stadt, c.gruendungsjahr ? `seit ${c.gruendungsjahr}` : null].filter(Boolean).join(' · ');
  return `${c.motto ? `${c.motto} ` : ''}Der Stammtisch${wo ? `, ${wo}` : ''}`;
}

/**
 * Metadaten pro Mandant (aus dem Cookie): Name, Beschreibung, Icons. Das
 * Münchner Kindl bleibt dem Gründer (Feature muenchenBranding), alle anderen
 * kriegen das neutrale Wirtschaftln-Wappen.
 */
export async function generateMetadata(): Promise<Metadata> {
  const c = await tenantConfigAusCookie();
  const name = c?.name ?? 'Wirtschaftln';
  const muenchen = c?.features.muenchenBranding ?? false;
  return {
    metadataBase: new URL(appUrl()),
    title: name,
    description: beschreibung(c),
    robots: { index: false, follow: false },
    icons: muenchen
      ? { icon: '/brand/kindl-favicon.png', apple: '/brand/kindl-apple-icon.png' }
      : { icon: '/brand/shield-256.png', apple: '/brand/shield-512.png' },
    // Link-Vorschau (WhatsApp & Co.): Wappen auf Navy statt schwarzem Nichts
    openGraph: {
      siteName: name,
      title: name,
      description: beschreibung(c),
      locale: 'de_DE',
      type: 'website',
      images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
    },
    applicationName: name,
    appleWebApp: {
      capable: true,
      title: name,
      // 'default' + weißer theme-color: iOS färbt die Statusleiste wie den
      // Header (nahtlos weiß). black-translucent war ein Irrweg: iOS gibt
      // Web-Apps die unteren ~62px dann nicht her, d'Tab-Leiste kann nie
      // an d'Bildschirmkante (ausprobiert & gemessen, 29.08.2026).
      statusBarStyle: 'default',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // München-Branding (Alpen-Panorama am Desktop) nur für den Gründer-Mandanten
  const muenchen = (await tenantConfigAusCookie())?.features.muenchenBranding ?? false;
  return (
    <html lang="de">
      {/* suppressHydrationWarning: Browser-Extensions (z. B. ColorZilla) hängen
          Attribute an <body>, bevor React lädt, das ist kein App-Fehler. */}
      <body suppressHydrationWarning className={muenchen ? 'wn-muenchen' : undefined}>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
