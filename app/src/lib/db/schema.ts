import { sqliteTable, text, integer, real, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

// Beträge immer in Cent (Integer), Datumswerte als ISO-Strings (UTC).

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  /** Voller Name („Julius Klinzer"), Fallback; Anzeige läuft über lib/namen.ts. */
  name: text('name').notNull(),
  vorname: text('vorname'),
  nachname: text('nachname'),
  spitzname: text('spitzname'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** URL des Profilfotos: /foto/<id>-<hash>.jpg (Daten liegen in `fotos`), seit 14.10.2026 nimmer als Data-URL */
  photoUrl: text('photo_url'),
  role: text('role', { enum: ['admin', 'mitglied'] }).notNull().default('mitglied'),
  status: text('status', { enum: ['aktiv', 'antrag', 'inaktiv'] }).notNull().default('aktiv'),
  // Profil, alles was bayrisch und witzig is
  herkunft: text('herkunft'), // Stadtviertel/Herkunft
  lieblingsbier: text('lieblingsbier'),
  lieblingsweissbier: text('lieblingsweissbier'),
  leibspeise: text('leibspeise'),
  lieblingsbiergarten: text('lieblingsbiergarten'),
  lieblingswirtshaus: text('lieblingswirtshaus'),
  // Gründer (Feature vereinsWahl): 'bayern' | 'sechzig' mit Wappen; sonst freier Vereinsname
  verein: text('verein'),
  schafkopfer: integer('schafkopfer', { mode: 'boolean' }).notNull().default(false),
  /** Wie viele Weißwürste normal (Profil-Redesign 14.10.2026), null = no ned festgelegt */
  weisswuerste: integer('weisswuerste'),
  beschreibung: text('beschreibung'),
  // true, bis der Spezl beim ersten Login Passwort gesetzt + Profil ausgefüllt hat
  erstanmeldung: integer('erstanmeldung', { mode: 'boolean' }).notNull().default(false),
  /** Erklär-Slides (/willkommen) scho gsehen? Wird beim ersten Login einmal gezeigt. */
  onboardingGesehen: integer('onboarding_gesehen', { mode: 'boolean' }).notNull().default(false),
  /** Welche „Was ist neu“-Ausgabe der Spezl schon weggewischt hat (lib/neuigkeiten.ts) */
  neuigkeitenGesehen: text('neuigkeiten_gesehen'),
  // Mail-Einstellungen im Profil (30.10.2026): Termin steht fest, Erinnerungen, Kasse/Strafen.
  // Passwort- und Willkommensmails kommen immer.
  mailTermin: integer('mail_termin', { mode: 'boolean' }).notNull().default(true),
  mailErinnerung: integer('mail_erinnerung', { mode: 'boolean' }).notNull().default(true),
  mailKasse: integer('mail_kasse', { mode: 'boolean' }).notNull().default(true),
  /** Wann und wie er ausgeschieden ist (31.10.2026), für die Abschieds-Zeile auf /spezln */
  ausgeschiedenAm: text('ausgeschieden_am'),
  abschied: text('abschied', { enum: ['selbst', 'praesident'] }),
  createdAt: text('created_at').notNull(),
});

/**
 * Fotos (Profilbilder, Wirtshaus-Fotos) als Data-URL, getrennt von members /
 * wirtshaeuser, damit a select() nie 20–150 KB Bild pro Zeile mitschleppt.
 * Schlüssel is die Mitglieds- bzw. Wirtshaus-ID. Ausgeliefert über
 * /foto/<id>-<hash>.jpg mit Jahres-Cache, der Hash wechselt beim neuen Bild.
 */
export const fotos = sqliteTable('fotos', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
});

export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
});

