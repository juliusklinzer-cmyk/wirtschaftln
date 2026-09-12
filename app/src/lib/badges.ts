import type { MitgliedStats } from '@/lib/queries';
import { tenantConfig } from '@/lib/tenant-config';

/**
 * Saison-Badges aus dem Design-Prototyp (RanglisteScreen.jsx): werden automatisch
 * vergeben und wandern weiter, sobald wer anders vorn liegt. An Badges können
 * Pflichten hängen (Regeln kommen nach und nach vom Stammtisch).
 */
export type SaisonBadge = {
  key: string;
  /** PNG-Art unter public/brand/badges/<slug>.png; null = goldene Emoji-Disc (generisches Set) */
  slug: string | null;
  icon: string;
  name: string;
  tag: string;
  /** Pflicht des Trägers, null, solange der Stammtisch die Regel noch nicht beschlossen hat. */
  pflicht: string | null;
  /** A nettes G'schichtl zum Badge, fürs Info-Fenster. */
  geschichte: string;
};

export const SAISON_BADGES: SaisonBadge[] = [
  { key: 'zacherHund', slug: 'zacherHund', icon: '🐺', name: 'Zacher Hund', tag: 'am meisten dabei', pflicht: null,
    geschichte: 'Da zache Hund lasst koan Stammtisch aus, bei Schnee, Bahnstreik und Männergrippe: er sitzt scho am Tisch, bevor da Wirt s’Licht oschalt.' },
  { key: 'maximator', slug: 'maximator', icon: '🍺', name: 'Maximator', tag: 'meiste Hoibe', pflicht: 'Trinkt bei jedem Stammtisch vorweg ein Starkbier.',
    geschichte: 'Benannt nach’m Starkbier, des er sich verdient hat: Wer de meisten Hoibe stemmt, trägt den Maximator, und büaßt dafür mit am Starkbier vorweg.' },
  { key: 'moshammer', slug: 'moshammer', icon: '💸', name: 'Moshammer', tag: 'meiste Runden', pflicht: null,
    geschichte: 'Wia da Mosi über d’Maximilianstraß: großzügig, glamourös und immer a Runde parat. Der spendabelste Spezl vom ganzen Stammtisch.' },
  { key: 'heiwong', slug: 'heiwong', icon: '😴', name: 'Heiwong', tag: 'am wenigsten da', pflicht: null,
    geschichte: 'Den Heiwong zieht’s oiwei z’fruah hoam, oder er kommt gar ned erst. De wenigsten Abende der Saison: des oanzige Badge, des koana mog.' },
  { key: 'meisterEder', slug: 'meisterEder', icon: '⭐', name: 'Eder', tag: 'bestes Wirtshaus reserviert', pflicht: null,
    geschichte: 'Wia da Schreinermeister aus da Serie: a G’spür für de guadn Stuben. Hat des bestbewertete Wirtshaus der Saison aufgrissen und reserviert.' },
  { key: 'taxler', slug: 'taxler', icon: '🚕', name: 'Taxler', tag: 'fährt & nimmt alle mit', pflicht: null,
    geschichte: 'Bleibt nüchtern, fährt umanand und bringt alle hoam. Ohne den Taxler waar da hoibe Stammtisch no am Marienplatz gstrandet.' },
  { key: 'dieSau', slug: 'dieSau', icon: '🐷', name: 'Die Sau', tag: 'meiste Schweinsbraten', pflicht: null,
    geschichte: 'Respekt und a bisserl Sorge: de meisten Schweinsbraten der Saison. Kruste, Knödl, Soß, nix bleibt über. A Sau halt, im allerbesten Sinn.' },
  { key: 'schnapsler', slug: 'schnapsler', icon: '🥃', name: 'Schnapsler', tag: 'meiste Schnaps', pflicht: null,
    geschichte: 'Bier is a Grundnahrungsmittel, aber der Schnapsler geht an Schritt weiter: de meisten Stamperl der Saison. Zum Wohl, und morgen a Aspirin.' },
  { key: 'alterPeter', slug: 'alterPeter', icon: '⛪', name: 'Alter Peter', tag: 'höchste Serie', pflicht: null,
    geschichte: 'Wia der Turm überm Rindermarkt: steht und steht und steht. Die längste Serie, seit’s den Stammtisch gibt, bei Gleichstand entscheiden d’Hoibe.' },
];

/**
 * Generisches Set für neue Stammtische: gleiche Keys (dieselbe Vergabe-Logik),
 * neutrale Namen/G'schichtln ohne Münchner Originale, ohne PNG-Art (Emoji-Disc).
 */
