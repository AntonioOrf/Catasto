# Stage 1: Build del Backend
FROM node:18-alpine AS build

WORKDIR /app

# Copiamo i file di configurazione del monorepo
COPY package*.json ./
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Installazione pulita delle dipendenze
RUN npm ci

# Copiamo il codice sorgente
COPY . .

# Build del backend tramite il workspace
RUN npm run build -w backend-catasto

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

# Copiamo solo i file necessari per l'esecuzione
COPY package*.json ./
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Installiamo solo le dipendenze di produzione
RUN npm ci --omit=dev

# Copiamo i file compilati dallo stage precedente
COPY --from=build /app/backend-catasto/dist ./backend-catasto/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

EXPOSE 3005

# Avviamo il server puntando al file compilato nel workspace del backend
CMD ["node", "backend-catasto/dist/server.js"]