export const wirtshaeuser = sqliteTable('wirtshaeuser', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  adresse: text('adresse'),
  bezirk: text('bezirk'),
  lat: real('lat'),
  lng: real('lng'),
  photoUrl: text('photo_url'),
  biersorte: text('biersorte').notNull().default('Augustiner'), // Helles
  weissbier: text('weissbier'), // null = koa Weißbier ausg'schenkt
  telefon: text('telefon'),
  // Gesetzt, wenn ein Spezl das Wirtshaus über „Wirtshaus gfunden" vorgeschlagen hat.
  vorgeschlagenVon: text('vorgeschlagen_von').references(() => members.id),
  // „Vor der App"-Chronik: besucht seit 2019, aber ohne Termin-/Besuchsdaten.
  altbestand: integer('altbestand', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Freiwillige Nachbewertung (Altbestand oder Wiederbesuch ohne Stammtisch):
// eine pro Spezl & Wirtshaus, änderbar, bringt bewusst KEINE WP.
// Ziel: saubere Doku aller Münchner Wirtshäuser, wo is' gut, wo der beste
// Kaiserschmarrn, wo der beste Brodn.
export const wirtshausBewertungen = sqliteTable(
  'wirtshaus_bewertungen',
  {
    id: text('id').primaryKey(),
    wirtshausId: text('wirtshaus_id').notNull().references(() => wirtshaeuser.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    // Bewertungen mit einer Kommastelle (±-Stepper ab 3,0), wie beim Besuch-Abschluss.
    // SQLite-Affinität macht den Wechsel integer→real migrationsfrei.
    sterne: real('sterne').notNull(), // 1,0–5,0
    kaiserSterne: real('kaiser_sterne'), // 1,0–5,0, optional
    brodnSterne: real('brodn_sterne'), // 1,0–5,0, optional
    kommentar: text('kommentar'), // Freitext zum Wirtshaus
    kaiserNotiz: text('kaiser_notiz'), // Freitext zum Schmarrn → 🥞-Hinweis
    brodnNotiz: text('brodn_notiz'), // Freitext zum Brodn → 🍖-Hinweis
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('wirtshaus_bewertungen_wirtshaus_member').on(t.wirtshausId, t.memberId)],
);

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull(),
});

export const termine = sqliteTable('termine', {
  id: text('id').primaryKey(),
  datum: text('datum').notNull(), // ISO-Datum, z.B. 2026-07-23
  zeit: text('zeit').notNull().default('19:00'),
  phase: text('phase', { enum: ['planung', 'reserviert', 'heute', 'abgeschlossen'] })
    .notNull()
    .default('planung'),
  planerId: text('planer_id').references(() => members.id),
  wirtshausId: text('wirtshaus_id').references(() => wirtshaeuser.id),
  // Wer den Besuch abgeschlossen hat (gibt 1 WP; meiste Abschlüsse = Schriftführer).
  abgeschlossenVon: text('abgeschlossen_von').references(() => members.id),
  abgeschlossenAm: text('abgeschlossen_am'), // ab da läuft die 7-Tage-Nachtragsfrist
  // Wer am Abend „Wer war da“ abgehakt und den nächsten Termin ausgemacht hat (+2 WP).
  // Der Abend selber schließt sich danach erst um 3 Uhr früh von allein (lib/abend.ts).
  erfasstVon: text('erfasst_von').references(() => members.id),
  erfasstAm: text('erfasst_am'),
  createdAt: text('created_at').notNull(),
});

/**
 * Verschickte Erinnerungs-Mails (lib/erinnerungen.ts): jede Art geht pro
 * Termin und Spezl nur einmal raus. memberId '*' = eine Erinnerung an alle.
 */
export const erinnerungen = sqliteTable(
  'erinnerungen',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    art: text('art').notNull(),
    memberId: text('member_id').notNull(),
    gesendetAm: text('gesendet_am').notNull(),
  },
  (t) => [uniqueIndex('erinnerungen_termin_art_member').on(t.terminId, t.art, t.memberId)],
);

/**
 * „Willst du no dabei sein?“ (30.10.2026): wer wackelt, kriegt einmal pro
 * Wackel-Phase a Mail mit Ja/Abschied (Token-Link, ohne Login). Ohne Antwort
 * entscheidet nach 14 Tagen der Präsident. erledigt = Phase abgeschlossen.
 */
