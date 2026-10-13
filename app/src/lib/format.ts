/** Deutsche Formatierung: 184,50 € (Betrag in Cent). */
export function euro(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** "Donnerstag, 11. Juli" aus ISO-Datum. */
export function datumLang(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** "Do, 23. Juli" aus ISO-Datum (kurzer Wochentag ohne Punkt, langer Monat), für die Termin-Karte auf Hoam. */
export function datumMittel(iso: string): string {
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })
    .replace('.,', ',');
}

/** "11. Apr" aus ISO-Datum. */
export function datumKurz(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

export function heuteIso(): string {
  return new Date().toISOString().slice(0, 10);
}
