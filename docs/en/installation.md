# Installation and deployment

🇮🇹 [Italiano](../guides.md) · 🇬🇧 **English**

| Field | Value |
|---|---|
| Identifier | `CAT-DOC-01` |
| Title | Installation and deployment of the Florentine Catasto of 1427/30 portal |
| Version | 2.0 |
| Date | 2026-10-29 |
| Status | Approved |
| Classification | Public |
| Owners | Antonio Orfitelli, Pasquale Ruotolo |
| Language | English (translation; the Italian text prevails) |
| Original | [Italiano](../guides.md) |
| Related documents | [Documentation standard](../standard-documentale.md) (`CAT-DOC-00`) · [Architecture and data model](architecture.md) (`CAT-DOC-02`) · [Backend and API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Use cases](use-cases.md) (`CAT-DOC-05`) · [Code review](code-review.md) (`CAT-DOC-06`) · [Repository readme](../../README.en.md) |

---

## 1. Purpose and audience

This document is for developers and system administrators. It describes how to set up the portal of the **Florentine Catasto of 1427/30** (*catasto*: the Florentine tax survey) for local development (§2) and for production with Docker (§3), how the Docker images are published automatically (§4) and how to solve the most frequent problems (§5). Environment variables are described in detail in [Backend and API](backend.md), section "Environment variables"; the procedure corresponds to use case UC-8 "Install and update the portal" in [Use cases](use-cases.md). For the overall structure see [Architecture and data model](architecture.md).

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

The migrations create the application tables (`segnalazioni`, `fuoco_segnature`). **They are mandatory**: without them the search responds with a 500 error.

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
| `catasto-backend` | `ipavon/catasto1427-backend:latest` | `127.0.0.1:3005` | Node.js API |
| `catasto-frontend` | `ipavon/catasto1427-frontend:latest` | **`1427`** | nginx: static site and proxy of `/api` to the backend |

The `docker-compose.yml` **pulls the images from Docker Hub**: it does not build the local code. Backend and database are reachable only from the server itself (loopback); only port 1427 is exposed externally, and it must be placed behind a TLS terminator (reverse proxy or CDN).

### 3.2 First installation

```bash
# in the folder that contains docker-compose.yml
cp .env.prod.example .env      # then change all the secret values
mkdir -p init && cp /path/to/Catasto.sql init/Catasto.sql

docker compose up -d
```

On first start MySQL imports `init/Catasto.sql` (this may take several minutes); the backend starts once the database is healthy.

Variables to set in `.env` (the example file comments all of them):

