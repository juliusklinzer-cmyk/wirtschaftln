'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, termine, votes, besuche, wirtshaeuser } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/termin');
  revalidatePath('/karte');
  revalidatePath('/spezln');
}

export async function neuerTermin(formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const datum = String(formData.get('datum') ?? '');
  const zeit = String(formData.get('zeit') ?? '19:00');
  const planerId = String(formData.get('planerId') ?? me.id);
  if (!datum) return;
  db.insert(termine)
    .values({ id: newId('t'), datum, zeit, phase: 'planung', planerId, createdAt: nowIso() })
    .run();
  revalidateAll();
}

/** Best-effort-Geocoding über Nominatim (OSM) — scheitert leise. */
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'wirtschaftln.de (Stammtisch-App)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

export async function wirtshausFestlegen(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const name = String(formData.get('name') ?? '').trim();
  const adresse = String(formData.get('adresse') ?? '').trim();
  const bezirk = String(formData.get('bezirk') ?? '').trim();
  if (!name) return;
  const coords = await geocode(adresse ? `${adresse}, München` : `${name}, München`);
  const wid = newId('w');
  db.insert(wirtshaeuser)
    .values({
      id: wid,
      name,
      adresse: adresse || null,
      bezirk: bezirk || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      createdAt: nowIso(),
    })
    .run();
  db.update(termine).set({ wirtshausId: wid, phase: 'reserviert' }).where(eq(termine.id, terminId)).run();
  revalidateAll();
}

export async function abstimmen(terminId: string, wert: 'zu' | 'vielleicht' | 'ab') {
  const me = await getCurrentMember();
  if (!me) return;
  const vorhanden = db
    .select()
    .from(votes)
    .where(eq(votes.terminId, terminId))
    .all()
    .find((v) => v.memberId === me.id);
  if (vorhanden) {
    db.update(votes).set({ wert, updatedAt: nowIso() }).where(eq(votes.id, vorhanden.id)).run();
  } else {
    db.insert(votes)
      .values({ id: newId('v'), terminId, memberId: me.id, wert, updatedAt: nowIso() })
      .run();
  }
  revalidateAll();
}

export async function phaseSetzen(terminId: string, phase: 'planung' | 'reserviert' | 'heute') {
  const me = await getCurrentMember();
  if (!me) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  if (me.role !== 'admin' && termin.planerId !== me.id) return;
  db.update(termine).set({ phase }).where(eq(termine.id, terminId)).run();
  revalidateAll();
}

/**
 * Besuch abschließen: pro Mitglied Anwesenheit + Hoiben + Kaiserschmarrn,
 * eigene Sterne + Kommentar. Termin → abgeschlossen.
 */
export async function besuchAbschliessen(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  if (me.role !== 'admin' && termin.planerId !== me.id) return;

  const memberIds = formData.getAll('memberId').map(String);
  for (const memberId of memberIds) {
    const anwesend = formData.get(`anwesend_${memberId}`) === 'on';
    const hoiben = Math.max(0, Number(formData.get(`hoiben_${memberId}`) ?? 0) || 0);
    const kaiserschmarrn = Math.max(0, Number(formData.get(`kaiser_${memberId}`) ?? 0) || 0);
    db.insert(besuche)
      .values({
        id: newId('b'),
        terminId,
        memberId,
        anwesend,
        hoiben: anwesend ? hoiben : 0,
        kaiserschmarrn: anwesend ? kaiserschmarrn : 0,
      })
      .onConflictDoUpdate({
        target: [besuche.terminId, besuche.memberId],
        set: { anwesend, hoiben: anwesend ? hoiben : 0, kaiserschmarrn: anwesend ? kaiserschmarrn : 0 },
      })
      .run();
  }

  // Eigene Bewertung des Wirtshauses
  const sterne = Number(formData.get('sterne') ?? 0) || null;
  const kommentar = String(formData.get('kommentar') ?? '').trim() || null;
  if (sterne) {
    const eigener = db
      .select()
      .from(besuche)
      .where(eq(besuche.terminId, terminId))
      .all()
      .find((b) => b.memberId === me.id);
    if (eigener) {
      db.update(besuche).set({ sterne, kommentar }).where(eq(besuche.id, eigener.id)).run();
    }
  }

  db.update(termine).set({ phase: 'abgeschlossen' }).where(eq(termine.id, terminId)).run();
  revalidateAll();
}

/** Eigene Bewertung nachtragen (jedes Mitglied für sich). */
export async function bewerten(terminId: string, formData: FormData) {
  const me = await getCurrentMember();
  if (!me) return;
  const sterne = Math.min(5, Math.max(1, Number(formData.get('sterne') ?? 0) || 0));
  const kommentar = String(formData.get('kommentar') ?? '').trim() || null;
  if (!sterne) return;
  const eigener = db
    .select()
    .from(besuche)
    .where(eq(besuche.terminId, terminId))
    .all()
    .find((b) => b.memberId === me.id);
  if (eigener) {
    db.update(besuche).set({ sterne, kommentar }).where(eq(besuche.id, eigener.id)).run();
  } else {
    db.insert(besuche)
      .values({ id: newId('b'), terminId, memberId: me.id, anwesend: true, hoiben: 0, kaiserschmarrn: 0, sterne, kommentar })
      .run();
  }
  revalidateAll();
}