export const SAISON_BADGES_GENERISCH: SaisonBadge[] = [
  { key: 'zacherHund', slug: null, icon: '🐺', name: 'Zacher Hund', tag: 'am meisten dabei', pflicht: null,
    geschichte: 'Lasst koan Stammtisch aus, bei Schnee, Streik und Männergrippe: sitzt scho am Tisch, bevor da Wirt s’Licht oschalt.' },
  { key: 'maximator', slug: null, icon: '🍺', name: 'Durstlöscher', tag: 'meiste Hoibe', pflicht: 'Trinkt bei jedem Stammtisch vorweg ein Starkbier.',
    geschichte: 'Wer de meisten Hoibe stemmt, trägt den Durstlöscher, und büaßt dafür mit am Starkbier vorweg.' },
  { key: 'moshammer', slug: null, icon: '💸', name: 'Spendierhosn', tag: 'meiste Runden', pflicht: null,
    geschichte: 'Großzügig und immer a Runde parat: der spendabelste Spezl vom ganzen Stammtisch.' },
  { key: 'heiwong', slug: null, icon: '😴', name: 'Heimgeher', tag: 'am wenigsten da', pflicht: null,
    geschichte: 'Den Heimgeher zieht’s oiwei z’fruah hoam, oder er kommt gar ned erst. Des oanzige Badge, des koana mog.' },
  { key: 'meisterEder', slug: null, icon: '⭐', name: 'Wirtshauskenner', tag: 'bestes Wirtshaus reserviert', pflicht: null,
    geschichte: 'A G’spür für de guadn Stuben: hat des bestbewertete Wirtshaus der Saison aufgrissen und reserviert.' },
  { key: 'taxler', slug: null, icon: '🚕', name: 'Taxler', tag: 'fährt & nimmt alle mit', pflicht: null,
    geschichte: 'Bleibt nüchtern, fährt umanand und bringt alle hoam. Ohne den Taxler waar da hoibe Stammtisch gstrandet.' },
  { key: 'dieSau', slug: null, icon: '🐷', name: 'Bratenkönig', tag: 'meiste Schweinsbraten', pflicht: null,
    geschichte: 'Respekt und a bisserl Sorge: de meisten Schweinsbraten der Saison. Kruste, Knödl, Soß, nix bleibt über.' },
  { key: 'schnapsler', slug: 'schnapsler', icon: '🥃', name: 'Schnapsler', tag: 'meiste Schnaps', pflicht: null,
    geschichte: 'Bier is a Grundnahrungsmittel, aber der Schnapsler geht an Schritt weiter: de meisten Stamperl der Saison. Zum Wohl, und morgen a Aspirin.' },
  { key: 'alterPeter', slug: null, icon: '🔥', name: 'Dauerbrenner', tag: 'höchste Serie', pflicht: null,
    geschichte: 'Steht und steht und steht: die längste Serie, seit’s den Stammtisch gibt, bei Gleichstand entscheiden d’Hoibe.' },
];

/** Das Badge-Set des gebundenen Stammtischs (Feature-Flag muenchenBadges). */
export function saisonBadges(): SaisonBadge[] {
  const f = tenantConfig().features;
  const set = f.muenchenBadges ? SAISON_BADGES : SAISON_BADGES_GENERISCH;
  // Schnapsler gibt's nur, wo gschnapselt wird
  return f.schnaps ? set : set.filter((b) => b.key !== 'schnapsler');
}

export type BadgeVergabe = SaisonBadge & { holderId: string };

/**
 * Vergabe-Logik wie im Design: byMax/byMin über die Stats, Meister Eder ist der
 * Planer des bestbewerteten Wirtshauses. Zähl-Badges nur, wenn wer über 0 liegt.
 */
export function saisonBadgesVergeben(stats: MitgliedStats[], meisterEderId: string | null): BadgeVergabe[] {
  if (stats.length === 0 || !stats.some((s) => s.abende > 0)) return [];
  const byMax = (f: (s: MitgliedStats) => number) => stats.reduce((a, b) => (f(b) > f(a) ? b : a));
  const byMin = (f: (s: MitgliedStats) => number) => stats.reduce((a, b) => (f(b) < f(a) ? b : a));
  // Höchste Serie; bei Gleichstand entscheidet, wer mehr Hoibe hat
  const besteSerie = Math.max(...stats.map((s) => s.bestStreak));
  const alterPeter =
    besteSerie > 0
      ? stats.filter((s) => s.bestStreak === besteSerie).reduce((a, b) => (b.hoiben > a.hoiben ? b : a)).member.id
      : null;

  const holderIds: Record<string, string | null> = {
    zacherHund: byMax((s) => s.abende).member.id,
    maximator: stats.some((s) => s.hoiben > 0) ? byMax((s) => s.hoiben).member.id : null,
    moshammer: stats.some((s) => s.runden > 0) ? byMax((s) => s.runden).member.id : null,
    heiwong: byMin((s) => s.abende).member.id,
    meisterEder: meisterEderId,
    taxler: stats.some((s) => s.taxi > 0) ? byMax((s) => s.taxi).member.id : null,
    dieSau: stats.some((s) => s.schweinsbraten > 0) ? byMax((s) => s.schweinsbraten).member.id : null,
    schnapsler: stats.some((s) => s.schnaps > 0) ? byMax((s) => s.schnaps).member.id : null,
    alterPeter,
  };
  return saisonBadges().flatMap((b) => (holderIds[b.key] ? [{ ...b, holderId: holderIds[b.key]! }] : []));
}

