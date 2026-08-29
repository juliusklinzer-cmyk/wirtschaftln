import type { MeiBewertungWerte } from '@/components/domain/MeiBewertung';

type BesuchZeile = {
  memberId: string;
  anwesend: boolean;
  sterne: number | null;
  kommentar: string | null;
  kaiserschmarrn: number;
  kaiserSterne: number | null;
  kaiserNotiz: string | null;
  schweinsbraten: number;
  brodnSterne: number | null;
  brodnNotiz: string | null;
};

/**
 * Eigene Bewertung + bisheriger Team-Schnitt für die „Mei Bewertung"-Klappe.
 * Wird auf der Termin-Seite UND in der Heim-Karte „So is' glaufen" gebraucht.
 */
export function bewertungsDaten(besuche: BesuchZeile[], meId: string) {
  const mein = besuche.find((b) => b.memberId === meId) ?? null;
  const initial: MeiBewertungWerte = {
    sterne: mein?.sterne ?? null,
    kommentar: mein?.kommentar ?? '',
    kaisiProbiert: (mein?.kaiserschmarrn ?? 0) > 0 || mein?.kaiserSterne != null,
    kaiserSterne: mein?.kaiserSterne ?? null,
    kaiserNotiz: mein?.kaiserNotiz ?? '',
    brodnGessen: (mein?.schweinsbraten ?? 0) > 0 || mein?.brodnSterne != null,
    brodnSterne: mein?.brodnSterne ?? null,
    brodnNotiz: mein?.brodnNotiz ?? '',
  };
  const werte = besuche.filter((b) => b.anwesend && b.sterne != null).map((b) => b.sterne!);
  const team = { schnitt: werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : 0, anzahl: werte.length };
  return { mein, initial, team };
}