| Variable | Required | Notes |
|---|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | yes | database credentials |
| `SEGNALAZIONI_SALT` | yes | long random string; without it, user reports fail |
| `ADMIN_TOKEN` | recommended | enables the moderation API |
| `MODERAZIONE_SECRET` | recommended | enables the Accept/Reject links in the emails |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN` | recommended | email forwarding of user reports |
| `TRUST_PROXY` | already `1` | number of proxies in front of the backend: use a number (`true` would make the IP spoofable) |
| `CORS_ORIGIN`, `PUBLIC_API_URL` | no | only if frontend or API are on another domain |

### 3.3 Migrations

The backend container applies the migrations **by itself at every start**, before launching the server: the runner executes only the files in `backend-catasto/migrations/` not yet recorded. The logs (`docker compose logs backend`) show the lines `✅ …` or `↩️ … (già applicata)` ("already applied").

If a migration fails, the backend does not start and compose restarts it. To run the migrations manually:

```bash
docker compose exec backend node backend-catasto/dist/scripts/migrate.js
```

### 3.4 Verification

```bash
docker compose ps                        # three containers "running", db "healthy"
curl http://127.0.0.1:3005/health        # {"status":"ok","db":"up"}
curl -I http://127.0.0.1:1427/           # 200 from the frontend
```

Finally, send a test user report from the site and confirm the activation email that FormSubmit sends on the first submission.

### 3.5 Update

```bash
docker compose pull backend frontend
docker compose up -d backend frontend   # new migrations are applied at start
```

Alternatively the server can poll Docker Hub periodically (for example with Watchtower) and update the containers by itself; in this case too the migrations are applied when the backend starts.

To roll back to a previous version, replace `:latest` with the short-SHA tag (e.g. `ipavon/catasto1427-backend:1a2b3c4`, illustrative) and run `docker compose up -d` again.

### 3.6 Building the images locally

Useful to try changes not yet published. The build context is the monorepo root:

```bash
docker build -f backend-catasto/Dockerfile  -t ipavon/catasto1427-backend:latest  .
docker build -f frontend-catasto/Dockerfile -t ipavon/catasto1427-frontend:latest .
docker compose up -d
```

---

## 4. Automatic Docker images

### 4.1 Publishing

`.github/workflows/docker.yml` builds and publishes `ipavon/catasto1427-backend` and `ipavon/catasto1427-frontend` to Docker Hub on every push to `main`, **after** the CI (`ci.yml`) has passed. Each image has two tags: `latest` and the short SHA of the commit.

### 4.2 Secrets configuration

One-off configuration, in GitHub → Settings → Secrets and variables → Actions:

- `DOCKERHUB_USERNAME`: Docker Hub user (`ipavon`)
- `DOCKERHUB_TOKEN`: access token created in Docker Hub → Account settings → Personal access tokens, with *Read & Write* permission

### 4.3 Manual run

The workflow can also be started manually from Actions → Docker images → Run workflow. Caution: when started manually it publishes `:latest` from the chosen branch without going through the CI, so it must be used only on `main`.

---

## 5. Troubleshooting

### 5.1 Symptoms, causes and solutions

| Symptom | Probable cause | Solution |
|---|---|---|
| The search responds "Internal Server Error" (development) | migrations not run (`fuoco_segnature` missing) | `npm run db:migrate -w catasto-backend` |
| The backend container keeps restarting | a migration fails at start | `docker compose logs backend`, line `❌ … fallita` ("failed") |
| `/health` responds `503` | the backend cannot reach MySQL | check the `DB_*` / `MYSQL_*` variables and `docker compose logs db` |
| Port already in use | another service uses 1427, 3005 or 3306 | free the port or change it in `docker-compose.yml` |
| User reports respond 500 | `SEGNALAZIONI_SALT` is missing | set it in `.env` and restart the backend |
| Emails do not arrive | see the backend logs | FormSubmit diagnosis in [Backend and API](backend.md), section "Email flow (FormSubmit)" |
| Filters show old values after a reimport | options cached in the backend (derived data, up to `FILTERS_CACHE_TTL`, one hour by default) | `POST /api/filters/cache/invalidate` with `ADMIN_TOKEN` (see `docs/backend.md`), or `docker compose restart backend` |
| The folio viewer does not load the folios (error) | the ICAR service does not respond (502 in the backend logs) | try again later; the link to the original site remains available |
| Too many requests (`429`) | per-IP rate limit | with a proxy in front, check `TRUST_PROXY` |
| Type errors during build | `@catasto/shared` not rebuilt | `npm run build -w @catasto/shared` |

### 5.2 Starting again from a clean database

The MySQL data are in `./mysql_data` (bind mount): `docker compose down -v` does **not** delete them.

> **Caution** — Deleting `./mysql_data` also removes the contributed data (user reports and verified *portata* shelfmarks), which are not contained in the `Catasto.sql` dump and cannot be reimported.

```bash
docker compose down
rm -rf ./mysql_data          # CAUTION: also deletes the user reports
docker compose up -d         # reimports init/Catasto.sql, then the backend reapplies the migrations
```

---

## 6. References and sources

- Herlihy, David, and Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Digitised data (origin of the `Catasto.sql` dump): ACRH, <https://journals.openedition.org/acrh/7458>.
- Images of the folios shown by the viewer: Archivio di Stato di Firenze, ICAR digital archive, IIIF service.

---

## 7. Change log

| Version | Date | Author | Description |
|---|---|---|---|
| 1.x | — | — | Previous versions, no change log |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Rewritten according to CAT-DOC-00 and English translation |
