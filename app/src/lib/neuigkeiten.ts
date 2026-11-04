/**
 * „Was ist neu“ (Julius, 04.11.2026): nach einem Update sieht jeder Spezl
 * beim nächsten Öffnen einmal die Neuerungen als Slides. Neue Ausgabe = neue
 * Kennung hier und neue Slides in components/neuigkeiten/neuigkeiten.tsx.
 */
export const NEUIGKEITEN_AUSGABE = '2026-11-strafenkatalog';

/** Wer erst ab diesem Tag dabei ist, kennt's eh scho aus den Erklär-Slides. */
export const NEUIGKEITEN_AB = '2026-11-05';

export function neuigkeitenZeigen(m: { neuigkeitenGesehen: string | null; erstanmeldung: boolean; createdAt: string }): boolean {
  return m.neuigkeitenGesehen !== NEUIGKEITEN_AUSGABE && !m.erstanmeldung && m.createdAt.slice(0, 10) < NEUIGKEITEN_AB;
}
