# Immagine unica: lo stesso processo Node serve l'API (/api, /health) e la
# build del frontend (vedi backend-catasto/src/static.ts). Contesto di build:
# la radice del monorepo.

# Stage 1: build di shared, frontend e backend
FROM node:20-alpine AS build

WORKDIR /app

# Prima solo i package.json, per sfruttare la cache di Docker
COPY package*.json ./
COPY frontend-catasto/package.json ./frontend-catasto/
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# --ignore-scripts: il sorgente di @catasto/shared non e' ancora presente in
# questo layer, quindi il suo script "prepare" (tsc) non troverebbe nulla
RUN npm ci --ignore-scripts

COPY . .

# @catasto/shared prima di frontend e backend, che lo importano. Il frontend
# e' compilato senza VITE_API_URL: in produzione chiama la stessa origine.
RUN npm run build -w @catasto/shared \
 && npm run build -w frontend-catasto \
 && npm run build -w backend-catasto

# Stage 2: runtime
FROM node:20-alpine

# Senza, l'error handler restituisce gli stack trace e SEGNALAZIONI_SALT non
# viene reso obbligatorio (entrambi i controlli leggono NODE_ENV).
ENV NODE_ENV=production
ENV PORT=3005
# Cartella da cui il backend serve il frontend
ENV STATIC_DIR=/app/frontend-catasto/dist

WORKDIR /app

COPY package*.json ./
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Solo le dipendenze di produzione del backend (--ignore-scripts: qui non
# serve compilare nulla, arriva gia' pronto dallo stage di build)
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/backend-catasto/dist ./backend-catasto/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/frontend-catasto/dist ./frontend-catasto/dist

# Gli .sql sono letti a runtime dal runner di migrazioni, non bundlati da tsup
COPY --from=build /app/backend-catasto/migrations ./backend-catasto/migrations

EXPOSE 3005

# Utente non privilegiato gia' presente nell'immagine node (node = 1000).
# Numerico e non per nome: Kubernetes con runAsNonRoot verifica solo UID
# numerici. OpenShift lo sostituisce con un UID casuale, e funziona lo
# stesso: il processo legge soltanto, non scrive su disco.
USER 1000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3005/health >/dev/null || exit 1

# Applichiamo le migrazioni mancanti e avviamo il server: senza le tabelle
# applicative la ricerca fallisce. Se una migrazione fallisce il container si
# ferma (e il compose lo riavvia) invece di servire un'API rotta.
CMD ["sh", "-c", "node backend-catasto/dist/scripts/migrate.js && exec node backend-catasto/dist/server.js"]
