# Spec: Wirtschaftln-Punktesystem V2

## Objective

Das Punktesystem soll regelmäßige Teilnahme, Verlässlichkeit und Beiträge zur Gemeinschaft belohnen, ohne bereits verdiente Serienpunkte später wieder abzuziehen. Jede Punktebewegung muss einem konkreten Ereignis zugeordnet und dauerhaft nachvollziehbar sein.

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- SQLite mit Drizzle ORM
- Server Actions für Abstimmungen, Abschluss und Nachträge

## Commands

- Abhängigkeiten: `cd app && npm ci`
- Typprüfung: `cd app && npx tsc --noEmit`
- Produktion-Build: `cd app && npm run build`
- Migration erzeugen: `cd app && npm run db:generate`
- Entwicklung: `cd app && npm run dev`

## Project Structure

- `app/src/lib/punkte.ts`: Regeln und reine Berechnungsfunktionen
- `app/src/lib/db/schema.ts`: dauerhaft gespeicherte Punkt-Ereignisse und Statusdaten
- `app/src/lib/queries.ts`: Gesamtstände, Saisonstände und Historie
- `app/src/app/(app)/termin/`: Abstimmung, Besuchsabschluss und Nachträge
- `app/src/components/domain/`: Punkteanimation und Zusammenfassung
- `app/drizzle/`: Datenbankmigrationen

## Fachliche Regeln

### Teilnahme und Beiträge

| Ereignis | Punkte |
| --- | ---: |
| Anwesend | +5 WP |
| Hoibe | +1 WP je Hoibe |
| Gefahren und Spezln mitgenommen | +5 WP |
| Runde geschmissen | +5 WP |
| Rechtzeitig abgestimmt | +1 WP |
| Wirtshaus vorgeschlagen | +1 WP |
| Vorgeschlagenes Wirtshaus tatsächlich besucht | weitere +1 WP |
| Als Erster im Wirtshaus eingecheckt | +1 WP |
| Erster Abschluss des Abends | +3 WP |
| Eigene Bewertung zum Abend abgegeben | +1 WP |
| Eigene Bewertung mit Text ausgeschmückt | weitere +1 WP |
| Organisiert | endgültige Durchschnittsbewertung, gerundet auf 0–5 WP |

Schweinsbraten, alkoholfreie Getränke und sonstige Speisen erzeugen keine WP.

### Individuelle Bewertung statt Abschluss-Bewertung (27.08.2026)

