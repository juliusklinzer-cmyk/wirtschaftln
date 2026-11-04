'use client';

import { useEffect } from 'react';

/**
 * Glas-Leiste: Im black-translucent-Modus schiebt iOS die Web-App um die
 * Höhe der Statusleiste hoch und lässt unten einen Spalt (29.08.: ~62 px am
 * iPhone 17 Pro Max). Ist das Fenster als Home-Bildschirm-App kürzer als der
 * Bildschirm, strecken wir den App-Rahmen auf die volle Bildschirmhöhe
 * (--wn-app-h, siehe .wn-app-rahmen in globals.css).
 */
export function GlasHoehe() {
  useEffect(() => {
    const messen = () => {
      // navigator.standalone gibt's nur auf iOS: Android hat echte Systemleisten, da wird nix gestreckt
      const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const hochkant = innerHeight > innerWidth;
      const schirm = Math.max(screen.width, screen.height);
      if (standalone && hochkant && schirm - innerHeight > 8) document.documentElement.style.setProperty('--wn-app-h', `${schirm}px`);
      else document.documentElement.style.removeProperty('--wn-app-h');
    };
    messen();
    addEventListener('resize', messen);
    return () => removeEventListener('resize', messen);
  }, []);
  return null;
}
