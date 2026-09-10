'use server';

import { redirect } from 'next/navigation';
import { codeVorschlag, stammtischGruenden, type GruendungsEingabe } from '@/lib/gruendung';
import { codeFrei } from '@/lib/db/directory';

export type GruendungsState = { fehler?: string; schritt?: 1 | 2 | 3 };

/** Der Gründungsakt (letzter Schritt vom Wizard); bei Erfolg geht's direkt eini in den neuen Stammtisch. */
export async function gruenden(token: string, _prev: GruendungsState, formData: FormData): Promise<GruendungsState> {
  const feld = (name: keyof GruendungsEingabe) => String(formData.get(name) ?? '');
  const eingabe: GruendungsEingabe = {
    vorname: feld('vorname'),
    nachname: feld('nachname'),
    email: feld('email'),
    passwort: feld('passwort'),
    name: feld('name'),
    motto: feld('motto'),
    stadt: feld('stadt'),
    gruendungsjahr: feld('gruendungsjahr'),
    typ: feld('typ'),
    stammhausName: feld('stammhausName'),
    stammhausAdresse: feld('stammhausAdresse'),
    bierName: feld('bierName'),
    hoibePreis: feld('hoibePreis'),
    code: feld('code'),
  };
  const ergebnis = await stammtischGruenden(token, eingabe);
  if (!ergebnis.ok) return { fehler: ergebnis.fehler, schritt: ergebnis.schritt };
  redirect('/');
}

/** Code-Vorschlag aus dem Stammtisch-Namen (Schritt 3), garantiert frei. */
export async function codeVorschlagFuer(name: string): Promise<string> {
  return codeVorschlag(String(name ?? '').slice(0, 60));
}

/** Live-Check beim Tippen: is der Wunsch-Code no frei? */
export async function codeIstFrei(code: string): Promise<boolean> {
  const c = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(c)) return false;
  return codeFrei(c);
}
