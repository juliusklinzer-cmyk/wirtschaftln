# Wirtschaftln 🍺

> **„Oiwei anders. Oiwei dahoam.“** — München · seit 2019

Die private Stammtisch-App vom Wirtschaftln-Club: alle zwei Wochen a anderes Münchner Wirtshaus — nie zweimal das gleiche. Termine ausmachen, abstimmen, Hoibe zählen, Wirtshäuser sammeln und bewerten, Vereinskasse führen, Rangliste schauen.

**Live:** [wirtschaftln.de](https://wirtschaftln.de) · **Stack:** Next.js (App Router) + SQLite/Drizzle + Docker/Caddy · **PWA** (am Handy „Zum Home-Bildschirm hinzufügen“)

## Projekt-Struktur

```
app/               Next.js-App (Frontend + Backend in einem)
  src/app/         Routen: / (Hoam), /termin, /karte, /spezln, /kasse, /login
  src/components/  ds/ = portiertes Design-System · shell/ = AppBar/TabBar · domain/
  src/lib/         DB (Drizzle + SQLite), Auth (Sessions), Queries, Format-Helfer
  drizzle/         SQL-Migrationen (laufen beim App-Start automatisch)
  scripts/         seed.ts (Admin anlegen), demo.ts (lokale Demo-Daten)
design-system/     Design-Handoff aus Claude Design (Quelle der Wahrheit fürs Branding)
deploy/Caddyfile   Reverse Proxy + automatisches TLS
docker-compose.yml App + Caddy für den Hetzner-VPS
```

## Lokal entwickeln

```bash
cd app
npm install
WN_ADMIN_PASSWORD=geheim npm run db:seed   # legt den Admin an (julius.klinzer@gmail.com)
npm run db:demo                             # optional: Demo-Spezln & -Termine
npm run dev                                 # http://localhost:3000
```

Demo-Logins nach `db:demo`: `sepp@demo.wirtschaftln.de` … (Passwort `servus123`).

## Deployment auf dem Hetzner-VPS

Einmalig auf dem Server (Ubuntu/Debian, Docker installiert):

```bash
git clone <repo> wirtschaftln && cd wirtschaftln
docker compose up -d --build

# Admin anlegen (einmalig):
docker compose exec app node scripts/seed.ts
```

DNS bei Hetzner: `A`-Record für `wirtschaftln.de` und `www` auf die Server-IP zeigen lassen — Caddy holt sich das TLS-Zertifikat automatisch.

Updates: `git pull && docker compose up -d --build`.
Backup: das Docker-Volume `app-data` enthält die SQLite-Datenbank (`wirtschaftln.db`) — regelmäßig sichern.

## Wie der Club-Alltag in der App läuft

1. **Neuer Termin** (Tab *Termin*): Datum + Organisator festlegen → Phase **Planung**.
2. Der Organisator trägt das Wirtshaus ein (Adresse wird automatisch geocodiert) → **Reserviert**. Alle stimmen ab (Zusagen / Vielleicht / Absagen), Kalender-Export als `.ics`.
3. Am Stammtisch-Tag: „Anmeldung schließen“ → **Heute**.
4. Danach schließt der Organisator den Besuch ab: pro Spezl Anwesenheit, Hoibe 🍺 und Kaiserschmarrn 🥞, dazu Sterne fürs Wirtshaus → **Abgeschlossen**. Das Wirtshaus landet in der Sammlung auf der Karte, die Rangliste zählt hoch.
5. **Kasse**: Wirtschaftler melden (z. B. „Zugesagt & nicht erschienen → 10 €“), Forderungen verwalten, Einzahlungen und Ausgaben buchen.
6. Neue Mitglieder nimmt der Admin im Tab *Spezln* auf (geschlossener Kreis, keine Selbstregistrierung).

## Noch offen / Ideen

- Push-Benachrichtigungen (Web Push: „Stammtisch is’ morgen!“, neue Forderung)
- Passwort ändern / Profilfoto hochladen
- Ämter-Verwaltung in der UI (aktuell nur per DB)
- Fotos der Wirtshäuser (aktuell nur Karten-Pins)
- Saison-Archiv & Jahresfeier-Auswertung
