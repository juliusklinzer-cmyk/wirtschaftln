# Wirtschaftln — Next.js Standalone-Build
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* wird bei `next build` ins Client-Bundle eingebrannt — muss
# deshalb als Build-Arg reinkommen (.env* ist per .dockerignore ausgeschlossen).
ARG NEXT_PUBLIC_GMAPS_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_PAYPAL_POOL_URL
ENV NEXT_PUBLIC_GMAPS_KEY=$NEXT_PUBLIC_GMAPS_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_PAYPAL_POOL_URL=$NEXT_PUBLIC_PAYPAL_POOL_URL
# Fail-fast: ohne Build-Args (--env-file deploy/.env vergessen) wären Karte
# und Push still kaputt — lieber gleich beim Bauen krachen.
RUN test -n "$NEXT_PUBLIC_GMAPS_KEY" || (echo "NEXT_PUBLIC_GMAPS_KEY fehlt — mit: docker compose --env-file deploy/.env up -d --build" && exit 1)
RUN test -n "$NEXT_PUBLIC_VAPID_PUBLIC_KEY" || (echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY fehlt — mit: docker compose --env-file deploy/.env up -d --build" && exit 1)
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# DATA_DIR: Verzeichnis-DB + tenants/<slug>.db; DATABASE_PATH bleibt als Pfad
# der alten Einzel-DB (wird beim ersten Start nach tenants/ kopiert)
ENV DATA_DIR=/data
ENV DATABASE_PATH=/data/wirtschaftln.db

RUN groupadd -r app && useradd -r -g app app && mkdir -p /data && chown app:app /data

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Migrationen + Seed-Skript für den Erststart
COPY --from=builder --chown=app:app /app/drizzle ./drizzle
COPY --from=builder --chown=app:app /app/drizzle-directory ./drizzle-directory
COPY --from=builder --chown=app:app /app/scripts ./scripts
# Die Skripte importieren den Mandanten-Kern direkt aus src (Node strip-types)
COPY --from=builder --chown=app:app /app/src/lib/db/core.ts ./src/lib/db/core.ts
# sharp braucht seine nativen libvips-Libs (@img/*) — der Standalone-Tracer
# nimmt die .so-Dateien nicht mit (Profilbild-Upload crasht sonst mit ERR_DLOPEN_FAILED)
COPY --from=builder --chown=app:app /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=app:app /app/node_modules/@img ./node_modules/@img

USER app
EXPOSE 3000
VOLUME /data

# node:24-slim hat kein curl — Health-Check über Node-fetch auf die Login-Seite
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

CMD ["node", "server.js"]
