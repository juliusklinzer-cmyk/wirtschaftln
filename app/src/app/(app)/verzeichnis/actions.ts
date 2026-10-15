'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, members, runWithTenant } from '@/lib/db';
import { anfrageEntscheiden, feedbackErledigt, findAnfrage, findGruppe, gruppeStatusSetzen } from '@/lib/db/directory';
import { getCurrentMember } from '@/lib/session';
import { tenantConfig, appUrl } from '@/lib/tenant-config';
import { freierTokenString, neuerToken } from '@/lib/gruendung';
import { stammdatenSpeichern } from '@/lib/stammdaten';
import { mailAn } from '@/lib/mail';
import { pushAn } from '@/lib/push';
import type { StammtischState } from '@/app/(app)/stammtisch/actions';

/** Nur Admins des Gründer-Stammtischs dürfen ins Verzeichnis. */
async function verzeichnisAdmin() {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin' || !tenantConfig().istGruender) return null;
  return me;
}

export async function gruppeStatusAendern(id: string, status: 'aktiv' | 'gesperrt'): Promise<{ fehler?: string }> {
  const me = await verzeichnisAdmin();
  if (!me) return { fehler: 'Des derf nur a Wirtschaftln-Admin.' };
  try {
    gruppeStatusSetzen(id, status);
  } catch (err) {
    return { fehler: err instanceof Error ? err.message : 'Des hat ned klappt.' };
  }
  revalidatePath('/verzeichnis');
  revalidatePath(`/verzeichnis/${id}`);
  return {};
}

/** Anfrage freigeben (münzt den Token, sagt dem Antragsteller Bescheid) oder ablehnen. */
export async function anfrageEntscheidenAction(id: string, entscheidung: 'freigegeben' | 'abgelehnt'): Promise<{ fehler?: string; meldung?: string }> {
  const me = await verzeichnisAdmin();
  if (!me) return { fehler: 'Des derf nur a Wirtschaftln-Admin.' };
  const anfrage = findAnfrage(id);
  if (!anfrage) return { fehler: 'Die Anfrage gibt’s nimmer.' };
  const token = entscheidung === 'freigegeben' ? freierTokenString() : null;
  if (!anfrageEntscheiden(id, entscheidung, me.id, token)) return { fehler: 'Die Anfrage is scho entschieden.' };
  // Antragsteller benachrichtigen (best effort)
  let name = 'den Stammtisch';
  try {
    await runWithTenant(anfrage.gruppeId, async () => {
      const m = db.select().from(members).where(eq(members.id, anfrage.memberId)).get();
      if (!m) return;
      name = m.spitzname || m.vorname || m.name;
      const titel = entscheidung === 'freigegeben' ? '🎟️ Token freigegeben' : 'Token-Anfrage abgelehnt';
      const text = entscheidung === 'freigegeben' ? 'Euer weiterer Gründungs-Token liegt im Profil. Gleich widmen und teilen.' : 'Eure Token-Anfrage wurde diesmal abgelehnt. Frag beim Wirtschaftln nach, wenn du magst.';
      await Promise.allSettled([
        pushAn([m.id], titel, text, '/profil'),
        mailAn([m.email], titel, `Servus ${name}!\n\n${text}\n\n→ ${appUrl('/profil')}\n\nDeine Wirtschaftln-App`),
      ]);
    }, { auchGesperrt: true });
  } catch (err) {
    console.error('Anfrage-Benachrichtigung fehlgeschlagen:', err);
  }
  // Die Liste frischt der Client nach der grünen Meldung selber auf (router.refresh), sonst
  // verschwindet die Karte samt Meldung sofort
  revalidatePath(`/verzeichnis/${anfrage.gruppeId}`);
  return { meldung: entscheidung === 'freigegeben' ? `Token an ${name} verschickt (Push und Mail).` : `Anfrage abgelehnt, ${name} hat Bescheid.` };
}

/** Einem Stammtisch einen Token schenken (Verzeichnis-Detail). Halter = dessen erster Admin. */
export async function tokenSchenken(gruppeId: string): Promise<{ fehler?: string }> {
  const me = await verzeichnisAdmin();
  if (!me) return { fehler: 'Des derf nur a Wirtschaftln-Admin.' };
  const gruppe = findGruppe(gruppeId);
  if (!gruppe) return { fehler: 'Unbekannter Stammtisch.' };
  let halter = me.id;
  try {
    runWithTenant(gruppeId, () => {
      const admin = db.select().from(members).where(eq(members.role, 'admin')).orderBy(members.createdAt).get();
      if (admin) halter = admin.id;
    }, { auchGesperrt: true });
  } catch { /* DB fehlt → Halter bleibt der Schenkende */ }
  neuerToken(halter, gruppeId, 'admin');
  revalidatePath(`/verzeichnis/${gruppeId}`);
  revalidatePath('/verzeichnis');
  return {};
}

/** Stammdaten eines fremden Stammtischs speichern (gleiches Formular wie „Stammtisch verwalten“). */
export async function gruppeSpeichern(gruppeId: string, _prev: StammtischState, formData: FormData): Promise<StammtischState> {
  const me = await verzeichnisAdmin();
  if (!me) return { error: 'Des derf nur a Wirtschaftln-Admin.' };
  const gruppe = findGruppe(gruppeId);
  if (!gruppe) return { error: 'Unbekannter Stammtisch.' };
  const ergebnis = await stammdatenSpeichern(gruppe, formData);
  if (ergebnis.error) return ergebnis;
  revalidatePath('/verzeichnis');
  revalidatePath(`/verzeichnis/${gruppeId}`);
  return { ok: true };
}

/** Feedback abhaken: rutscht in die erledigten. */
export async function feedbackErledigtAction(id: string): Promise<{ fehler?: string }> {
  const me = await verzeichnisAdmin();
  if (!me) return { fehler: 'Des derf nur a Wirtschaftln-Admin.' };
  feedbackErledigt(id);
  revalidatePath('/verzeichnis');
  return {};
}
