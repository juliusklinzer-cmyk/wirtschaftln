# Wirtschaftln — Deployment (Hetzner-VPS, Docker)

## Voraussetzungen
- VPS mit Docker + Docker-Compose-Plugin
- DNS: `wirtschaftln.de` **und** `www.wirtschaftln.de` als A/AAAA auf die VPS-IP (Caddy holt sich dann selbst die TLS-Zertifikate)
- Google-Maps-Key in der Cloud Console für `https://wirtschaftln.de/*` und `https://www.wirtschaftln.de/*` freigeschaltet (Maps JavaScript API + Places)

## Erstinstallation

Live seit 19.07.2026 auf Hetzner Cloud CPX12 (`178.105.234.52`, Nürnberg), Code unter `/opt/wirtschaftln`.
Git-Remote (seit 29.08.2026): `git@github.com:juliusklinzer-cmyk/wirtschaftln.git` (privat).
Deployt wird weiterhin per rsync aus dem WSL-Checkout:

```bash
# Update deployen (WICHTIG: deploy/.env ausnehmen — sonst löscht --delete die Server-Secrets!)
rsync -az --delete --exclude node_modules --exclude .next --exclude 'app/data' \
  --exclude .git --exclude 'deploy/.env' ./ root@178.105.234.52:/opt/wirtschaftln/
ssh root@178.105.234.52 "cd /opt/wirtschaftln && docker compose --env-file deploy/.env up -d --build"
```

## Erstinstallation (bei Server-Neuaufbau)

```bash
git clone <repo> wirtschaftln && cd wirtschaftln   # oder rsync wie oben

# 1. Secrets anlegen (Werte aus app/.env.local übernehmen — v. a. dieselben VAPID-Keys!)
cp deploy/env.example deploy/.env
nano deploy/.env

# 2. Bauen & starten (--env-file füllt die NEXT_PUBLIC_-Build-Args UND die Container-Env)
docker compose --env-file deploy/.env up -d --build

# 3. Erst-Admin anlegen (einmalig; Zugangsdaten kommen aus deploy/.env → WN_ADMIN_*)
docker compose exec app node scripts/seed.ts

# 4. Die 49 „vor der App"-Wirtshäuser (Chronik seit 2019) anlegen (einmalig)
#    Koordinaten/Adressen/Fotos holt sich die Karte beim ersten Öffnen selbst über Google Places
docker compose exec app node scripts/altbestand.ts
```

**Wichtig:** Die Produktions-DB startet leer — niemals die lokale `app/data/wirtschaftln.db`
(Testdaten!) auf den Server kopieren. Es laufen nur `seed.ts` + `altbestand.ts`.

## Update einspielen

```bash
git pull
docker compose --env-file deploy/.env up -d --build
```

Migrationen laufen beim App-Start automatisch (einmal pro `.sql`-Datei, Bookkeeping in `wn_migrations`).
Die Datenbank liegt im benannten Volume `app-data` und übersteht Redeploys.

**Wirtshaus-Fotos** werden seit 27.08.2026 beim Speichern als Data-URL in die DB geholt (Google-Places-URLs
laufen ab). Falls doch mal wieder `http`-Foto-URLs in der DB stehen (Altbestand, Importe):

```bash
docker compose exec -T app node scripts/fotos-cachen.ts
```

Das cacht, was noch lädt, und löscht tote URLs — die Karte holt sich beim nächsten Öffnen frische Fotos.

## Backup (einrichten!)

Die SQLite-DB läuft im WAL-Modus — **nie** die Datei roh kopieren. `scripts/backup.ts` nutzt die
Online-Backup-API und behält die letzten 14 Stände unter `/data/backups/`. Profilbilder liegen als
Data-URLs mit in der DB, sind also automatisch mitgesichert.

Host-Crontab (`crontab -e`), täglich 04:30 + Kopie raus aus dem Container:

```cron
30 4 * * * cd /pfad/zu/wirtschaftln && docker compose exec -T app node scripts/backup.ts && docker cp $(docker compose ps -q app):/data/backups ./backups-offsite >> backup.log 2>&1
```

Idealerweise `./backups-offsite` zusätzlich per rsync/rclone auf einen anderen Rechner spiegeln.

## Staging (Design-Spielwiese, seit 29.08.2026)

`https://staging.wirtschaftln.de` — eigener Checkout unter `/opt/wirtschaftln-staging` mit eigener
DB (Volume `staging-data`, Demodaten: Login `sepp@demo.wirtschaftln.de` / `servus123`).
Läuft mit `docker-compose.staging.yml`; der Prod-Caddy routet die Subdomain übers edge-Netz.
Die Staging-`deploy/.env` ist eine Kopie der Prod-Env **ohne SMTP_PASSWORD** (Mails werden
übersprungen und nur geloggt) — Push geht, aber nur an Geräte, die sich auf Staging abonniert haben.

```bash
# Lokalen Stand (Design-Experimente) auf Staging schieben:
./deploy/staging-deploy.sh
```

Voraussetzungen (einmalig): DNS `staging.wirtschaftln.de` → A 178.105.234.52; Google-Maps-Key in
der Cloud Console zusätzlich für `https://staging.wirtschaftln.de/*` freischalten (sonst lädt die
Karte dort nicht).

## Nach jedem Deploy kurz prüfen (Smoke-Test)

1. `docker compose ps` → beide Container `Up`, app `healthy`
2. `docker compose logs app | tail -20` → keine Migrations-/Startfehler
3. https://wirtschaftln.de öffnen → Login-Seite lädt (TLS-Schloss ok)
4. Einloggen → Startseite rendert
5. **Karte** öffnen → Google-Maps lädt (sonst: Build-Args/Key-Freischaltung prüfen)
6. Auf der Startseite den 🔔-Hinweis antippen → Push-Abo klappt (sonst: VAPID-Env prüfen)
7. Als Planer testweise ein Wirtshaus „reservieren" → Mail kommt an (sonst: SMTP-Env/Logs prüfen)

## Wichtig zu wissen

- **`deploy/.env` niemals committen** (steht in `.gitignore`). Vorlage: `deploy/env.example`.
- Die `NEXT_PUBLIC_*`-Werte werden **beim Build** eingebrannt — nach einer Änderung reicht kein
  Neustart, es braucht `up -d --build`.
- VAPID-Keys nie neu generieren, sonst verlieren alle Geräte ihr Push-Abo.
- Caddy leitet HTTP→HTTPS um und setzt HSTS & Co. (siehe `deploy/Caddyfile`).
- App ist per `robots.txt` + `noindex` für Suchmaschinen gesperrt.
