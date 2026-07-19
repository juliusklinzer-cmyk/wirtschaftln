# Wirtschaftln — Todos (Stand 2026-07-15)

Quelle „Design": Prototyp-Code unter `design-system/ui_kits/app/` (der Code ist die Spezifikation).
**(neu)** = nicht im Design-System vorhanden, kommt aus Julius' Feedback vom 15.07.

## 1. Login-Screen
- [x] Richtiges Wappen: `logo-verziert.png` (Drop-Shadow, Navy-Verlauf + Rauten-Trimband) — wie `LoginScreen.jsx`
- [x] Texte übernommen: Eyebrow „Münchner Stammtisch · seit 2019", Sheet „Servus, eini mit dir!", „Nur für Stammtisch-Mitglieder."
- [x] Button „Mitglied werden" (öffnet vorerst Mail an servus@wirtschaftln.de mit Bürge-Vorlage) + Zeile „Aufnahme nur mit Bürgen aus der Runde."
- [x] **Selbst-Registrierung für den Launch (19.07.):** `/beitreten` — Gründungscode (Env `WN_GRUENDUNGSCODE`, Default 1328; leer = Aufnahme zu) + Nachname/Vorname/E-Mail → Account (aktiv, Erstanmeldung) → auto-eingeloggt → Passwort + Profil auf `/profil` → los. Rate-Limit gegen Code-Raten; Login-Seite verlinkt drauf statt Mailto. **WhatsApp-Link für die 9: `https://wirtschaftln.de/beitreten`**
- [ ] Später: echter Aufnahme-Flow wie `RegisterFlow.jsx` (5 Schritte inkl. Bürge + Kodex) — der Code-Flow ist die Launch-Variante

