# Stage 1: Build della React App
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

# Rimuoviamo il lockfile windows per evitare conflitti di piattaforma con dipendenze native (es. lightningcss)
# e installiamo le dipendenze da zero per Linux Alpine
RUN npm install

COPY . .

ENV VITE_API_URL=/api

RUN npm run build

# Stage 2: Serve con Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
