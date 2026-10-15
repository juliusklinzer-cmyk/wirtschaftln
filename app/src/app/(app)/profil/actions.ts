'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db, members } from '@/lib/db';
import { getCurrentMember, destroyOtherSessions } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/password';
import { tenantConfig } from '@/lib/tenant-config';
import { fotoAblegen } from '@/lib/foto';
import { neuerToken, tokenWidmenFuer, anfrageStellen, benachrichtigeAnfrage } from '@/lib/gruendung';
import { gruenderGruppeId } from '@/lib/db/directory';
import { anzeigeName } from '@/lib/namen';
import { feedbackSchicken } from '@/lib/feedback';

export type ProfilState = { error?: string; ok?: boolean };

/** Weißwurst-Zahl aus dem Formular: leer = null, sonst 0–20. */
function weisswuerste(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
}

/** Frischen Gründungs-Token münzen — nur der Admin des Gründer-Stammtischs (unbegrenzt). */
export async function tokenErzeugen() {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin' || !tenantConfig().istGruender) return;
  neuerToken(me.id, gruenderGruppeId(), 'admin');
  revalidatePath('/profil');
}

/** Token widmen („Sepp aus Regensburg“), erst danach lässt er sich teilen. */
export async function tokenWidmen(token: string, widmung: string): Promise<{ fehler?: string }> {
  const me = await getCurrentMember();
  if (!me) return { fehler: 'Ned angemeldet.' };
  const fehler = tokenWidmenFuer(me, String(token ?? ''), String(widmung ?? ''));
  if (fehler) return { fehler };
  revalidatePath('/profil');
  return {};
}

/** Weiteren Token anfragen (Admin eines Stammtischs), die Wirtschaftln-Admins entscheiden. */
export async function tokenAnfragen(grund: string): Promise<{ fehler?: string }> {
  const me = await getCurrentMember();
  if (!me) return { fehler: 'Ned angemeldet.' };
  const fehler = anfrageStellen(me, String(grund ?? ''));
  if (fehler) return { fehler };
  await benachrichtigeAnfrage(anzeigeName(me), String(grund ?? '').trim().slice(0, 300));
  revalidatePath('/profil');
  return {};
}

/**
 * Eigenes Profil speichern, inkl. Profilbild (wird auf 256px verkleinert und
 * als Data-URL in der DB abgelegt) und optionalem Passwort-Wechsel.
 * Bei der Erstanmeldung ist das neue Passwort Pflicht; danach ist das Profil frei.
 */
export async function profilSpeichern(_prev: ProfilState, formData: FormData): Promise<ProfilState> {
  const me = await getCurrentMember();
  if (!me) return { error: 'Ned angemeldet.' };

  const feld = (name: string, max = 100) => String(formData.get(name) ?? '').trim().slice(0, max) || null;

  // Passwort (Pflicht bei Erstanmeldung; danach nur mit aktuellem Passwort)
  const passwort = String(formData.get('passwort') ?? '');
  const passwortWdh = String(formData.get('passwortWdh') ?? '');
  let passwordHash: string | undefined;
  if (passwort || me.erstanmeldung) {
    if (!me.erstanmeldung) {
      // Schutz bei liegengelassenem Handy: ohne altes Passwort kein neues
      const aktuell = String(formData.get('passwortAktuell') ?? '');
      if (!verifyPassword(aktuell, me.passwordHash)) {
        return { error: 'Dei aktuelles Passwort stimmt ned.' };
      }
    }
    if (passwort.length < 6) return { error: 'Passwort braucht mindestens 6 Zeichen.' };
    if (passwort !== passwortWdh) return { error: 'De zwoa Passwörter passen ned zamm.' };
    passwordHash = hashPassword(passwort);
  }

  // Profilbild: kommt schon zugeschnitten aus dem Kreis-Editor (Data-URL, 512px)
  // und wird hier final auf 256px verkleinert.
  let photoUrl: string | undefined;
  const fotoData = String(formData.get('fotoData') ?? '');
  if (fotoData.startsWith('data:image/')) {
    if (fotoData.length > 4 * 1024 * 1024) return { error: 'Foto is z’groß, probier’s nomoi.' };
    try {
      const buf = Buffer.from(fotoData.slice(fotoData.indexOf(',') + 1), 'base64');
      const klein = await sharp(buf).resize(256, 256, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
      // Bild in `fotos`, in members nur die URL mit Hash (Browser cacht a Jahr, neues Foto = neue URL)
      photoUrl = fotoAblegen(me.id, `data:image/jpeg;base64,${klein.toString('base64')}`);
    } catch {
      return { error: 'Des Foto kann i ned lesen, probier a anders.' };
    }
  }

  // Vorname/Nachname: Anzeige läuft als „Da <Nachname> <Vorname>" (lib/namen.ts);
  // der volle `name` bleibt als Fallback synchron.
  const vorname = feld('vorname');
  const nachname = feld('nachname');

  const verein = feld('verein');
  db.update(members)
    .set({
      ...(vorname && nachname ? { vorname, nachname, name: `${vorname} ${nachname}` } : {}),
      spitzname: feld('spitzname'),
      herkunft: feld('herkunft'),
      lieblingsbier: feld('lieblingsbier'),
      lieblingsweissbier: feld('lieblingsweissbier'),
      leibspeise: feld('leibspeise'),
      lieblingsbiergarten: feld('lieblingsbiergarten'),
      lieblingswirtshaus: feld('lieblingswirtshaus'),
      // Gründer: nur die zwoa Wappen; sonst freier Vereinsname
      verein: tenantConfig().features.vereinsWahl ? (verein === 'bayern' || verein === 'sechzig' ? verein : null) : feld('verein', 60),
      schafkopfer: formData.get('schafkopfer') === 'on',
      weisswuerste: weisswuerste(formData.get('weisswuerste')),
      beschreibung: feld('beschreibung', 500),
      erstanmeldung: false,
      ...(passwordHash ? { passwordHash } : {}),
      ...(photoUrl ? { photoUrl } : {}),
    })
    .where(eq(members.id, me.id))
    .run();

  // Nach Passwortwechsel fliegen alle anderen Geräte/Sessions raus
  if (passwordHash) await destroyOtherSessions(me.id);

  revalidatePath('/profil');
  revalidatePath('/');
  revalidatePath('/spezln');
  return { ok: true };
}

/** Feedback zur App schicken (nur aus den neuen Stammtischen), geht an die Wirtschaftln-Admins. */
export async function feedbackAbschicken(text: string): Promise<{ fehler?: string }> {
  const me = await getCurrentMember();
  if (!me) return { fehler: 'Ned angemeldet.' };
  const fehler = await feedbackSchicken(me, String(text ?? ''));
  return fehler ? { fehler } : {};
}