## 2. Profil (`/profil`, übers Avatar-Menü) **(umgesetzt 15.07.)**
- [x] Profilbild-Upload (wird auf 256px verkleinert, als Data-URL in der DB → landet automatisch im Backup)
- [x] Anzeigename/Spitzname („so steht's auf der Rangliste")
- [x] Herkunft (Viertel), Lieblingsbier + Lieblingsweißbier (Dropdowns mit Logos), Leibspeise, Lieblings-Biergarten, Lieblings-Wirtshaus
- [x] Bayern oder Sechzig mit **echten Vereinslogos** (FCB/1860, `public/brand/vereine/`) / 🥨 Koa Fuaßboi; Schafkopfer-Schalter mit **Eichel** vom bayerischen Blatt; Freitext-Beschreibung
- [x] Profilbild-Zuschnitt wie bei anderen Apps: Kreis-Editor mit Schieben + Zoom, Handy-Fotos egal wie groß (Verkleinerung im Browser, Server final 256px)
- [x] Kopf zeigt aktuelles **Amt**, Platz, WP, Serie; getragene **Saison-Badges** (mit Pflicht) + dauerhafte **Serien-Abzeichen** schmücken das Profil
- [x] **Passwort ändern** (auf dem Profil, optional)
- [x] **Erstanmeldung:** Admin legt Spezl mit Start-Passwort an → beim ersten Login Weiterleitung aufs Profil mit „Servus beim Wirtschaftln!"-Banner, **neues Passwort Pflicht** + Profil ausfüllen
- [x] Fremde Profile ansehen: **Steckbrief im Spezl-Detail** (Rangliste → Member antippen) mit Logos, Eichel und Beschreibung als Zitat; eigener Steckbrief auch als Vorschau auf `/profil` („so sehng di d'Spezln")

## 3a. Letzter Stammtisch & Badge-Wechsel (15.07., umgesetzt)
- [x] **„Letzter Stammtisch"-Card auf Hoam:** WP-Ausbeute des Abends mit Herkunft (🎟️ Dabei +5 · 🍺 Hoibe · 📋 Organisiert +5 · ✅ Abgschlossen +1 · 🍻 Runde +10 · 🔥 Serien-Bonus / 🥶 Serie gerissen) + **Rang-Veränderung** (Rang 3 → 2 ▲1)
- [x] **Badge-/Amt-Wechsel** werden erkannt (Stand vor vs. nach dem letzten Termin) und auf Hoam gelistet („😴 Resi is jetza Heiwong!" mit „vorher …")
- [x] **Benachrichtigungen beim ersten Abschluss** (Push + Mail): an alle „X is jetza Y!", an den Neuen der passende Spruch (Heiwong: „schau, dass'd wieder öfter kommst!"), an den Abgelösten Spott bzw. beim Heiwong Gratulation — Sprüche in `app/src/lib/badges.ts` (`wechselTexte`)

## 3. Startseite (Hoam)
- [x] **Serie deutlicher**: `StreakChip`-Komponente (🔥 positiv, 🥶 negativ, ⚠️ „wackelt" ab −3, „· Rekord {bestStreak}") auf Hoam + Rangliste
- [x] **Negativ-Serie** echt berechnet (Vorzeichen-Streak + Allzeit-Rekord in `getStats`)
- [x] **Erster Fehltag = nur −1 WP**, noch keine Negativ-Serie-Anzeige; ab dem 2. Fehltag in Folge wächst der Serien-Malus (−1/−3/−6…, 🥶 ab −2, ⚠️ wackelt ab −3)
- [x] **Top 3** + eigene Position immer sichtbar (Gold-Rahmen in Top 3, sonst „···" + eigene Zeile mit Rang)
- [x] Leaderboard auf **WP** umgestellt (Startseite + Rangliste, WP-Tab mit Formel-Hinweis)

## 4. Punktesystem & Serien-Regeln (aus `RanglisteScreen.jsx` Z.6–13 übernehmen)
- [x] **WP-Formel** in `app/src/lib/punkte.ts`: Hoibe ×1 · Teilnahme ×5 · Organisieren ×5 · Runde ×10 · **Abschluss ×1** · Streak-Bonus = s·(s+1)/2 (nur positive Serie)
- [x] Saison vs. Allzeit (Toggle auf der Spezln-Seite; Saison = ab 1.7./1.1., Serie & Rekord laufen immer über die ganze Chronik)
- [x] **Negativ-Serie −3 = „wackelt"**: Karte auf Hoam fordert zur Runde auf — PayPal-Pool-Button + „oder bar beim Kassenwart"; PayPal-Link auch bei offenen Strafen verlinkt
- [x] **Serien-Abzeichen:** 3 Stammgast · 5 Inventar · 8 Urgestein · 10 Wirtshaus-Legende · 15 Unkaputtbar — für immer (nach Rekord-Serie), mit Julius' PNG-Grafiken (`serie-<n>.png`)
- [x] Saison-Badges aus dem Design (wandern automatisch weiter): 🐺 Zacher Hund, 🍺 Maximator, 💸 Großbauer, 😴 Heiwong, ⭐ Meister Eder, 🚕 Taxler (Häkchen beim Abschluss), 🐷 Die Sau — Vergabe-Logik in `app/src/lib/badges.ts`, Galerie + Discs auf der Spezln-Seite
- [x] **⛪ Alter Peter** (neu von Julius, vormals „Dauerbrenner"): höchste Serie; bei Gleichstand kriegt's der mit den meisten Hoiben. **💸 Großbauer heißt jetzt „Moshammer"**
- [x] **Eigene Badge-Grafiken (PNG)** von Julius in `app/public/brand/badges/` — 8 Badges + 5 Serien-Stufen, werden überall verwendet (Stil A, Stil B, Profil), Emoji/SVG nur noch Fallback
- [x] **Badge-Feier:** Neues Badge/Amt → Vollbild-Animation beim nächsten App-Öffnen (Feuerwerk, Badge poppt groß rein, Strahlenkranz, „Servus! Du bist jetza da neue …! Gratuliere 🍻" — beim Heiwong ohne Gratulation); einmalig pro Gerät (localStorage), mehrere Badges nacheinander (`BadgeFeier.tsx`, eingebunden auf Hoam)
- [x] **Badge-/Amts-Info-Fenster mit Hall of Fame:** Badge oder Amt antippen (Cards, Galerie, Ämter-Sektion, beide Stile) → Grafik groß, Name, Beschreibung, G'schichtl (`geschichte` in badges.ts), Pflicht/Aufgaben und Halte-Historie („seit …" / „von–bis") — rückgerechnet aus der Termin-Chronik (`getBadgeHistorie`), Kassenwart-Historie pro Saison aus der DB
- [x] Stil B hat jetzt auch die **Ämter-Sektion und Badge-Galerie** unten wie Stil A
- [x] **Rangliste nach einem Abend:** Karten schwingen animiert von der alten auf die neue Position ein; neben der WP-Zahl stehen ±Punkte und ▲/▼ Plätze (Saison und Allzeit getrennt berechnet)
- [x] **Vereinsringe:** Bayern-Spezln haben immer einen roten, Sechzger einen blauen Ring ums Profilbild (überall: Rangliste, Hoam, Profil, Abschluss, Archiv-Teilnehmer; Gold-Ring für Rang 1 sticht)
- [x] **Ranglisten-Stil entschieden (16.07.):** Stil B gewinnt — kompakte Karten mit Wertungs-Filter (WP · Hoibe · Wirtshäuser) + Saison/Allzeit-Toggle; Stil A und `/spezln/variante` entfernt
- [x] **Design-Runde 2 entschieden (19.07.):** wieder Variante B — ruhige Karten (keine Geisterzahl/Farbkanten), eigene Karte = Navy-Gold, kompakter Sticky-Filter (Tabs + ⇄), „Punktesystem"-Link, Badge-Galerie nur Grafik + Vergabe-Grund, neues Urkunden-Detail (Rauten-Band, Feder-Pop, große Badges, „Da Nachname Vorname"); Profil im gleichen Stil + Dani-Modus 🤳
- [ ] **Badge-Pflichten:** Datenmodell steht (`pflicht`-Text pro Badge, Maximator = „Starkbier vorweg" schon drin) — **restliche Regeln kommen von Julius**, dann nur Texte eintragen
- [ ] **Ämter: In-App-Wahl** für den Kassenwart (aktuell trägt Admin **oder aktueller Präsident** das Wahl-Ergebnis im Spezln-Tab ein — seit 17.07.; Präsident = automatisch WP-Rang 1 der Saison, Schriftführer = automatisch meiste Abschlüsse)
- [x] **Ämter-Patrone (17.07.):** Präsident = Prinzregent Luitpold, Schriftführer = Karl Valentin, Kassenwart = Jakob Fugger — Julius' Grafiken in `app/public/brand/badges/amt-*.png`, Texte + Pflichten in `AEMTER_INFO` (`badges.ts`), Anzeige in Ämter-Sektion + Info-Fenster
- [x] **Umfragen (17.07.):** Jeder startet auf Hoam eine Umfrage (Frage + Antwort A/B + „Antwort hinzufügen", max. 6); unbeantwortete stehen über „Deine Saison", nach dem Abstimmen rutscht die Umfrage mit Ergebnis-Balken ans Seitenende; Stimme änderbar, löschen darf Ersteller/Admin (`umfragen`/`umfrage_stimmen`, Migration 0006)
- [ ] Strafkatalog aus Design: Zugesagt & nicht erschienen −10 €, Zu spät (>30 min) −5 €, Falsches Wirtshaus −3 €; Kurzfrist-Absage <24 h = Strafrunde (3,80 € × Anwesende)
- [x] **Kasse überarbeitet (19.07.):** Zeremonie-Kopf (Rauten-Band, Kassenwart-Zeile), „D'Maßeinheit"-Karte mit Bräustüberl-Speisekarten-Link + 3,70-€-Preis, 💝 Spenden-Klappe (jeder, für sich selbst), Ausgaben nur Kassenwart/Admin (Server + UI), alle Aktionen als ErfolgsKlappe (Erfolgsmeldung + auto-zu); Runde gschmissen = koa Kassenbuch-Eintrag mehr (19.07.: am Tisch zahlt, dokumentiert über WP +5 und Moshammer; DB-Eintrag `kind='runde'` bleibt, wird nur rausgefiltert). **Kassenbuch seit 19.07. strikt aus Kassen-Perspektive:** Forderungen = +Betrag (orange offen / grün beglichen / durchgestrichen erlassen) + Erklärzeile. **Moshammer-Info-Fenster hat die Runden-Rangliste** (heier + gsamt, Top-3-Medaillen) hinter der Hall of Fame

## 5. Archiv
- [x] 4 Ansichten wie im Design: **Karte** (Vollbild) · **Sterne** · **Schmarrn** · **Brodn** — je Champion-Banner (👑 Wirtshaus Nr. 1 / Schmarrn-König / Brodn-König) + nummerierte Liste mit Medaillen, Bewertungen mit Kommastelle (4,6)
- [x] Detail-Dialog pro Wirtshaus: 3 Bewertungs-Kacheln, Organisator, **wer dabei war** (🍺/🥞/🍖 pro Spezl), **wichtige Hinweise** (Kaisi-/Brodn-Notizen + Kommentare), Biersorte
- [x] Besuch-Abschluss erweitert: 🍖-Zählung pro Spezl, Kaisi-/Brodn-Bewertung (Sterne + Notiz-Feld) erscheint automatisch sobald einer gegessen wurde, 🚕-Taxler-Häkchen, Biersorten-Dropdown (Standard Augustiner)
- [ ] Biersorten-**Logos** statt Text-Chip (Logo-Dateien nach `app/public/brand/biersorten/` legen)

## 6. Karte
- [x] **Google Maps JS API** (MapLibre raus): Vollbild, Bierkrug-Teardrop-Pins wie im Design — **Gold = Top 3 nach Sternen + nächstes Ziel 📍**, Blau = ausgewählt, Navy = besucht; Bottom-Card mit Foto, Status-Badge, Blättern **und Swipe**; Tippen aufs Foto öffnet das Detail
- [x] **Wirtshaus-Fotos aus Google**: automatischer Backfill über die Places-Textsuche im Client (ToS-konform, Key ist referrer-beschränkt), URL wird in der DB gespeichert

## 7a. Besuch abschließen (Regeln vom 15.07., umgesetzt)
- [x] **Abschließen darf jeder** Spezl (nicht nur Planer/Admin) — der **erste** Abschließer kriegt **+1 WP**
- [x] **Schriftführer = automatisch** der mit den meisten Abschlüssen (statt gewählt)
- [x] **Nachtragen bis 7 Tage** nach Abschluss: eigener Block auf der Termin-Seite, voll editierbar (Teilnehmer ergänzen, Werte ändern)
- [x] Formular nach Design (`terminSheets.jsx`): pro Zugesagtem 🚕/🍖/⭐-Toggles + 🍺-Stepper; Bewertungen als **±-Stepper ab 3,0 mit Kommastelle**
- [x] **Name antippen = „Abgsagt"** (zugesagt & nicht erschienen): Badges verschwinden, beim Abschluss entsteht automatisch eine **offene Forderung = Teilnehmer × Augustiner-Kellerpreis** (Konstante in `app/src/lib/preise.ts`, aktuell 4,90 € — bei Preiserhöhung anpassen); Zahlungsaufforderung mit PayPal-Link erscheint dem Spezl auf der Startseite
- [x] **Kaiserschmarrn wird geteilt**: ein Toggle statt Zählung pro Person — zählt für alle Anwesenden, Bewertung (Sterne + Notiz) klappt auf
- [x] **Brodn-Bewertung** erscheint nur, wenn oben wer 🍖 an hat — erst dann geht das Wirtshaus in die Brodn-Wertung
- [x] **⭐ Runde gschmissen** pro Person → Kasse-Eintrag (zählt für 💸 Großbauer + Runde ×10 WP)
- [x] **Welches Helle? / Welches Weißbier?** Dropdowns **mit Brauerei-Logos** (13 Logos aus Wikipedia/Favicons unter `app/public/brand/biersorten/`; Franziskaner/Giesinger/Tegernseer nur kleine Favicons — bessere Dateien einfach drüberlegen)
- [ ] Zahlungsaufforderung zusätzlich **per Mail** verschicken (kommt mit dem Mail-Setup, siehe 7.)

## 7. Termin-Lifecycle / Organisator
- [x] **Wirtshaus-Autocomplete (Google Places):** beim Festlegen und bei „Wirtshaus gfunden" — füllt Name, Adresse, Bezirk, ☎ Telefon, Koordinaten und Foto automatisch (Freitext-Fallback, wenn Google nix findet)
- [x] **„Wirtshaus gfunden"** auf der Startseite — darf jeder: landet als „Offen"-Pin auf der Karte (mit „gfunden von …"), der nächste Organisator kann's beim Reservieren direkt aus der Liste auswählen
- [x] **Benachrichtigung bei „Reserviert":** Web-Push (VAPID-Keys in `app/.env.local` — auf dem Server dieselben setzen!) + Mail an alle; Push-Abo über den 🔔-Hinweis auf der Startseite. **Mail geht erst raus, wenn das Hetzner-Postfach-Passwort in `app/.env.local` steht** (bis dahin wird der Versand still übersprungen)
- [ ] Zu-/Absage **direkt aus der Mail** (Ein-Klick-Links mit Token)
- [ ] **Organisator-Übergabe beim Bewerten des letzten Wirtshauses** festlegen (wie `NewTerminSheet`: „Wer plant & reserviert?") — **oder freilassen**: dann kann sich jeder, der zuerst dran denkt, den Organisator-Posten in der App selbst „packen" (neu)
- [ ] Neuer Termin wird nach dem Bewerten von einem Spezl eingetragen (Button „Nächsten Termin festlegen" wie im Design)

## 8. Offene Fragen an Julius (Stand: großteils beantwortet, siehe `app/.env.local`)
- [x] PayPal: Pool-Link `https://www.paypal.com/pool/9qV7mfrpaQ?sr=wccr`
- [x] Google-Maps-API-Key: aus den Firmengolf-Projekten übernommen → `NEXT_PUBLIC_GMAPS_KEY`; **Julius erweitert die URL-Freischaltung des Keys** (Anleitung siehe unten)
- [x] Mail: Hetzner-Postfach `servus@wirtschaftln.de` (SMTP `mail.your-server.de:587`) — **Postfach-Passwort noch in `app/.env.local` eintragen**
- [ ] Weitere Regeln kommen noch von Julius — betreffen v. a. **Badge-Pflichten** (siehe 4.)
- [ ] Serien-Abzeichen 3/6/10/15: Namen/Optik gewünscht? (nicht im Design — Vorschlag folgt)

### Anleitung: Google-Maps-Key für wirtschaftln.de freischalten
Nicht Search Console, sondern **Google Cloud Console**: https://console.cloud.google.com/apis/credentials → Projekt der Firmengolf-Seite → den Key anklicken → unter **„Anwendungsbeschränkungen" → „Websites"** diese Referrer ergänzen:
- `https://wirtschaftln.de/*`
- `https://www.wirtschaftln.de/*`
- `http://localhost:3000/*` (fürs lokale Testen)

Unter „API-Einschränkungen" muss **Maps JavaScript API** erlaubt sein.

## Go-Live-Audit (17.07.) — behoben
- [x] Docker: `NEXT_PUBLIC_*` als Build-Args + Laufzeit-Secrets über `deploy/.env` (`docker compose --env-file deploy/.env up -d --build`), HEALTHCHECK
- [x] Streak zählt erst ab Beitritt (Neu-Mitglieder starten nicht mehr mit Minus-Serie)
- [x] Passwortwechsel verlangt aktuelles Passwort + wirft alle anderen Sessions raus; Login-Rate-Limit (5 Versuche → 15 min) + Dummy-Verify; Erstanmeldung wird auf allen Seiten erzwungen
- [x] `wirtshausFestlegen` nur Organisator/Admin + Phasen-Check; `forderungStatus` mit Laufzeit-Whitelist, eigene Strafe nicht selbst ausbuchbar (UI versteckt Buttons); Foto-URL-Allowlist auch beim Anlegen
- [x] Betrieb: `scripts/backup.ts` (Online-Backup + Rotation), robots.txt + noindex, Deploy-Anleitung in `deploy/README.md`, `deploy/env.example`
- [ ] Nach Livegang (aus dem Audit, bewusst verschoben): aufgehobene Absage-Strafen leben bei Nachtrag wieder auf, ICS-Escaping, Saison-Zeitzone (UTC-Container, betrifft nur 1–2 h am 1.1./1.7.), „Termin absagen"-Pfad fehlt, Orga-WP erst nach 7-Tage-Frist endgültig, Legacy-„Vielleicht"-Stimmen noch sichtbar gelabelt
- [x] **Audit 19.07. (vor Deploy) behoben:** Gründungscode fail-closed (kein 1328-Fallback auf Prod), Freitext-Längenlimits (Umfragen/Profil/Bewertungen), Push-Endpoint-Allowlist (SSRF), melden-memberId-Validierung, mitgliedAnlegen-Dubletten-Check, Präsident-Logik vereinheitlicht (punkte > 0, sonst koaner — queries.ts + daten.ts), +1→+3-WP-Text beim Abschließen, Einzahlungs-Placeholder (Doppelzählungs-Falle), demo.ts-Prod-Guard, Dockerfile-Fail-Fast bei fehlenden Build-Args. Runden-Saison über Termin-Datum war schon umgesetzt.

## Punktesystem V2 (18.07. VOR dem Launch umgesetzt)
Spec: `docs/spec-punktesystem-v2.md` (mit Codex erstellt, 17.07. von Claude reviewt & mit Julius' Antworten korrigiert)
- [x] „Vielleicht" abgeschafft (17.07.): VotePills nur noch Zusagen/Absagen, Action validiert, Hoam-Zähler angepasst (DB-Enum bleibt für Alt-Stimmen)
- [x] Maßeinheit umgestellt (17.07.): `HOIBE_KELLERPREIS_CENTS` = 3,70 € (Augustiner Hell vom Fass, Bräustüberl)
- [x] **Neue WP-Berechnung (18.07.):** Taxi +5 · Runde 5 · erster Abschluss 3 · Orga 0–5 nach Sterne-Schnitt · rechtzeitig abstimmen +1 (erste Stimme bis 3 Tage vorher, Europe/Berlin, `votes.erstmals_am` Migration 0010) · Wirtshaus-Vorschlag +1/+1 · Bewertungs-Text +1 · **Serienbonus fest je Abend** (2.=+1, 3.=+2 … ungedeckelt, Riss löscht nix) · Fehl-Staffeln getrennt (abgsagt 0/−1/−5/−10 · unentschuldigt −5/−10/−15, „zugsagt & ned kemma" zählt unentschuldigt) — alles in `punkte.ts` + `getStats` (abgeleitet aus der Chronik statt Journal: gleiche Zahlen, Nachträge korrigieren sauber)
- [x] **Strafrunde automatisch** beim 3. unentschuldigten Fehlen in Folge (beim ersten Abschluss des Abends, Teilnehmer × Hoibn-Preis, doppelt-sicher) · „wackelt" hängt jetzt an der unentschuldigt-Serie (Hoam-Karte, StreakChips)
- [x] Hoam „Dei Ausbeute" zeigt alle neuen Posten (🚕 Gfahren, 🗳️ Abgstimmt, ✍️ Text, 📍 Vorschlag, 🔥/🥶 aus festen Bestandteilen) · `PunkteInfo`-Aufklärung komplett auf V2
- [x] Rechen-Checks: Staffeln, Orga-Rundung, Berlin-Frist (23:00 ja / 00:30 nein), Julius' Beispiele (Taxler 15 WP, Organisator 15 WP) — alle grün
- [ ] +WP-Animation bei Sofort-Aktionen (einmalig, nicht bei Wiederholung) — nach Launch
- [ ] Präsident „richtet": offene Strafen auf seiner Hoam, erlassen/bestehen lassen — nach Launch
- [ ] Punkte-Ereignis-Journal (nachvollziehbare Einzelbuchungen) — optional nach Launch, Zahlen sind ohne identisch

## Altbestand & Nachbewertung (17.07., umgesetzt)
- [x] **49 „vor der App"-Wirtshäuser** aus Julius' Google-Liste: `scripts/altbestand.ts` (läuft auch auf Prod), Flag `wirtshaeuser.altbestand`, Migration 0007
- [x] Karte: Altbestand = navy Pin + Badge „📜 Bsucht vor da App" (Detail: „Chronik seit 2019"), **Orts-/Foto-Backfill** über Google Places beim ersten Karten-Öffnen (`wirtshausOrtSetzen` + bestehender Foto-Backfill, danach automatischer Refresh)
- [x] **Nachbewertung** (freiwillig, bewusst OHNE WP): Wirtshaus-Bewertung als **±-Stepper ab 3,0 mit Kommastelle** (wie beim Abschluss) + optional 🥞 Schmarrn / 🍖 Brodn (per „+ bewerten" zuschaltbar, je eigener Stepper), **je Wertung ein eigenes Freitextfeld** (Wirtshaus-Kommentar 💬, Schmarrn-Notiz 🥞, Brodn-Notiz 🍖 — erscheinen als Hinweise mit „(nachbewertet)"); pro Spezl & Wirtshaus, änderbar; fließt als gewichteter Schnitt in alle drei Wertungen („inkl. n Nachbewertungen"), **nicht** in Meister Eder — Ziel: saubere Wirtshaus-Doku für München, auch aus der Erinnerung (Migrationen 0008/0009)
- [x] Fix (17.07.): Altbestand tauchte über `getOffeneWirtshaeuser` als grauer ❓-Pin auf → ausgeschlossen, jetzt blauer Bierkrug-Pin wie besucht; dadurch auch nicht mehr in der Reservierungs-Auswahl (Regel: kein Wirtshaus zweimal)
- [x] Kein Wirtshaus-Duplikat mehr, wenn ein Klassiker wiederbesucht wird (Namens-Dedupe in `wirtshausAusSuche`)
- [x] Altbestand klar gekennzeichnet (17.07.): solid-blaues „📜 Bsucht vor da App"-Badge, in der Sterne-Liste Zeile „📜 Vor da App · zählt koane Punkte", im Detail blauer „Vor da App"-Chip + Hinweis „Sterne zählen in der Wertung — Punkte gibt's dafür koane"
- [ ] **Grundregel „kein Wirtshaus zweimal":** in der App durchsetzen? (Warnung/Sperre, wenn der Organisator ein schon besuchtes/Altbestand-Wirtshaus wählt) — Julius entscheidet
- [ ] **Vor dem Prod-Deploy dran denken:** Test-Marker existieren nur lokal — Prod-DB startet leer, nur `seed.ts` + `altbestand.ts` ausführen (steht in `deploy/README.md`)

## Später (aus V1 noch offen)
- [ ] Deployment auf Hetzner-VPS (VPS noch nicht bestellt), DNS wirtschaftln.de
- [ ] Passwort ändern
- [x] Wirtshaus-Fotos (via Google Places, siehe 6.)
- [x] Ämter-UI (Präsident automatisch = WP-Rang 1, Kassenwart/Schriftführer weist der Admin zu; In-App-Wahl siehe 4.)