Hintergrund: Der Abend wurde teils mittendrin abgeschlossen („punktegeile" Schnellabschlüsse), bevor alle Informationen des Tages vorlagen — mit Streit über die dann einseitige Bewertung.

- Jedes anwesende Mitglied gibt seine **eigene** Bewertung ab („Mei Bewertung"): Wirtshaus-Sterne (1,0–5,0, eine Kommastelle) + Freitext, dazu optional Kaiserschmarrn- und Schweinsbraten-Sterne/-Notiz — **nur wer selber probiert hat**, bewertet die Speise.
- Das Bewertungsfenster läuft ab dem Stammtisch-Abend (wie der Bierdeckel) bis zum Ende der siebentägigen Nachtragsfrist; die Bewertung ist im Fenster jederzeit änderbar. Nach dem Abschluss dürfen nur die als anwesend Verbuchten bewerten.
- Die **Tagesbewertung ist der Durchschnitt aller abgegebenen Einzelbewertungen** (nur von Anwesenden). Je Kategorie zählen nur die abgegebenen Werte: Haben nur zwei Spezln den Schweinsbraten bewertet, geht genau deren Schnitt in die Brodn-Wertung ein.
- Alle Freitexte werden im Archiv mit Autor angezeigt — jede Meinung bleibt sichtbar.
- WP: +1 für die abgegebene Bewertung, weitere +1, wenn ein Freitext dabei ist. Beides höchstens einmal je Mitglied und Termin (Ändern erzeugt keine weiteren WP).
- Der **Abschluss enthält keine Bewertung mehr** — er verbucht nur noch die Logistik des Abends (Anwesenheit, Hoibn, Brodn/Taxi/Runden, Kaiserschmarrn bestellt, Biersorten).
- Der Abschluss ist frühestens **zwei Stunden nach Termin-Beginn** möglich (19:00 → ab 21:00 Uhr; von Julius am 27.08.2026 festgelegt), oder ab dem Folgetag (`abschlussOffen` in `app/src/lib/punkte.ts`).

### Organisator-Vergabe („I regle das!", 29.08.2026)

- Ein neuer Termin wird **ohne Organisator** angelegt (typisch vom Abschließer des letzten Abends, direkt am Tisch). Beim Anlegen geht wie bisher Push + Mail zur Abstimmung an alle.
- Solange der Termin in der Planung ist und keinen Organisator hat, kann sich **jedes Mitglied den Posten schnappen** („I regle das!") — wer zuerst kommt, organisiert. Beim Schnappen gehen Push + Mail an alle, damit nicht zwei parallel loslegen.
- **Sperre:** Wer den letzten abgeschlossenen Stammtisch organisiert hat, darf den direkt nächsten **nicht** auch organisieren (kein Doppel-Organisieren hintereinander; von Julius am 29.08.2026 festgelegt). Server- und UI-seitig erzwungen.
- Wirtshaus festlegen/ändern darf erst der Organisator (bzw. Präsident/Admin), sobald der Posten vergeben ist.

### Check-in (27.08.2026)

- Am Stammtisch-Tag ab **zwei Stunden vor Termin-Beginn** kann jedes Mitglied direkt auf der Startseite (Termin-Karte) einchecken — bis der Besuch abgeschlossen ist.
- Der **erste** Check-in bringt +1 WP (zählt wie der Abstimmungs-Bonus sofort, ohne Abschluss), muss in einem **Pflicht-Freitext** (max. 120 Zeichen) beschreiben, wo die Gruppe sitzt („hinten rechts, bei der Band"; Pflichtfeld seit 29.08.2026), und löst einen Push an alle Mitglieder aus. Nachfolgende Check-ins brauchen keinen Freitext.
- Weitere Check-ins bringen keine WP, werden aber auf der Startseite angezeigt („san scho da").
- Ein Check-in markiert die Anwesenheit des Mitglieds (Vorbelegung für Bierdeckel und Abschluss-Zettel).

### Rechtzeitige Abstimmung

- Es gibt nur noch Zusage oder Absage. „Vielleicht" ist abgeschafft (Altlast; UI und Action bereits umgestellt, 17.07.2026). Historische „vielleicht"-Stimmen werden wie keine Stimme behandelt.
- Die Stimme kann bis zum Termin jederzeit geändert werden.
- Eine Zu- oder Absage ist rechtzeitig, wenn sie bis **einschließlich Ende des Kalendertages drei Tage vor dem Termin** gespeichert wird (Europe/Berlin). Beispiel: Termin am 20. Juli → rechtzeitig bis 17. Juli, 23:59:59 Uhr.
- Kurzfristige Termine sind kein Problem: Der Termin wird direkt nach dem vorherigen Stammtisch angelegt und bestätigt — auch ohne zugeordnetes Wirtshaus. Abgestimmt wird über den Termin; die Wirtshaus-Reservierung kann danach erfolgen, wenn die Zu-/Absagen stehen.
- Der +1-WP-Bonus wird höchstens einmal je Mitglied und Termin vergeben; maßgeblich ist die erste gespeicherte Stimme. Ein späterer Wechsel erzeugt keinen weiteren WP und nimmt den Bonus nicht weg.
- Eine verspätete Zu- oder Absage ist entschuldigt, bringt aber keinen Abstimmungs-WP.
- Wer gar keine Stimme abgibt und nicht anwesend ist, fehlt unentschuldigt.

### Positive Anwesenheitsserie

- Beim ersten Besuch nach einer Abwesenheit gibt es keinen zusätzlichen Serienbonus.
- Beim zweiten Besuch in Folge gibt es +1 WP, beim dritten +2 WP, beim vierten +3 WP usw.
- Der Bonus ist nicht gedeckelt.
- Der Bonus des jeweiligen Abends wird beim ersten Abschluss dauerhaft gutgeschrieben.
- Eine spätere Abwesenheit beendet die Serie, entfernt aber keine bereits verdienten WP.
- Nachträge dürfen den Bonus korrigieren, müssen dies als nachvollziehbare Korrektur tun und dürfen keine Doppelbuchung erzeugen.

### Entschuldigte Fehlserie

Eine gespeicherte Absage gilt unabhängig vom Zeitpunkt als entschuldigt. Der Abzug je aufeinanderfolgender entschuldigter Abwesenheit lautet:

| Abwesenheit in Folge | Punkte dieses Termins |
| ---: | ---: |
| 1. | 0 WP |
| 2. | -1 WP |
| 3. | -5 WP |
| ab der 4. | -10 WP |

### Unentschuldigte Fehlserie

Keine Stimme und keine Anwesenheit gilt als unentschuldigt. **Die Staffel zählt ausschließlich unentschuldigte Fehltermine** (bestätigt von Julius, 17.07.2026) — entschuldigte Absagen dazwischen zählen in ihrer eigenen Staffel weiter und erhöhen diese Zählung nicht, setzen sie aber auch nicht zurück:

| Unentschuldigtes Fehlen (seit letzter Anwesenheit) | Punkte dieses Termins | Folge |
| ---: | ---: | --- |
| 1. | -5 WP | keine Strafrunde |
| 2. | -10 WP | keine Strafrunde |
| ab dem 3. | -15 WP | eine Strafrunde und Status „wackelt“ |

- Beispiel: Absage · Absage · keine Stimme → das ist das **1.** unentschuldigte Fehlen (−5 WP), zusätzlich zählt die entschuldigte Staffel ihre eigenen Abzüge weiter.
- Der Abzug ist ab dem dritten unentschuldigten Fehlen bei -15 WP pro Termin gedeckelt.
- Die Strafrunde entsteht beim dritten unentschuldigten Fehlen einmalig. Weitere Fehltermine derselben ununterbrochenen Abwesenheit erzeugen keine weitere automatische Runde.
- Jede erneute Anwesenheit setzt beide Staffeln zurück und entfernt den Status „wackelt“.

### Organisation

- Die Organisations-WP werden erst nach Ende der siebentägigen Nachtragsfrist endgültig vergeben.
- Grundlage ist der Durchschnitt aller gültigen Wirtshaus-Sternebewertungen für den Termin.
- Der Durchschnitt wird kaufmännisch auf eine ganze Zahl zwischen 0 und 5 gerundet.
- Ohne gültige Bewertung gibt es 0 WP.
- Spätere administrative Datenkorrekturen erzeugen eine nachvollziehbare Differenzbuchung.

### Punktefeedback

- Jede Aktion, die sofort WP erzeugt, zeigt dem handelnden Mitglied eine kurze `+n WP`-Animation.
- Das betrifft insbesondere rechtzeitiges Abstimmen und Wirtshaus-Vorschläge.
- Die Animation darf bei wiederholtem Speichern oder Aktualisieren nicht erneut erscheinen, wenn kein neues Punkteereignis entstanden ist.
- Punkte aus dem Stammtischabend selbst werden nicht einzeln animiert. Sie erscheinen gesammelt in der Zusammenfassung nach dem Abschluss.
- Negative Punkte müssen in der Abendzusammenfassung mit Grund sichtbar sein.

### Strafrunden und Bezahlung

- **Maßeinheit für alle automatischen Geldstrafen** ist die Hoibe: aktueller Preis für Augustiner Hell vom Fass (0,5 l, Position „C3") im Augustiner Bräustüberl — derzeit **3,70 €** (Konstante `HOIBE_KELLERPREIS_CENTS` in `app/src/lib/preise.ts`; Quelle: https://braeustuben.de/speisekarten-getraenke/#getraenkekarte; bei Preiserhöhung anpassen).
- **Eine Strafrunde = Teilnehmer des Abends × Hoibn-Preis**, als offene Forderung in der Kasse.
- **Zugesagt & nicht erschienen** bleibt wie gehabt: Beim Besuch-Abschluss wird der Zugesagte als „nachträglich abgesagt" markiert und zahlt eine Strafrunde.
- **Der Präsident richtet:** Er sieht die offenen Strafen auf seiner Startseite und darf sie erlassen oder bestehen lassen. Beglichen markiert weiterhin der Kassenwart.
- Normale und verspätete Absagen erzeugen keine Geldforderung und keine Strafrunde.
- Die automatische Strafrunde wegen Fehlens entsteht nur beim dritten unentschuldigten Fehlen in Folge.
- Ranglisten-WP sind keine Währung und können nicht zum Bezahlen von Strafen oder Runden verwendet werden.
- Zahlungsstatus und WP-Stand bleiben fachlich getrennt.

## Code Style

Punkteregeln werden als reine, sprechend benannte Funktionen modelliert; Geld bleibt Integer-Cent und Zeitvergleiche verwenden explizit `Europe/Berlin`.

```ts
export function anwesenheitsBonus(besucheInFolge: number): number {
  return Math.max(0, besucheInFolge - 1);
}
```

## Testing Strategy

- Reine Berechnungstests für jede Grenze der positiven, entschuldigten und unentschuldigten Serie.
- Integrationstests gegen eine temporäre SQLite-Datenbank für idempotente Gutschriften, Nachträge und Saisonfilter.
- Tests für die Drei-Tage-Frist rund um Monats-/Jahreswechsel und Sommer-/Winterzeit.
- Regressionstest: Ein Serienriss entfernt keine früher verdienten WP.
- Regressionstest: Eine wiederholte Server Action vergibt keine Punkte doppelt.
- Typprüfung und Produktions-Build vor Abschluss.

## Boundaries

- Immer: Jede Punktebewegung dauerhaft mit Mitglied, Termin/Aktion, Grund, Betrag und Zeitpunkt nachvollziehbar speichern.
- Immer: Bestehende Benutzer- und Besuchsdaten durch eine Migration erhalten.
- Erst nach gesonderter Entscheidung: manuelle Bonus-/Strafbuchungen, Einlösen einer separaten Spielwährung oder weitere automatische Strafrunden.
- Niemals: Ranglisten-WP als Geldersatz verwenden, bestehende WP still überschreiben oder Punkte allein durch eine UI-Animation simulieren.

## Success Criteria

- Alle Tabellenwerte dieser Spezifikation werden korrekt und genau einmal verbucht.
- Bereits verdiente Serien-WP bleiben nach Abwesenheit erhalten.
- Saison- und Allzeitstand ergeben sich aus denselben nachvollziehbaren Punkteereignissen.
- Rechtzeitige Abstimmung zeigt einmalig +1 WP; späte Abstimmung zeigt keine Punkteanimation.
- Der Abend zeigt eine vollständige Aufschlüsselung inklusive Serienbonus und Fehlstrafe.
- Organisations-WP stehen erst nach Ablauf der Nachtragsfrist endgültig fest.
- Beim dritten unentschuldigten Fehlen entstehen -15 WP, eine Strafrunde und der Status „wackelt“.

## Migration der Historie

Beim Umstieg auf das Ereignis-Journal wird die bestehende Chronik einmalig **nach V2-Regeln neu bewertet** (kleine Historie, konsistente Stände; Rangliste kann sich dadurch rückwirkend verschieben — den Spezln einmal ansagen). Historische „vielleicht"-Stimmen gelten dabei als keine Stimme; Fehltermine vor V2-Einführung erzeugen jedoch **keine rückwirkenden Fehl-Abzüge oder Strafrunden** (die Staffeln starten mit der Einführung).

## Open Questions

Am 17.07.2026 von Julius bestätigt: Frist bis Ende des 3. Tages vorher; „vielleicht" abgeschafft; unentschuldigt-Staffel zählt eigenständig; „Zugesagt & nicht erschienen" behält die Strafrunde, Präsident darf erlassen; Maßeinheit Bräustüberl-Hoibe 3,70 €.

Am 27.08.2026 von Julius festgelegt: individuelle Bewertungen statt Abschluss-Bewertung (Tagesbewertung = Schnitt der Einzelbewertungen, Speisen-Schnitt nur aus tatsächlichen Essern, alle Freitexte sichtbar, Extrapunkte für die Bewertung) und Check-in mit +1 WP für den Ersten samt Platz-Freitext und Info an alle. Die konkreten Werte (+1 WP Bewertung, +1 WP erster Check-in, Check-in-Vorlauf 2 Std.) sind Claudes Umsetzungsvorschlag; die Abschluss-Sperre hat Julius auf **2 Stunden nach Beginn** festgelegt (27.08.2026, „geschlossen werden kann ab 21 Uhr").

Noch offen: die **Neubewertung der Historie nach V2** (Abschnitt „Migration der Historie") ist Claudes Empfehlung und von Julius noch nicht bestätigt.