export const wackelAnfragen = sqliteTable(
  'wackel_anfragen',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    /** `<gruppeId>.<zufall>`, der Präfix bindet den Mandanten auf der Antwortseite */
    token: text('token').notNull(),
    erstelltAm: text('erstellt_am').notNull(),
    antwort: text('antwort', { enum: ['dabei', 'abschied'] }),
    beantwortetAm: text('beantwortet_am'),
    praesidentGemeldetAm: text('praesident_gemeldet_am'),
    erledigt: integer('erledigt', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [uniqueIndex('wackel_anfragen_token').on(t.token)],
);

export const votes = sqliteTable(
  'votes',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    wert: text('wert', { enum: ['zu', 'vielleicht', 'ab'] }).notNull(),
    updatedAt: text('updated_at').notNull(),
    // Wann die ERSTE Stimme kam (wird bei Änderungen nie überschrieben) —
    // entscheidet über den „rechtzeitig abgstimmt"-Bonus (3-Tage-Frist).
    erstmalsAm: text('erstmals_am'),
    // Wann zuletzt auf „ab“ gewechselt (Strafenkatalog, Absage-Frist). null = vor dem 05.11.2026 oder nie abgesagt.
    abgesagtAm: text('abgesagt_am'),
  },
  (t) => [uniqueIndex('votes_termin_member').on(t.terminId, t.memberId)],
);

// Ein Eintrag pro Mitglied pro abgeschlossenem Besuch (Hoiben-Zählung etc.).
export const besuche = sqliteTable(
  'besuche',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    anwesend: integer('anwesend', { mode: 'boolean' }).notNull().default(true),
    hoiben: integer('hoiben').notNull().default(0),
    // davon Weißbier (a Weiße is aa a Hoibe: zählt in hoiben mit, hier nur der Anteil)
    weissbier: integer('weissbier').notNull().default(0),
    schnaps: integer('schnaps').notNull().default(0), // nur bei Stammtischen mit Feature schnaps
    // Live am Abend gschmissene Runden (Bier/Schnaps), belegen den Abschluss-Zettel vor
    rundenBier: integer('runden_bier').notNull().default(0),
    rundenSchnaps: integer('runden_schnaps').notNull().default(0),
    // Davon per Runde ausgegeben (in hoiben/schnaps enthalten), am Deckel golden: des zahlt wer anders
    hoibenAusgegeben: integer('hoiben_ausgegeben').notNull().default(0),
    schnapsAusgegeben: integer('schnaps_ausgegeben').notNull().default(0),
    kaiserschmarrn: integer('kaiserschmarrn').notNull().default(0),
    schweinsbraten: integer('schweinsbraten').notNull().default(0),
    taxi: integer('taxi', { mode: 'boolean' }).notNull().default(false), // hat gfahrn & Spezln mitgnommen
    zuSpaet: integer('zu_spaet', { mode: 'boolean' }).notNull().default(false), // z’spät kemma (vermerkt der Abschließer)
    sterne: integer('sterne'), // 1–5, Bewertung des Wirtshauses
    kaiserSterne: integer('kaiser_sterne'), // 1–5, Kaiserschmarrn-Bewertung
    brodnSterne: integer('brodn_sterne'), // 1–5, Schweinsbraten-Bewertung
    kaiserNotiz: text('kaiser_notiz'),
    brodnNotiz: text('brodn_notiz'),
    kommentar: text('kommentar'),
  },
  (t) => [uniqueIndex('besuche_termin_member').on(t.terminId, t.memberId)],
);

