import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ImageResponse } from 'next/og';
import { members, db, runWithTenant } from '@/lib/db';
import { findGruppe, findGruppeByCode, findToken, tokensFuerGruppe, tokensFuerMitglied, type GruendungsToken } from '@/lib/db/directory';
import { einlader, normalisiereToken } from '@/lib/gruendung';

/**
 * Link-Vorschau für WhatsApp & Co. (Link-Vorschau Redesign 5a/6a/6b, 16.10.2026):
 * jede Einladung kriegt ihr eigenes Bild, 1200 × 630, Panorama mit Navy-Verlauf,
 * Rautenband oben, unten Aufforderung, Name in Fraktur und a Chip.
 */

const B = 1200;
const H = 630;
const GOLD = '#E6C684';
const NAVY = '#07193A';

/* ── Daten je Link ── */

export type BeitrittVorschau = { stammtisch: string; nr: number } | null;

/** Beitreten: Stammtisch aus dem Code, Mitglied Nr. = Anzahl Mitglieder + 1. */
export function beitrittVorschau(code: string | undefined): BeitrittVorschau {
  const c = code?.trim().slice(0, 40);
  const g = c ? findGruppeByCode(c) : null;
  if (!g || g.status !== 'aktiv') return null;
  let anzahl = 0;
  try {
    anzahl = runWithTenant(g.id, () => db.select({ id: members.id }).from(members).all().length);
  } catch { /* Nummer fällt dann auf 1 */ }
  return { stammtisch: g.name, nr: anzahl + 1 };
}

export type GruendungVorschau = { vorname: string; einziger: boolean; widmung: string | null } | null;

/** Wie viele no ned eingelöste Tokens hat der Einlader (bzw. sein Stammtisch) frei? */
function offeneTokens(t: GruendungsToken): number {
  const alle = t.quelle === 'mitglied' || t.quelle === 'admin' ? tokensFuerMitglied(t.memberId) : t.gruppeId ? tokensFuerGruppe(t.gruppeId) : [t];
  return alle.filter((x) => x.status === 'offen').length;
}

/** Gründen: Einlader aus dem Token-Besitzer, Name aus der Widmung. Ungültig oder eingelöst → null. */
export function gruendungVorschau(roh: string): GruendungVorschau {
  const token = normalisiereToken(decodeURIComponent(roh));
  const zeile = token ? findToken(token) : null;
  if (!zeile || zeile.status !== 'offen') return null;
  if (zeile.gruppeId && findGruppe(zeile.gruppeId)?.status === 'gesperrt') return null;
  const wer = einlader(zeile);
  if (!wer) return null;
  return { vorname: wer.name.split(' ')[0], einziger: offeneTokens(zeile) <= 1, widmung: zeile.widmung?.trim() || null };
}

/** og:title/-description je Link (Texte laut Design, Abschnitt „Texte“). */
export const vorschauTexte = {
  beitreten(v: BeitrittVorschau) {
    return v
      ? { titel: `Tritt dem ${v.stammtisch} bei`, beschreibung: `Du wirst Mitglied Nr. ${v.nr}. Nur noch Name und E-Mail, dann bist du dabei.` }
      : { titel: 'Tritt deinem Stammtisch bei', beschreibung: 'Mit dem Code aus deiner Runde.' };
  },
  gruenden(v: GruendungVorschau) {
    return {
      titel: v ? `${v.vorname} schenkt euch ${v.einziger ? 'seinen einzigen' : 'einen'} Token` : 'Eine Ehren-Einladung: Gründe deinen eigenen Stammtisch',
      beschreibung: 'Gründet euren eigenen Stammtisch beim Wirtschaftln: Termine, Abstimmung, Kasse, Rangliste und Chronik in einer App.',
    };
  },
};

/* ── Bild ── */

const publicPfad = (...teile: string[]) => path.join(process.cwd(), 'public', ...teile);

let fontsCache: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800 }[]> | null = null;
function fonts() {
  fontsCache ??= Promise.all([
    fs.readFile(publicPfad('brand/og-fonts/pirata-one-latin-400-normal.woff')).then((data) => ({ name: 'Pirata One', data, weight: 400 as const })),
    fs.readFile(publicPfad('brand/og-fonts/manrope-latin-700-normal.woff')).then((data) => ({ name: 'Manrope', data, weight: 700 as const })),
    fs.readFile(publicPfad('brand/og-fonts/manrope-latin-800-normal.woff')).then((data) => ({ name: 'Manrope', data, weight: 800 as const })),
  ]);
  return fontsCache;
}

/** Panorama einmal auf 1200 × 630 zuschneiden, als Data-URL fürs Bild. */
let panoramaCache: Promise<string> | null = null;
function panorama() {
  panoramaCache ??= sharp(publicPfad('brand/munich-alps-panorama.jpg'))
    .resize(B, H, { fit: 'cover' })
    .jpeg({ quality: 82 })
    .toBuffer()
    .then((b) => `data:image/jpeg;base64,${b.toString('base64')}`);
  return panoramaCache;
}

