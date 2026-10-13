'use client';

import { WertungFelder } from '@/components/domain/WertungFelder';
import type { MeiBewertungWerte } from '@/components/domain/MeiBewertung';

/**
 * „Deine Wertung“ im Abschluss-Zettel: der Abschließer bewertet im selben
 * Zug mit (Julius, 14.09.2026), koa zweiter Schritt. Vorbelegt aus „Mei
 * Bewertung“, anpassen geht danach a Woch’ lang. Seit dem Termin-Redesign
 * (13.10.2026) dieselben Felder wie überall: WertungFelder.
 */
export function EigeneWertung({
  werte,
  brodn,
  onBrodn,
  ohneSterne = false,
}: {
  werte: MeiBewertungWerte;
  brodn?: boolean;
  onBrodn?: (an: boolean) => void;
  ohneSterne?: boolean;
}) {
  return <WertungFelder werte={werte} brodn={brodn} onBrodn={onBrodn} ohneSterne={ohneSterne} />;
}