// Wer scho im Wirtshaus sitzt, checkt ein: der Erste kriegt an WP, verrät im
// Freitext wo die Spezln hocken („hinten rechts, bei der Band") und alle
// anderen kriegen an Push. Einchecken geht ab 2 Stunden vor Termin-Beginn.
export const checkins = sqliteTable(
  'checkins',
  {
    id: text('id').primaryKey(),
    terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    platz: text('platz'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('checkins_termin_member').on(t.terminId, t.memberId)],
);

export const kasse = sqliteTable('kasse', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  terminId: text('termin_id').references(() => termine.id),
  grund: text('grund').notNull(),
  betragCents: integer('betrag_cents').notNull(), // Forderung/Ausgabe negativ, Einzahlung positiv
  kind: text('kind', { enum: ['strafe', 'einzahlung', 'ausgabe', 'runde'] }).notNull(),
  status: text('status', { enum: ['offen', 'beglichen', 'aufgehoben'] }).notNull().default('offen'),
  // Wer den Eintrag angelegt/gemeldet hat, null = automatisch von der App (z. B. Abschluss-Strafen)
  gemeldetVon: text('gemeldet_von').references(() => members.id),
  createdAt: text('created_at').notNull(),
});

/**
 * Strafenkatalog pro Stammtisch (04.11.2026). Drei feste Regeln (unentschuldigt,
 * entschuldigt, serie) buchen automatisch beim Abschluss, eigene Regeln bucht
 * jemand am Tisch oder in der Kasse. Abgeschaltet wird mit aktiv = false, nie gelöscht.
 */
export const strafenRegeln = sqliteTable('strafen_regeln', {
  id: text('id').primaryKey(),
  art: text('art', { enum: ['unentschuldigt', 'entschuldigt', 'serie', 'eigene'] }).notNull(),
  name: text('name').notNull(),
  detail: text('detail'),
  /** WP je n-tem Mal in Folge (letzter Wert gilt ab da), bei eigenen und serie ein Wert. Negativ = Abzug. */
  wpStaffel: text('wp_staffel', { mode: 'json' }).$type<number[]>().notNull(),
  betragCents: integer('betrag_cents').notNull().default(0),
  /** Absage-Frist (nur unentschuldigt): bis Beginn, x Tage vorher (24 Uhr), x Stunden vor Beginn */
  fristArt: text('frist_art', { enum: ['beginn', 'tage', 'stunden'] }).notNull().default('beginn'),
  fristWert: integer('frist_wert').notNull().default(0),
  nichtEingetragenZusage: integer('nicht_eingetragen_zusage', { mode: 'boolean' }).notNull().default(true),
  /**
   * Eigene Strafe automatisch buchen (04.11.2026), null = von Hand:
   * reservierung: Organisator hat x Tage vorher noch nicht reserviert
   * abstimmen: x Tage vorher noch nicht zu- oder abgesagt
   * bewertung: x Tage nach dem Abend noch nicht bewertet (nur wer da war)
   * orga_flop: Abend-Schnitt unter x Sternen (an den Organisator, nach der Nachtragsfrist)
   */
  ausloeser: text('ausloeser', { enum: ['reservierung', 'abstimmen', 'bewertung', 'orga_flop'] }),
  ausloeserWert: integer('ausloeser_wert').notNull().default(0),
  erlassbar: integer('erlassbar', { mode: 'boolean' }).notNull().default(true),
  aktiv: integer('aktiv', { mode: 'boolean' }).notNull().default(true),
  sort: integer('sort').notNull().default(0),
  /** Alte Config `strafeFehlenCents` schon in den Betrag übernommen? */
  configUebernommen: integer('config_uebernommen', { mode: 'boolean' }).notNull().default(true),
  erstelltAm: text('erstellt_am').notNull(),
  erstelltVon: text('erstellt_von').references(() => members.id),
  geaendertAm: text('geaendert_am'),
  geaendertVon: text('geaendert_von').references(() => members.id),
});

/**
 * Gebuchte Strafen. WP und Betrag san beim Buchen eingefroren. Ein €-Anteil
 * steht zusätzlich als `kasse`-Zeile (kasseId), damit Kassenbuch und Saldo
 * wie gehabt laufen. Feste Strafen haben wp = null (ihre WP rechnet getStats
 * aus der Staffel), die Buchung selbst friert „unentschuldigt ja/nein“ ein.
 */
