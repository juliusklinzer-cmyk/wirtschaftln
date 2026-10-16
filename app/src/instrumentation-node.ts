import net from 'node:net';

// Node probiert IPv4 und IPv6 parallel und gibt jedem Verbindungsversuch nur
// 250 ms. Is der Server grad beschäftigt (Kompilieren, scrypt), bricht so a
// fetch zu Nominatim nach ~1 s mit ETIMEDOUT ab, und neue Stammtische standen
// ohne Kartenmitte da (Nachtest 15.10.2026). 3 s pro Versuch reichen locker.
net.setDefaultAutoSelectFamilyAttemptTimeout(3000);

// Abende schließen sich um 3 Uhr früh am Folgetag von allein (lib/abend.ts).
// Alle 5 Minuten nachschauen, erster Lauf kurz nach dem Start.
const ABEND_TAKT_MS = 5 * 60 * 1000;
async function abendTakt() {
  try {
    const { abendeAllerStammtischeSchliessen } = await import('./lib/abend');
    await abendeAllerStammtischeSchliessen();
  } catch (e) {
    console.error('[abend] Takt fehlgeschlagen:', e);
  }
}
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  setTimeout(abendTakt, 30 * 1000).unref();
  setInterval(abendTakt, ABEND_TAKT_MS).unref();
}
