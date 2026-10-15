/** Läuft einmal beim Serverstart (Next-Konvention), Node-Teil nur im Node-Runtime. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
