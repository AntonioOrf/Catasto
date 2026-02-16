# Guida all'Installazione e Deploy

Questa guida copre come configurare il progetto Catasto localmente, eseguirlo usando Docker e distribuirlo in produzione.

## 1. Configurazione Sviluppo Locale

Prerequisiti:

- **Node.js** (v18+ raccomandato)
- **MySQL** Server (v8.0+)
- **Git**

### Configurazione Database

1.  Crea un database MySQL chiamato `catasto` (o aggiorna `.env` successivamente).
2.  Importa il dump SQL fornito (se disponibile) per popolare il database.

### Configurazione Backend

1.  Naviga in `backend-catasto`:
    ```bash
    cd backend-catasto
    ```
2.  Installa le dipendenze:
    ```bash
    npm install
    ```
3.  Crea un file `.env` basato su `.env.example`:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tua_password
    DB_NAME=catasto
    DB_PORT=3306
    PORT=3001
    ```
4.  Avvia il server:
    ```bash
    node server.js
    ```
    (O `npm run dev` se nodemon è configurato)

### Configurazione Frontend

1.  Naviga in `frontend-catasto`:
    ```bash
    cd frontend-catasto
    ```
2.  Installa le dipendenze:
    ```bash
    npm install
    ```
3.  Crea un file `.env`:
    ```env
    VITE_API_URL=http://localhost:3001
    ```
4.  Avvia il server di sviluppo:
    ```bash
    npm run dev
    ```

---

## 2. Deploy con Docker

Se preferisci usare Docker per eseguire l'intero stack (Database + Backend + Frontend) senza installazione locale.

1.  **Crea un file `.env` nella directory principale** o usa le variabili d'ambiente direttamente in `docker-compose.yml`.

    ```env
    MYSQL_ROOT_PASSWORD=password_root_sicura
    MYSQL_DATABASE=catasto
    MYSQL_USER=catasto_user
    MYSQL_PASSWORD=password_utente_sicura
    ```

2.  **Crea un file `docker-compose.yml`**:

    ```yaml
    services:
      db:
        image: mysql:8.0
        container_name: catasto-db
        restart: always
        environment:
          MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
          MYSQL_DATABASE: ${MYSQL_DATABASE}
          MYSQL_USER: ${MYSQL_USER}
          MYSQL_PASSWORD: ${MYSQL_PASSWORD}
        volumes:
          # I dati persistenti verranno salvati nella cartella ./db
          - ./db:/var/lib/mysql
          # Metti il tuo file .sql nella cartella ./init per importarlo automaticamente!
          - ./init:/docker-entrypoint-initdb.d
        networks:
          - catasto-net
        healthcheck:
          test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
          timeout: 20s
          retries: 10

      backend:
        image: ipavon/catasto1427-backend:latest
        container_name: catasto-backend
        restart: always
        environment:
          DB_HOST: db
          DB_USER: ${MYSQL_USER}
          DB_PASSWORD: ${MYSQL_PASSWORD}
          DB_NAME: ${MYSQL_DATABASE}
          PORT: 5000
          DB_SSL: "false"
        depends_on:
          db:
            condition: service_healthy
        networks:
          - catasto-net

      frontend:
        image: ipavon/catasto1427-frontend:latest
        container_name: catasto-frontend
        restart: always
        ports:
          - "1427:80"
        depends_on:
          - backend
        networks:
          - catasto-net

    networks:
      catasto-net:
        driver: bridge
    ```

3.  **Esegui con Docker Compose**:

    ```bash
    docker-compose up -d
    ```

    Questo comando:
    - Avvierà un container MySQL.
    - Avvierà il container Backend (connesso al DB).
    - Avvierà il container Frontend (che serve l'app).

4.  **Accedi all'App**:
    - Frontend: `http://localhost:1427` (o porta configurata)
    - Backend API: `http://localhost:5000`

### Risoluzione Problemi Docker

- Controlla i log: `docker-compose logs -f`
- Ferma i container: `docker-compose down`
- Ricostruisci le immagini: `docker-compose up -d --build`

---

## 3. Deploy in Produzione

Il progetto è progettato per essere agnostico rispetto al deploy. Le strategie comuni includono:

- **Database**: Servizio SQL gestito (es. AWS RDS, DigitalOcean Managed Database, TiDB Cloud, Aiven).
- **Backend**: Piattaforma di hosting Node.js (es. Render, Railway, Heroku, AWS Elastic Beanstalk).
- **Frontend**: Hosting siti statici (es. Vercel, Netlify, Cloudflare Pages).

**Importante:** Assicurati che le variabili d'ambiente (`DB_HOST`, `DB_USER`, `DB_PASSWORD` per il backend; `VITE_API_URL` per la build frontend) siano impostate correttamente nel tuo ambiente di produzione.
