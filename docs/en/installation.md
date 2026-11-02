# Installation and deployment

🇮🇹 [Italiano](../guides.md) · 🇬🇧 **English**

| Field | Value |
|---|---|
| Identifier | `CAT-DOC-01` |
| Title | Installation and deployment of the Florentine Catasto of 1427/30 portal |
| Version | 2.5 |
| Date | 2026-11-02 |
| Status | Approved |
| Classification | Public |
| Owners | Antonio Orfitelli, Pasquale Ruotolo |
| Language | English (translation; the Italian text prevails) |
| Original | [Italiano](../guides.md) |
| Related documents | [Documentation standard](../standard-documentale.md) (`CAT-DOC-00`) · [Architecture and data model](architecture.md) (`CAT-DOC-02`) · [Backend and API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Use cases](use-cases.md) (`CAT-DOC-05`) · [Code review](code-review.md) (`CAT-DOC-06`) · [Portability](portability.md) (`CAT-DOC-07`) · [Repository readme](../../README.en.md) |

---

## 1. Purpose and audience

This document is for developers and system administrators. It describes how to set up the portal of the **Florentine Catasto of 1427/30** (*catasto*: the Florentine tax survey) for local development (§2) and for production with Docker (§3) and on Vercel (§4), how the Docker image is published automatically (§5) and how to solve the most frequent problems (§6). Other platforms (Kubernetes, OpenShift, Podman, machines without containers) and the transfer to a university's servers are covered in [Portability and transfer to a university](portability.md). Environment variables are described in detail in [Backend and API](backend.md), section "Environment variables"; the procedure corresponds to use case UC-8 "Install and update the portal" in [Use cases](use-cases.md). For the overall structure see [Architecture and data model](architecture.md).

The portal database holds data at three levels of provenance (standard `CAT-DOC-00`, §5.6):

- **source data**: the `Catasto.sql` dump, with the data transcribed by the Herlihy–Klapisch-Zuber research and digitised by ACRH;
- **contributed data**: the application tables `segnalazioni` (user reports) and `fuoco_segnature` (shelfmarks of the *portata* (declaration) proposed by users and published after editorial verification), created by the migrations;
- **derived data**: computed by the portal (for example the filter options cached by the backend).

---

## 2. Local development

Recommended setup for changing the code with immediate reload.

### 2.1 Prerequisites

- **Node.js 20** or later (React Router 7 and Vite require Node ≥ 20; the CI uses Node 20)
- **MySQL 8** running
- **Git**
- The **`Catasto.sql`** dump (source data): it is deliberately not in the repository (the data are not public); request it from the project maintainers

### 2.2 Installation

```bash
git clone https://github.com/AntonioOrf/Catasto.git
cd Catasto
npm install        # installs all workspaces and builds @catasto/shared
```

### 2.3 Database

```bash
mkdir -p init && cp /path/to/Catasto.sql init/Catasto.sql
mysql -u root -p -e "CREATE DATABASE catasto CHARACTER SET utf8mb4"
mysql -u root -p catasto < init/Catasto.sql
```

### 2.4 Configuration

**`backend-catasto/.env`** (read by `npm run dev` and by the migrations in development). The values below are fictitious:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=catasto
PORT=3005

# Optional in development: see docs/backend.md
# ADMIN_TOKEN=test_token
# MODERAZIONE_SECRET=test_secret
```

**`frontend-catasto/.env`** is optional: without it, in development the frontend already uses `http://localhost:3005`.

```env
VITE_API_URL=http://localhost:3005
```

### 2.5 Migrations

The migrations create the application tables (`segnalazioni`, `fuoco_segnature`, `traduzioni_lookup`, `luoghi_geo`). **They are mandatory**: without them the search responds with a 500 error and the map stays empty. Run them again after every `git pull` that adds a file to `backend-catasto/migrations/`.

```bash
npm run db:migrate -w catasto-backend
```

### 2.6 Start

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3005> · health: <http://localhost:3005/health>

### 2.7 Checks before a PR

These are the same steps as the CI:

```bash
npm run build
npm run lint -w catasto-frontend
(cd backend-catasto && npx tsc --noEmit)
(cd frontend-catasto && npx tsc --noEmit)
npm test
```

---

## 3. Production with Docker

### 3.1 Services

| Container | Image | Host port | Role |
|---|---|---|---|
| `catasto-db` | `mysql:8.0` | `127.0.0.1:3306` | database; data in `./mysql_data` |
| `catasto-app` | `ipavon/catasto1427:latest` | **`1427`** | static site and Node.js API in the same process |