/** Rautenband: weiß mit blauen Rauten-Spitzen, wie das CSS-Muster im Design. */
function rautenband(): string {
  let polys = '';
  for (let x = 0; x < B; x += 36) polys += `<polygon points="${x},0 ${x + 36},0 ${x + 18},18" fill="#006AB3"/>`;
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="14"><rect width="${B}" height="14" fill="#fff"/>${polys}</svg>`).toString('base64')}`;
}

const SIEGEL = 'M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z';

export type VorschauInhalt = {
  /** Gold, Versalien, oben */
  aufforderung?: string;
  /** Groß in Fraktur */
  titel: string;
  /** Zeile drunter in Pergament */
  zeile?: string;
  /** Glas-Chip (Mitglied Nr.) oder Gold-Chip mit Siegel (Widmung) */
  chip?: { text: string; art: 'glas' | 'gold' };
};

/** Lange Namen kleiner, damit's in zwei Zeilen passt. */
function titelGroesse(t: string): number {
  if (t.length > 26) return 72;
  if (t.length > 18) return 92;
  return 110;
}

async function bildRendern(inhalt: VorschauInhalt): Promise<Buffer> {
  const [f, bild] = await Promise.all([fonts(), panorama()]);
  const png = new ImageResponse(
    (
      <div style={{ width: B, height: H, display: 'flex', flexDirection: 'column', position: 'relative', background: NAVY, fontFamily: 'Manrope' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bild} width={B} height={H} style={{ position: 'absolute', top: 0, left: 0, width: B, height: H }} alt="" />
        <div style={{ position: 'absolute', top: 0, left: 0, width: B, height: H, display: 'flex', backgroundImage: 'linear-gradient(180deg, rgba(7,25,58,0.15) 0%, rgba(7,25,58,0.4) 38%, rgba(7,25,58,0.94) 100%)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rautenband()} width={B} height={14} style={{ position: 'relative' }} alt="" />
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 70px 60px', textAlign: 'center', gap: 14 }}>
          {inhalt.aufforderung && (
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3.8, textTransform: 'uppercase', color: GOLD }}>{inhalt.aufforderung}</span>
          )}
          <span style={{ fontFamily: 'Pirata One', fontSize: titelGroesse(inhalt.titel), lineHeight: 0.95, color: '#FFFFFF', textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', justifyContent: 'center' }}>{inhalt.titel}</span>
          {inhalt.zeile && <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(246,240,226,0.9)' }}>{inhalt.zeile}</span>}
          {inhalt.chip?.art === 'glas' && (
            <span style={{ display: 'flex', padding: '10px 24px', borderRadius: 99, background: 'rgba(246,240,226,0.14)', border: '2px solid rgba(230,198,132,0.7)', color: GOLD, fontSize: 26, fontWeight: 800 }}>{inhalt.chip.text}</span>
          )}
          {inhalt.chip?.art === 'gold' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 99, backgroundImage: 'linear-gradient(180deg, #E6C684 0%, #D0AD66 45%, #A6843E 100%)', color: NAVY, fontSize: 26, fontWeight: 800 }}>
              <svg width="28" height="28" viewBox="0 0 256 256"><path d={SIEGEL} fill={NAVY} /></svg>
              {inhalt.chip.text}
            </span>
          )}
        </div>
      </div>
    ),
    { width: B, height: H, fonts: f.map((x) => ({ name: x.name, data: new Uint8Array(x.data).buffer, weight: x.weight, style: 'normal' as const })) },
  );
  // WhatsApp mag kleine Bilder: PNG vom Renderer als JPEG ausliefern
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

export function beitrittBild(v: BeitrittVorschau) {
  return bildRendern(
    v
      ? { aufforderung: 'Tritt deinem Stammtisch bei', titel: v.stammtisch, chip: { text: `Mitglied Nr. ${v.nr}`, art: 'glas' } }
      : { aufforderung: 'Tritt deinem Stammtisch bei', titel: 'Wirtschaftln' },
  );
}

export function gruendungBild(v: GruendungVorschau) {
  if (!v) return bildRendern({ aufforderung: 'Eine Ehren-Einladung', titel: 'Gründe deinen Stammtisch' });
  return bildRendern({
    aufforderung: v.einziger ? `${v.vorname} hat nur einen Token` : `${v.vorname} schenkt euch einen Token`,
    titel: v.einziger ? 'Und der geht an euch.' : 'Der geht an euch.',
    zeile: 'Gründet euren Stammtisch beim Wirtschaftln',
    chip: v.widmung ? { text: `Für ${v.widmung}`, art: 'gold' } : undefined,
  });
}

/** Jede andere Seite: Stammtisch groß, darunter Stadt · seit Jahr, ohne Aufforderung. */
export function stammtischBild(gruppeId: string | undefined) {
  const g = gruppeId ? findGruppe(gruppeId) : null;
  if (!g || g.status !== 'aktiv') return bildRendern({ titel: 'Wirtschaftln', zeile: 'Die Stammtisch-App' });
  const wo = [g.stadt, g.gruendungsjahr ? `seit ${g.gruendungsjahr}` : null].filter(Boolean).join(' · ');
  return bildRendern({ titel: g.name, zeile: wo || undefined });
}

/** Antwort mit Cache: WhatsApp holt's einmal pro Link, wir rechnen's ned bei jedem Aufruf neu. */
export function bildAntwort(jpeg: Buffer): Response {
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  });
}
