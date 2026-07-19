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

export const metadata: Metadata = {
  title: 'Wirtschaftln',
  description: 'Oiwei anders. Oiwei dahoam. — Der Stammtisch, München · seit 2019',
  robots: { index: false, follow: false },
  applicationName: 'Wirtschaftln',
  appleWebApp: {
    capable: true,
    title: 'Wirtschaftln',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#07193A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      {/* suppressHydrationWarning: Browser-Extensions (z. B. ColorZilla) hängen
          Attribute an <body>, bevor React lädt — das ist kein App-Fehler. */}
      <body suppressHydrationWarning>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