The `docker-compose.yml` **pulls the images from Docker Hub**: it does not build the local code. The database is reachable only from the server itself (loopback); only port 1427 is exposed externally, and it must be placed behind a TLS terminator (reverse proxy or CDN).

### 3.2 First installation

```bash
# in the folder that contains docker-compose.yml
cp .env.prod.example .env      # then change all the secret values
mkdir -p init && cp /path/to/Catasto.sql init/Catasto.sql

docker compose up -d
```

On first start MySQL imports `init/Catasto.sql` (this may take several minutes); the `app` container starts once the database is healthy.

Variables to set in `.env` (the example file comments all of them):

| Variable | Required | Notes |
|---|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | yes | database credentials |
| `SEGNALAZIONI_SALT` | yes | long random string; without it, user reports fail |
| `ADMIN_TOKEN` | recommended | enables the moderation API |
| `MODERAZIONE_SECRET` | recommended | enables the Accept/Reject links in the emails |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN` | recommended | email forwarding of user reports |
| `TRUST_PROXY` | depends | empty if port 1427 is exposed directly; `1` if a reverse proxy sits in front and the port cannot be reached without going through it. Use a number (`true` would make the IP spoofable) |
| `CORS_ORIGIN`, `PUBLIC_API_URL` | no | only if frontend or API are on another domain |

### 3.3 Migrations

The `app` container applies the migrations **by itself at every start**, before launching the server: the runner executes only the files in `backend-catasto/migrations/` not yet recorded. The logs (`docker compose logs app`) show the lines `✅ …` or `↩️ … (già applicata)` ("already applied").

If a migration fails, the server does not start and compose restarts it. To run the migrations manually:

```bash
docker compose exec app node backend-catasto/dist/scripts/migrate.js
```

### 3.4 Verification

```bash
docker compose ps                        # catasto-db and catasto-app "healthy"
curl http://127.0.0.1:1427/health        # {"status":"ok","db":"up"}
curl -I http://127.0.0.1:1427/           # 200 text/html (the site)
```

Finally, send a test user report from the site and confirm the activation email that FormSubmit sends on the first submission.

### 3.5 Update

```bash
docker compose pull app
docker compose up -d app   # new migrations are applied at start
```

Moving from the old two-image setup (`catasto-backend` + `catasto-frontend` with nginx): update `docker-compose.yml` and `.env`, then run `docker compose pull app && docker compose up -d --remove-orphans`, which stops and removes the two old containers. If a reverse proxy sits in front of port 1427, review `TRUST_PROXY` (see `.env.prod.example`).

Alternatively the server can poll Docker Hub periodically (for example with Watchtower) and update the containers by itself; in this case too the migrations are applied when the backend starts.

To roll back to a previous version, replace `:latest` with the short-SHA tag (e.g. `ipavon/catasto1427:1a2b3c4`, illustrative) and run `docker compose up -d` again.

### 3.6 Building the image locally

Useful to try changes not yet published. The build context is the monorepo root:

```bash
docker build -t ipavon/catasto1427:latest .
docker compose up -d
```

### 3.7 Aligning the database from TiDB

If the Vercel production (§4) uses TiDB Cloud, the MySQL on the Docker server is a separate copy: writes on one site do not reach the other. To realign it with TiDB, which is the authoritative source:

1. Save the TiDB credentials (the same as on Vercel) in a `.tidb.env` file with permissions 600: `TIDB_HOST`, `TIDB_PORT` (4000), `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DB`.
2. Back up the local MySQL:
   ```bash
   docker compose exec -T db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' > backup-mysql-$(date +%F).sql
   ```
3. Compare the two databases (tables, row counts, `schema_migrations`, `segnalazioni`): rows present only in the local MySQL, for example user reports received by the Docker site, must be exported separately and inserted again after the import.
4. Dump TiDB with the `mysql:8.0` client, over TLS with certificate verification:
   ```bash
   docker run --rm --env-file .tidb.env mysql:8.0 sh -c 'mysqldump -h "$TIDB_HOST" -P "$TIDB_PORT" -u "$TIDB_USER" -p"$TIDB_PASSWORD" --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/pki/tls/certs/ca-bundle.crt --single-transaction --skip-lock-tables --skip-add-locks --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --skip-routines --skip-triggers --default-character-set=utf8mb4 "$TIDB_DB"' > dump-tidb-$(date +%F).sql
   ```
   The file must end with `-- Dump completed`. TiDB-specific comments (`/*T![...] */`) are ignored by MySQL.
5. Stop the application and import:
   ```bash
   docker compose stop app
   docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 "$MYSQL_DATABASE"' < dump-tidb-$(date +%F).sql
   docker compose start app
   ```
6. Repeat the row count and the check in §3.4, then delete `.tidb.env`.

Alternatively the container can use TiDB directly (in `.env`: TiDB `DB_HOST` and credentials, `DB_PORT=4000`, `DB_SSL=true` in the `app` service): one database for both sites, with no synchronisation.

---

## 4. Production on Vercel

On Vercel a single project serves site and API: the frontend as a static site, the backend as a Vercel Function (`frontend-catasto/api/index.js`, which exports the Express app). The database is external, for example TiDB Cloud.

The function does not import the backend sources: the frontend's `npm run build`, after `vite build`, compiles `backend-catasto/src/app.ts` into a single file, `frontend-catasto/server/app.mjs` (`scripts/build-api.mjs`, esbuild), with the shared package `@catasto/shared` and all the backend's npm dependencies (express, mysql2, exceljs...) inside: the file only uses Node's built-in modules. On Vercel the project root is `frontend-catasto`, and the function receives neither the workspace link to `@catasto/shared` nor the backend's dependencies: with external imports every route failed with `ERR_MODULE_NOT_FOUND`.

### 4.1 Project settings

| Setting | Value |
|---|---|
| Root Directory | `frontend-catasto` |
| Framework | Vite |
| Include files outside the Root Directory | enabled (default): the function imports `backend-catasto/` |

`vercel.json` routes `/api/*` and `/health` to the function and everything else to `index.html`.

### 4.2 Environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | **not set**: site and API share the same domain |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | database credentials |
| `DB_PORT` | `4000` for TiDB Cloud |
| `DB_SSL` | `true` |
| `TRUST_PROXY` | `1` |
| `SEGNALAZIONI_SALT`, `ADMIN_TOKEN` | as in Docker (same `SEGNALAZIONI_SALT` if the database is shared) |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN`, `MODERAZIONE_SECRET`, `PUBLIC_API_URL` | optional; `PUBLIC_API_URL` is the site URL |
| `DB_CONNECTION_LIMIT` | optional; default 5 connections per function instance |

Set the variables for the Production environment and, for working previews, for Preview as well.

### 4.3 Migrations

On Vercel **migrations do not run by themselves**: a Vercel Function has no start-up step in which to run the runner, unlike the Docker container (§3.3) and the systemd service. After every release that adds a file to `backend-catasto/migrations/`, apply them by hand from a machine with the repository, pointing at the production database (the same credentials as in §4.2):

```bash
DB_HOST=<host> DB_PORT=4000 DB_USER=<user> DB_PASSWORD=<password> DB_NAME=<database> DB_SSL=true npm run db:migrate -w catasto-backend
```

The runner applies only the files not yet recorded in `schema_migrations` and takes a MySQL lock, so running it again is harmless. Until they are applied, features that use the new tables stay empty: for example without `luoghi_geo` (migrations 006–007) the map shows "Le coordinate dei luoghi non sono ancora caricate nel database" ("The place coordinates are not loaded in the database yet").

### 4.4 Verification and limits

`https://<domain>/health` must answer `{"status":"ok","db":"up"}`. Each request lasts at most 60 seconds (very large exports included); rate limiting is in memory, so it applies per function instance.

Install and build are set in `vercel.json`: `"installCommand": "cd .. && npm ci"` installs the dependencies of every workspace from the monorepo root (with `frontend-catasto` alone as root the backend's would be missing and the bundle would not compile), `"buildCommand": "npm run build"` builds site and backend. A different value in the project settings does not replace them. If the backend fails to start (missing bundle, invalid environment variable such as `SHARED_STATE`, missing dependency), `api/index.js` does not let the function crash: every route answers `503` with `{"error": "Avvio del backend non riuscito", "dettaglio": "…"}` and the full error goes to the function logs.

---

## 5. Automatic Docker images

### 5.1 Publishing

`.github/workflows/docker.yml` builds and publishes `ipavon/catasto1427` (site and API in a single image) to Docker Hub on every push to `main`, **after** the CI (`ci.yml`) has passed. The image has two tags: `latest` and the short SHA of the commit.

### 5.2 Secrets configuration

One-off configuration, in GitHub → Settings → Secrets and variables → Actions:

- `DOCKERHUB_USERNAME`: Docker Hub user (`ipavon`)
- `DOCKERHUB_TOKEN`: access token created in Docker Hub → Account settings → Personal access tokens, with *Read & Write* permission

### 5.3 Manual run

The workflow can also be started manually from Actions → Docker images → Run workflow. Caution: when started manually it publishes `:latest` from the chosen branch without going through the CI, so it must be used only on `main`.

---

## 6. Troubleshooting

### 6.1 Symptoms, causes and solutions

| Symptom | Probable cause | Solution |
|---|---|---|
| The search responds "Internal Server Error" (development) | migrations not run (`fuoco_segnature` missing) | `npm run db:migrate -w catasto-backend` |
| The map says "Le coordinate dei luoghi non sono ancora caricate nel database (migrazioni 006 e 007)" | the `luoghi_geo` table does not exist in the database the backend connects to: migrations not applied (development, Vercel) or table lost in a database transfer | development: `npm run db:migrate -w catasto-backend`; Docker: `docker compose exec app node backend-catasto/dist/scripts/migrate.js`; Vercel: §4.3. If the runner answers `↩️ 006_luoghi_geo.sql (già applicata)` ("already applied") but the table is missing, see below |
| The runner says "already applied" but the migration's table does not exist | `schema_migrations` was copied without the table (partial dump) | delete the rows of the affected migrations, e.g. `DELETE FROM schema_migrations WHERE name IN ('006_luoghi_geo.sql','007_luoghi_geo_automatici.sql');`, and run the migrations again |
| The backend container keeps restarting | a migration fails at start | `docker compose logs app`, line `❌ … fallita` ("failed") |
| `/health` responds `503` | the backend cannot reach MySQL | check the `DB_*` / `MYSQL_*` variables and `docker compose logs db` |
| Port already in use | another service uses 1427, 3005 or 3306 | free the port or change it in `docker-compose.yml` |
| User reports respond 500 | `SEGNALAZIONI_SALT` is missing | set it in `.env` and restart the backend |
| Emails do not arrive | see the backend logs | FormSubmit diagnosis in [Backend and API](backend.md), section "Email flow (FormSubmit)" |
| Filters show old values after a reimport | options cached in the backend (derived data, up to `FILTERS_CACHE_TTL`, one hour by default) | `POST /api/filters/cache/invalidate` with `ADMIN_TOKEN` (see `docs/backend.md`), or `docker compose restart app` |
| The folio viewer does not load the folios (error) | the ICAR service does not respond (502 in the backend logs) | try again later; the link to the original site remains available |
| Too many requests (`429`) | per-IP rate limit | with a proxy in front, check `TRUST_PROXY` |
| Type errors during build | `@catasto/shared` not rebuilt | `npm run build -w @catasto/shared` |

### 6.2 Starting again from a clean database

The MySQL data are in `./mysql_data` (bind mount): `docker compose down -v` does **not** delete them.

> **Caution** — Deleting `./mysql_data` also removes the contributed data (user reports and verified *portata* shelfmarks), which are not contained in the `Catasto.sql` dump and cannot be reimported.

```bash
docker compose down
rm -rf ./mysql_data          # CAUTION: also deletes the user reports
docker compose up -d         # reimports init/Catasto.sql, then the backend reapplies the migrations
```

---

## 7. References and sources

- Herlihy, David, and Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Digitised data (origin of the `Catasto.sql` dump): ACRH, <https://journals.openedition.org/acrh/7458>.
- Images of the folios shown by the viewer: Archivio di Stato di Firenze, ICAR digital archive, IIIF service.

---

## 8. Change log

| Version | Date | Author | Description |
|---|---|---|---|
| 1.x | — | — | Previous versions, no change log |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Rewritten according to CAT-DOC-00 and English translation |
| 2.1 | 2026-11-01 | Pasquale Ruotolo | Single Docker image (`app`), production on Vercel (§4), database alignment from TiDB (§3.7), `TRUST_PROXY` depending on the setup |
| 2.2 | 2026-11-01 | Pasquale Ruotolo | Reference to CAT-DOC-07 for other platforms |
| 2.3 | 2026-11-01 | Pasquale Ruotolo | Vercel: the function's backend is compiled into a single file with `@catasto/shared` (§4) |
| 2.4 | 2026-11-01 | Pasquale Ruotolo | Vercel: build command in `vercel.json`, backend startup error in the response (503) and in the logs (§4.3) |
| 2.5 | 2026-11-02 | Pasquale Ruotolo | Vercel: the backend's npm dependencies in the function bundle, install from the monorepo root (§4) |
| 2.6 | 2026-11-02 | Pasquale Ruotolo | Vercel: migrations applied by hand (§4.3, verification moves to §4.4); map without coordinates and `schema_migrations` without tables in §6.1 |