/**
 * Dauerhafte Serien-Abzeichen: ab 3/6/10/15 Abenden in Folge, bleiben für immer
 * (bemessen an der Rekord-Serie) und schmücken das Profil.
 */
export const SERIEN_ABZEICHEN = [
  { ab: 3, icon: '🥉', name: 'Stammgast' },
  { ab: 5, icon: '🥈', name: 'Inventar' },
  { ab: 8, icon: '🏅', name: 'Urgestein' },
  { ab: 10, icon: '🥇', name: 'Wirtshaus-Legende' },
  { ab: 15, icon: '💎', name: 'Unkaputtbar' },
] as const;

export function serienAbzeichen(bestStreak: number) {
  return SERIEN_ABZEICHEN.filter((a) => bestStreak >= a.ab);
}

/**
 * Ämter: Präsident automatisch (meiste Wirtschaftln-Punkte, wird direkt
 * weitergegeben), Schriftführer automatisch (schließt die meisten Besuche ab),
 * Kassenwart gewählt. Jedes Amt hat einen Patron (Grafik: amt-<slug>.png).
 */
export const AEMTER_INFO: Record<string, { icon: string; slug: string; patron: string; mode: string; duties: string; geschichte: string }> = {
  Präsident: {
    icon: '👑', slug: 'amt-praesident', patron: 'Prinzregent Luitpold', mode: 'Automatisch',
    duties: 'Meiste Wirtschaftln-Punkte, wird direkt weitergegeben · entscheidet final über Aufnahmen neuer Mitglieder · zahlt am Tisch immer als Letzter, was offen bleibt, is sei Sach’',
    geschichte: 'Der Präsident steht für Führung, Zusammenhalt und die Wahrung unserer Stammtischtradition. Sein Patron ist Prinzregent Luitpold, Sinnbild für Würde, Beständigkeit und bayerische Autorität.',
  },
  Kassenwart: {
    icon: '💰', slug: 'amt-kassenwart', patron: 'Jakob Fugger', mode: 'Gewählt',
    duties: 'Vom Stammtisch gewählt, und bei Bedarf abgewählt · wahrt die Kasse, treibt Schulden ein und dokumentiert Fehler · nimmt Bares ein und digitalisiert’s · trägt Ausgaben ein und verifiziert sie',
    geschichte: 'Der Kassenwart wacht über Beiträge, Ausgaben und die ehrwürdige Stammtischkasse. Sein Patron ist Jakob Fugger, der wohl bekannteste Kaufmann und Finanzier Bayerns.',
  },
  Schriftführer: {
    icon: '✒️', slug: 'amt-schriftfuehrer', patron: 'Karl Valentin', mode: 'Automatisch',
    duties: 'Automatisch der, der die meisten Abende zusammengefasst hat · is er dabei, trägt er den Abend ordnungsgemäß und vollständig ein · is er nicht da, darf jeder erfassen · Vollständigkeit und Ehrlichkeit sind ohne Diskussion verpflichtend',
    geschichte: 'Der Schriftführer hält fest, was beschlossen, erlebt und besser niemals vergessen werden sollte. Sein Patron ist Karl Valentin, Münchner Original, Sprachkünstler und Meister des feinen Humors.',
  },
};

/* ── Badge-/Amt-Wechsel: wer hat wem was abgluchst? ────────────────────── */

/** Aktueller Vergabe-Stand: Badge-Key bzw. Amt → Halter-Id. */
export function vergabeStand(stats: MitgliedStats[], meisterEderId: string | null): Map<string, string> {
  const stand = new Map<string, string>();
  for (const b of saisonBadgesVergeben(stats, meisterEderId)) stand.set(b.key, b.holderId);
  const nachPunkten = [...stats].sort((a, b) => b.punkte - a.punkte);
  if (nachPunkten[0] && nachPunkten[0].punkte > 0) stand.set('amt:praesident', nachPunkten[0].member.id);
  const fleissigster = [...stats].sort((a, b) => b.abschluesse - a.abschluesse)[0];
  if (fleissigster && fleissigster.abschluesse > 0) stand.set('amt:schriftfuehrer', fleissigster.member.id);
  return stand;
}

