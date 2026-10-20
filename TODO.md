# Wirtschaftln: Todos (Stand 2026-10-20)

Die alte Liste (Stand Juli, mit allen erledigten Punkten) steht in der Git-Historie dieser Datei.

## Letzter Stand
- Link-Vorschau Redesign live (adaac60): eigenes Vorschaubild je Einladung unter /vorschau/…, kurze Teilen-Texte
- Nächsten Termin ausmachen ohne Bewertung (62ef4cc): Formular hat nur noch „Wer war da“ und Datum
- Abend bleibt offen bis 3 Uhr (7240649): nächster Termin +2 WP, Deckel bleibt offen, Abend schließt automatisch
- Deckel-Kasten auf Hoam öffnet den Bierdeckel im Vollbild (50e741f)
- Alle Screens aus dem Design-Projekt 1aa95a99 sind umgesetzt

## Wartet auf Julius
- [ ] **Kichererbsen-Termin vom 12.09.2026** hängt offen auf Prod (Phase heute). Auto-Schluss greift nur für die letzten 3 Tage. Schließen? (Prod-DB-Schreibzugriff, braucht OK)
- [ ] **Link-Vorschau in WhatsApp echt testen** (Beitreten- und Gründen-Link schicken). Schon geteilte Links können noch das alte Bild zeigen.
- [ ] **Badge-Pflichten:** restliche Regeln fehlen, dann nur Texte eintragen (`pflicht` in badges.ts)
- [ ] **„Kein Wirtshaus zweimal“:** Warnung oder Sperre beim Wählen eines schon besuchten Wirtshauses?

## Fachlich offen
- [ ] Kassenwart per In-App-Wahl (bisher trägt Admin oder Präsident das Ergebnis ein)
- [ ] Zu-/Absage direkt aus der Mail (Ein-Klick-Links mit Token)
- [ ] „Termin absagen“-Pfad fehlt
- [ ] Strafkatalog aus dem Design: zu spät, falsches Wirtshaus, Kurzfrist-Absage
- [ ] Präsident „richtet“: offene Strafen erlassen oder bestehen lassen
- [ ] +WP-Animation bei Sofort-Aktionen (einmalig)
- [ ] Zahlungsaufforderung zusätzlich per Mail
- [ ] Vorschaubild-Foto je Stammtisch hinterlegbar (Design sieht's vor, jetzt immer Panorama)
- [ ] Echter Aufnahme-Flow mit Bürge und Kodex (statt nur Code)
- [ ] Optional: Punkte-Ereignis-Journal

## Technisch offen (aus dem Audit, bewusst verschoben)
- [ ] Aufgehobene Absage-Strafen leben bei Nachtrag wieder auf
- [ ] ICS-Escaping
- [ ] Saison-Zeitzone (UTC-Container, betrifft 1 bis 2 h am 1.1./1.7.)
- [ ] Legacy-„Vielleicht“-Stimmen noch sichtbar gelabelt
- [ ] Service-Worker-Cache wächst unbegrenzt
- [ ] Registrierungs-Rate-Limit ist prozess-global
