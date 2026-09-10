'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, members, bindTenant } from '@/lib/db';
import { findGruppe, kontenFuerEmail } from '@/lib/db/directory';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, destroySession } from '@/lib/session';

export type LoginState = {
  error?: string;
  /** Passwort passt in mehreren Stammtischen → der Spezl sucht sich einen aus */
  gruppen?: Array<{ id: string; name: string }>;
};

// Brute-Force-Bremse: 5 Fehlversuche pro E-Mail → 15 Minuten Sperre.
// In-Memory reicht, die App läuft als einzelne Container-Instanz; nebenbei
// bremst die Sperre das synchrone scrypt (sonst DoS-Hebel ohne Account).
const MAX_FEHLVERSUCHE = 5;
const SPERRE_MS = 15 * 60_000;
// Dieselbe E-Mail darf in bis zu so vielen Stammtischen geprüft werden
// (Deckel für die scrypt-Kosten pro Login-Versuch).
const MAX_KANDIDATEN = 3;
const fehlversuche = new Map<string, { count: number; bis: number }>();
// Vergleich läuft auch bei unbekannter E-Mail (gleiches Timing, keine Enumeration).
const DUMMY_HASH = hashPassword(randomDummy());
function randomDummy() {
  return `dummy-${Math.random().toString(36).slice(2)}`;
}

type Kandidat = { gruppeId: string; member: typeof members.$inferSelect };

/**
 * Login über das Verzeichnis: E-Mail → Konten (eins pro Stammtisch), in jedem
 * Kandidaten-Mandanten das Mitglied nachschlagen. Nur Mandanten, in denen
 * das Passwort passt, kommen in die Auswahl — so verrät die Gruppenliste
 * nix über fremde Konten.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const gewaehlt = String(formData.get('gruppe') ?? '').trim();
  if (!email || !password) return { error: 'Bitte E-Mail und Passwort eingeben.' };

  const sperre = fehlversuche.get(email);
  if (sperre && sperre.count >= MAX_FEHLVERSUCHE) {
    if (Date.now() < sperre.bis) return { error: 'Z’viele Fehlversuche, probier’s in a Viertelstund nomoi.' };
    fehlversuche.delete(email);
  }

  let konten = kontenFuerEmail(email);
  if (gewaehlt) konten = konten.filter((k) => k.gruppeId === gewaehlt);
  const kandidaten: Kandidat[] = [];
  for (const konto of konten.slice(0, MAX_KANDIDATEN)) {
    if (!bindTenant(konto.gruppeId)) continue;
    const member = db.select().from(members).where(eq(members.email, email)).get();
    if (member) kandidaten.push({ gruppeId: konto.gruppeId, member });
  }

  const passende = kandidaten.filter((k) => verifyPassword(password, k.member.passwordHash));
  // Unbekannte E-Mail: trotzdem einmal scrypt rechnen (gleiches Timing)
  if (kandidaten.length === 0) verifyPassword(password, DUMMY_HASH);

  if (passende.length === 0) {
    if (fehlversuche.size > 500) {
      for (const [k, v] of fehlversuche) if (Date.now() >= v.bis) fehlversuche.delete(k);
    }
    const f = fehlversuche.get(email) ?? { count: 0, bis: 0 };
    fehlversuche.set(email, { count: f.count + 1, bis: Date.now() + SPERRE_MS });
    return { error: 'Des passt ned, E-Mail oder Passwort falsch.' };
  }
  fehlversuche.delete(email);

  if (passende.length > 1) {
    return {
      gruppen: passende.map((k) => ({ id: k.gruppeId, name: findGruppe(k.gruppeId)?.name ?? k.gruppeId })),
    };
  }

  const { gruppeId, member } = passende[0];
  if (member.status !== 'aktiv') {
    return { error: 'Dein Antrag läuft noch, a bisserl Geduld.' };
  }
  // Nach der Kandidaten-Schleife nochmal sauber auf den Ziel-Mandanten binden
  bindTenant(gruppeId);
  await createSession(member.id);
  // Erstanmeldung: zuerst Passwort setzen und Profil ausfüllen
  redirect(member.erstanmeldung ? '/profil' : '/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}
