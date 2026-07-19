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
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/wirtschaftln.db

RUN groupadd -r app && useradd -r -g app app && mkdir -p /data && chown app:app /data

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Migrationen + Seed-Skript für den Erststart
COPY --from=builder --chown=app:app /app/drizzle ./drizzle
COPY --from=builder --chown=app:app /app/scripts ./scripts

USER app
EXPOSE 3000
VOLUME /data

# node:24-slim hat kein curl — Health-Check über Node-fetch auf die Login-Seite
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

CMD ["node", "server.js"]