export const strafen = sqliteTable('strafen', {
  id: text('id').primaryKey(),
  regelId: text('regel_id').references(() => strafenRegeln.id),
  art: text('art', { enum: ['unentschuldigt', 'entschuldigt', 'serie', 'eigene'] }).notNull(),
  name: text('name').notNull(),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  terminId: text('termin_id').references(() => termine.id, { onDelete: 'cascade' }),
  wp: integer('wp'),
  betragCents: integer('betrag_cents').notNull().default(0),
  kasseId: text('kasse_id').references(() => kasse.id),
  status: text('status', { enum: ['offen', 'erlassen'] }).notNull().default('offen'),
  gebuchtVon: text('gebucht_von').references(() => members.id),
  benachrichtigt: integer('benachrichtigt', { mode: 'boolean' }).notNull().default(false),
  /** Von einer automatischen eigenen Strafe gebucht (eindeutig je Termin, Regel, Spezl) */
  auto: integer('auto', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Umfragen: jeder Spezl kann eine starten (Frage + beliebig viele Antworten).
// Antworten als JSON-Array, die Position im Array ist der antwortIndex der Stimmen.
export const umfragen = sqliteTable('umfragen', {
  id: text('id').primaryKey(),
  frage: text('frage').notNull(),
  antworten: text('antworten', { mode: 'json' }).$type<string[]>().notNull(),
  erstelltVon: text('erstellt_von').references(() => members.id),
  createdAt: text('created_at').notNull(),
});

export const umfrageStimmen = sqliteTable(
  'umfrage_stimmen',
  {
    id: text('id').primaryKey(),
    umfrageId: text('umfrage_id').notNull().references(() => umfragen.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    antwortIndex: integer('antwort_index').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('umfrage_stimmen_umfrage_member').on(t.umfrageId, t.memberId)],
);

// Gschmissene Runden einzeln (06.11.2026): wer hat wem was ausgegeben. Die Summen
// stehen weiter in besuche (hoiben/hoiben_ausgegeben), zurücknehmen darf nur der Spender.
export const runden = sqliteTable('runden', {
  id: text('id').primaryKey(),
  terminId: text('termin_id').notNull().references(() => termine.id, { onDelete: 'cascade' }),
  spenderId: text('spender_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  art: text('art', { enum: ['bier', 'schnaps'] }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const rundenEmpfaenger = sqliteTable(
  'runden_empfaenger',
  {
    rundeId: text('runde_id').notNull().references(() => runden.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.rundeId, t.memberId] })],
);

// Präsidentenwahl (Modus „gewählt“, 06.11.2026): startet beim Schließen des ersten
// Stammtischs im Jahr, a Woch’ offen; der Gewinner landet als Amt „Präsident“ in aemter.
export const praesidentWahlen = sqliteTable('praesident_wahlen', {
  id: text('id').primaryKey(),
  jahr: integer('jahr').notNull(),
  ende: text('ende').notNull(),
  terminId: text('termin_id').references(() => termine.id, { onDelete: 'set null' }),
  gestartetVon: text('gestartet_von').references(() => members.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['offen', 'ausgewertet'] }).notNull().default('offen'),
  gewinnerId: text('gewinner_id').references(() => members.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
});

export const praesidentStimmen = sqliteTable(
  'praesident_stimmen',
  {
    id: text('id').primaryKey(),
    wahlId: text('wahl_id').notNull().references(() => praesidentWahlen.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    kandidatId: text('kandidat_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('praesident_stimmen_wahl_member').on(t.wahlId, t.memberId)],
);

export const aemter = sqliteTable('aemter', {
  id: text('id').primaryKey(),
  titel: text('titel').notNull(),
  icon: text('icon').notNull().default('🍺'),
  memberId: text('member_id').references(() => members.id),
  saison: text('saison').notNull(), // z.B. "2026"
});
