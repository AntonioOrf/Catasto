# Stage 1: Build della React App
FROM node:20-alpine AS build

WORKDIR /app

# Copiamo i file di configurazione del monorepo per sfruttare la cache di Docker
COPY package*.json ./
COPY frontend-catasto/package.json ./frontend-catasto/
COPY backend-catasto/package.json ./backend-catasto/
COPY packages/shared/package.json ./packages/shared/

# Installazione pulita delle dipendenze (molto più veloce con il lockfile)
# --ignore-scripts: il sorgente di @catasto/shared non e' ancora presente in
# questo layer, quindi il suo script "prepare" (tsc) non troverebbe nulla da compilare
RUN npm ci --ignore-scripts

# Copiamo il codice sorgente
COPY . .

# Build di @catasto/shared prima del frontend, che lo importa a runtime
RUN npm run build -w @catasto/shared

# Build del frontend tramite il workspace
RUN npm run build -w frontend-catasto

# Stage 2: Serve con Nginx
FROM nginx:alpine

# Copiamo i file compilati dallo stage precedente
COPY --from=build /app/frontend-catasto/dist /usr/share/nginx/html

# Copiamo la configurazione di Nginx specifica del frontend
COPY frontend-catasto/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