export type Wechsel = { key: string; icon: string; label: string; neuId: string; altId: string | null };

/** Alle Übernahmen zwischen zwei Ständen (neuer Halter ≠ alter Halter). */
export function vergabeWechsel(vorher: Map<string, string>, nachher: Map<string, string>): Wechsel[] {
  const meta: Record<string, { icon: string; label: string }> = {
    'amt:praesident': { icon: '👑', label: 'Präsident' },
    'amt:schriftfuehrer': { icon: '✒️', label: 'Schriftführer' },
  };
  for (const b of saisonBadges()) meta[b.key] = { icon: b.icon, label: b.name };
  const wechsel: Wechsel[] = [];
  for (const [key, neuId] of nachher) {
    const altId = vorher.get(key) ?? null;
    if (neuId && neuId !== altId) wechsel.push({ key, ...meta[key], neuId, altId });
  }
  return wechsel;
}

/** G'schmackige Sprüche für die Benachrichtigungen (Heiwong is invertiert). */
export function wechselTexte(w: Wechsel, neuName: string): { anNeuen: string; anAlten: string; anAlle: string } {
  const texte: Record<string, { neu: string; alt: string }> = {
    zacherHund: { neu: 'Du bist jetza da Zacher Hund 🐺, neamd is öfter dabei!', alt: `${neuName} is jetza da Zacher Hund, di hat’s dawischt.` },
    maximator: { neu: 'Du bist jetza da Maximator 🍺! Denk dran: a Starkbier vorweg beim nächsten Stammtisch.', alt: `Gratuliere zur g’schonten Leber, ${neuName} is jetza da Maximator.` },
    moshammer: { neu: 'Du bist jetza da Moshammer 💸, neamd schmeißt spendabler Runden!', alt: `${neuName} hat di als Moshammer abglöst, Geldbeitl bleibt zua.` },
    heiwong: { neu: 'Du bist jetza da Heiwong 😴 … schau, dass’d wieder öfter kommst!', alt: 'Gratuliere, du bist nimmer da Heiwong! 🎉' },
    meisterEder: { neu: 'Du bist jetza da Eder ⭐, dei Wirtshaus is as beste!', alt: `${neuName} hat’s bessere Wirtshaus reserviert, da Eder is furt.` },
    taxler: { neu: 'Du bist jetza da Taxler 🚕, vergelt’s Gott fürs Hoamfahren!', alt: `${neuName} fährt jetza öfter, da Taxler is weg.` },
    dieSau: { neu: 'Du bist jetza Die Sau 🐷, neamd vertilgt mehr Schweinsbraten!', alt: `${neuName} frisst mehr Brodn wia du, Die Sau is furt.` },
    schnapsler: { neu: 'Du bist jetza da Schnapsler 🥃, neamd kippt mehr Stamperl!', alt: `${neuName} hat di als Schnapsler abglöst, Prost.` },
    alterPeter: { neu: 'Du bist jetza da Alte Peter ⛪, die längste Serie überm ganzen Stammtisch!', alt: `${neuName} hat de längere Serie, da Alte Peter schaut jetzt auf eam.` },
    'amt:praesident': { neu: 'Du bist jetza da Präsident 👑, WP-Rang 1! Zahlt immer zuletzt, entscheidet final.', alt: `${neuName} hat di als Präsident abglöst, hol dir’n Rang zruck!` },
    'amt:schriftfuehrer': { neu: 'Du bist jetza da Schriftführer ✒️, du schließt am meisten ab!', alt: `${neuName} is jetza Schriftführer, schließ wieder öfter ab.` },
  };
  // Die Münchner Sprüche passen nur zum Münchner Set — sonst der neutrale Satz mit dem Badge-Namen
  const muenchen = tenantConfig().features.muenchenBadges || w.key.startsWith('amt:');
  const t = (muenchen ? texte[w.key] : undefined) ?? { neu: `Du bist jetza ${w.label}!`, alt: `${neuName} is jetza ${w.label}.` };
  return { anNeuen: t.neu, anAlten: t.alt, anAlle: `${w.icon} ${neuName} is jetza ${w.label}!` };
}

/** Amt-Metadaten auch für Varianten wie „Kassenwartin" oder eigene Ämter. */
export function amtInfo(titel: string): { icon: string; slug?: string; patron?: string; mode: string; duties: string | null } {
  const direkt = AEMTER_INFO[titel];
  if (direkt) return direkt;
  const stamm = Object.keys(AEMTER_INFO).find((k) => titel.startsWith(k.slice(0, -1)));
  if (stamm) return AEMTER_INFO[stamm];
  return { icon: '🍺', mode: 'Gewählt', duties: null };
}
