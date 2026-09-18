# Stage 1: Build del Backend
FROM node:20-alpine AS build

WORKDIR /app

# Copiamo i file di configurazione del monorepo
COPY package*.json ./
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Installazione pulita delle dipendenze (--ignore-scripts: il sorgente di
# @catasto/shared non e' ancora presente in questo layer, quindi il suo
# script "prepare" (tsc) non troverebbe nulla da compilare)
RUN npm ci --ignore-scripts

# Copiamo il codice sorgente
COPY . .

# Build di @catasto/shared prima del backend, che lo importa a runtime
RUN npm run build -w @catasto/shared

# Build del backend tramite il workspace
RUN npm run build -w backend-catasto

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copiamo solo i file necessari per l'esecuzione
COPY package*.json ./
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Installiamo solo le dipendenze di produzione (--ignore-scripts: qui non
# serve compilare nulla, arriva già pronto dallo stage di build)
RUN npm ci --omit=dev --ignore-scripts

# Copiamo i file compilati dallo stage precedente
COPY --from=build /app/backend-catasto/dist ./backend-catasto/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Gli .sql sono letti a runtime dal runner di migrazioni, non bundlati da tsup
COPY --from=build /app/backend-catasto/migrations ./backend-catasto/migrations

EXPOSE 3005

# Avviamo il server puntando al file compilato nel workspace del backend
CMD ["node", "backend-catasto/dist/server.js"]
