# Installazione e deployment

🇮🇹 **Italiano** · 🇬🇧 [English](en/installation.md)

| Campo | Valore |
|---|---|
| Identificativo | `CAT-DOC-01` |
| Titolo | Installazione e deployment del portale Catasto fiorentino del 1427/30 |
| Versione | 2.0 |
| Data | 2026-10-29 |
| Stato | Approvato |
| Classificazione | Pubblico |
| Responsabili | Antonio Orfitelli, Pasquale Ruotolo |
| Lingua | Italiano (testo di riferimento) |
| Traduzione | [English](en/installation.md) |
| Documenti collegati | [Standard documentale](standard-documentale.md) (`CAT-DOC-00`) · [Architettura e modello dati](architettura.md) (`CAT-DOC-02`) · [Backend e API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Casi d'uso](casi-d-uso.md) (`CAT-DOC-05`) · [Revisione del codice](revisione-codice.md) (`CAT-DOC-06`) · [Readme del repository](../readme.md) |

---

## 1. Scopo e destinatari

Il documento è rivolto a sviluppatori e amministratori di sistema. Descrive come configurare il portale del **Catasto fiorentino del 1427/30** in sviluppo locale (§2) e in produzione con Docker (§3), come vengono pubblicate automaticamente le immagini Docker (§4) e come risolvere i problemi più frequenti (§5). Le variabili d'ambiente sono descritte in dettaglio in [Backend e API](backend.md), sezione «Variabili d'ambiente»; la procedura corrisponde al caso d'uso UC-8 «Installare e aggiornare il portale» di [Casi d'uso](casi-d-uso.md). Per la struttura complessiva si veda [Architettura e modello dati](architettura.md).

Il database del portale contiene dati di tre livelli di provenienza (standard `CAT-DOC-00`, §5.6):

- **dati della fonte**: il dump `Catasto.sql`, con i dati trascritti dalla ricerca Herlihy–Klapisch-Zuber e digitalizzati da ACRH;
- **dati contribuiti**: le tabelle applicative `segnalazioni` e `fuoco_segnature` (segnature della portata proposte dagli utenti e pubblicate dopo la verifica della redazione), create dalle migrazioni;
- **dati derivati**: calcolati dal portale (ad esempio le opzioni dei filtri tenute in cache dal backend).

---

## 2. Sviluppo locale

Configurazione consigliata per modificare il codice con ricaricamento immediato.

### 2.1 Prerequisiti

- **Node.js 20** o superiore (React Router 7 e Vite richiedono Node ≥ 20; la CI usa Node 20)
- **MySQL 8** in esecuzione
- **Git**
- Il dump **`Catasto.sql`** (dati della fonte): non è nel repository per scelta (i dati non sono pubblici), va richiesto a chi gestisce il progetto

### 2.2 Installazione

```bash
git clone https://github.com/AntonioOrf/Catasto.git
cd Catasto
npm install        # installa tutti i workspace e compila @catasto/shared
```

### 2.3 Database

```bash
mkdir -p init && cp /percorso/del/Catasto.sql init/Catasto.sql
mysql -u root -p -e "CREATE DATABASE catasto CHARACTER SET utf8mb4"
mysql -u root -p catasto < init/Catasto.sql
```

### 2.4 Configurazione

**`backend-catasto/.env`** (letto da `npm run dev` e dalle migrazioni in sviluppo). I valori seguenti sono fittizi:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=il_tuo_utente
DB_PASSWORD=la_tua_password
DB_NAME=catasto
PORT=3005

# Facoltative in sviluppo: vedi docs/backend.md
# ADMIN_TOKEN=token_di_prova
# MODERAZIONE_SECRET=segreto_di_prova
```

**`frontend-catasto/.env`** è facoltativo: senza, in sviluppo il frontend usa già `http://localhost:3005`.

```env
VITE_API_URL=http://localhost:3005
```

### 2.5 Migrazioni

Le migrazioni creano le tabelle applicative (`segnalazioni`, `fuoco_segnature`). **Sono obbligatorie**: senza di esse la ricerca risponde con un errore 500.

```bash
npm run db:migrate -w catasto-backend
```

### 2.6 Avvio

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3005> · stato: <http://localhost:3005/health>

### 2.7 Controlli prima di una PR

Sono gli stessi passi della CI:

```bash
npm run build
npm run lint -w catasto-frontend
(cd backend-catasto && npx tsc --noEmit)
(cd frontend-catasto && npx tsc --noEmit)
npm test
```

---

## 3. Produzione con Docker

### 3.1 Servizi

| Container | Immagine | Porta host | Ruolo |
|---|---|---|---|
| `catasto-db` | `mysql:8.0` | `127.0.0.1:3306` | database; dati in `./mysql_data` |
| `catasto-backend` | `ipavon/catasto1427-backend:latest` | `127.0.0.1:3005` | API Node.js |
| `catasto-frontend` | `ipavon/catasto1427-frontend:latest` | **`1427`** | nginx: sito statico e proxy di `/api` verso il backend |

Il `docker-compose.yml` **scarica le immagini da Docker Hub**: non compila il codice locale. Backend e database sono raggiungibili solo dal server stesso (loopback); dall'esterno si espone solo la porta 1427, da mettere dietro un terminatore TLS (reverse proxy o CDN).

### 3.2 Prima installazione

```bash
# nella cartella che contiene docker-compose.yml
cp .env.prod.example .env      # poi modificare tutti i valori segreti
mkdir -p init && cp /percorso/del/Catasto.sql init/Catasto.sql

docker compose up -d
```

Al primo avvio MySQL importa `init/Catasto.sql` (può richiedere diversi minuti); il backend parte quando il database risulta sano.

Variabili da impostare in `.env` (il file di esempio le commenta tutte):

| Variabile | Obbligatoria | Note |
|---|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | sì | credenziali del database |
| `SEGNALAZIONI_SALT` | sì | stringa casuale lunga; senza, le segnalazioni falliscono |
| `ADMIN_TOKEN` | consigliata | abilita l'API di moderazione |
| `MODERAZIONE_SECRET` | consigliata | abilita i link Accetta/Respingi nelle email |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN` | consigliate | inoltro email delle segnalazioni |
| `TRUST_PROXY` | già `1` | numero di proxy davanti al backend: usare un numero (`true` renderebbe falsificabile l'IP) |
| `CORS_ORIGIN`, `PUBLIC_API_URL` | no | solo se frontend o API stanno su un altro dominio |

### 3.3 Migrazioni

Il container del backend applica le migrazioni **da solo a ogni avvio**, prima di far partire il server: il runner esegue solo i file di `backend-catasto/migrations/` non ancora registrati. Nei log (`docker compose logs backend`) compaiono le righe `✅ …` o `↩️ … (già applicata)`.

Se una migrazione fallisce, il backend non parte e il compose lo riavvia. Per rilanciare le migrazioni a mano:

```bash
docker compose exec backend node backend-catasto/dist/scripts/migrate.js
```

### 3.4 Verifica

```bash
docker compose ps                        # tre container "running", db "healthy"
curl http://127.0.0.1:3005/health        # {"status":"ok","db":"up"}
curl -I http://127.0.0.1:1427/           # 200 dal frontend
```

Infine inviare una segnalazione di prova dal sito e confermare l'email di attivazione che FormSubmit manda al primo invio.

### 3.5 Aggiornamento

```bash
docker compose pull backend frontend
docker compose up -d backend frontend   # le nuove migrazioni si applicano all'avvio
```

In alternativa il server può controllare periodicamente Docker Hub (ad esempio con Watchtower) e aggiornare i container da solo; anche in questo caso le migrazioni si applicano all'avvio del backend.

Per tornare a una versione precedente, sostituire `:latest` con il tag dello SHA corto (es. `ipavon/catasto1427-backend:1a2b3c4`, illustrativo) e rieseguire `docker compose up -d`.

### 3.6 Compilare le immagini in locale

Utile per provare modifiche non ancora pubblicate. Il contesto di build è la root del monorepo:

```bash
docker build -f backend-catasto/Dockerfile  -t ipavon/catasto1427-backend:latest  .
docker build -f frontend-catasto/Dockerfile -t ipavon/catasto1427-frontend:latest .
docker compose up -d
```

---

## 4. Immagini Docker automatiche

### 4.1 Pubblicazione

`.github/workflows/docker.yml` costruisce e pubblica su Docker Hub `ipavon/catasto1427-backend` e `ipavon/catasto1427-frontend` a ogni push su `main`, **dopo** che la CI (`ci.yml`) è passata. Ogni immagine ha due tag: `latest` e lo SHA corto del commit.

### 4.2 Configurazione dei segreti

Configurazione una tantum, in GitHub → Settings → Secrets and variables → Actions:

- `DOCKERHUB_USERNAME`: utente Docker Hub (`ipavon`)
- `DOCKERHUB_TOKEN`: access token creato su Docker Hub → Account settings → Personal access tokens, con permesso *Read & Write*

### 4.3 Avvio manuale

Il workflow si può lanciare anche a mano da Actions → Docker images → Run workflow. Attenzione: avviato a mano pubblica `:latest` dal ramo scelto senza passare dalla CI, quindi va usato solo su `main`.

---

## 5. Risoluzione dei problemi

### 5.1 Sintomi, cause e soluzioni

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| La ricerca risponde "Internal Server Error" (sviluppo) | migrazioni non eseguite (`fuoco_segnature` mancante) | `npm run db:migrate -w catasto-backend` |
| Il container del backend si riavvia di continuo | una migrazione fallisce all'avvio | `docker compose logs backend`, riga `❌ … fallita` |
| `/health` risponde `503` | il backend non raggiunge MySQL | controllare le variabili `DB_*` / `MYSQL_*` e `docker compose logs db` |
| Porta già occupata | un altro servizio usa 1427, 3005 o 3306 | liberare la porta o cambiarla in `docker-compose.yml` |
| Le segnalazioni rispondono 500 | manca `SEGNALAZIONI_SALT` | impostarla in `.env` e riavviare il backend |
| Le email non arrivano | vedi i log del backend | diagnosi FormSubmit in [Backend e API](backend.md), sezione «Flusso email (FormSubmit)» |
| I filtri mostrano valori vecchi dopo un reimport | opzioni in cache nel backend (dato derivato, fino a `FILTERS_CACHE_TTL`, di default un'ora) | `POST /api/filters/cache/invalidate` con `ADMIN_TOKEN` (vedi `docs/backend.md`), oppure `docker compose restart backend` |
| Il visore delle carte non carica le carte (errore) | il servizio ICAR non risponde (502 nei log del backend) | riprovare più tardi; resta il link al sito originale |
| Troppe richieste (`429`) | rate limit per IP | con un proxy davanti, verificare `TRUST_PROXY` |
| Errori di tipo in build | `@catasto/shared` non ricompilato | `npm run build -w @catasto/shared` |

### 5.2 Ripartire da un database pulito

I dati di MySQL sono in `./mysql_data` (bind mount): `docker compose down -v` **non** li cancella.

> **Attenzione** — Cancellare `./mysql_data` elimina anche i dati contribuiti (segnalazioni e segnature della portata verificate), che non sono contenuti nel dump `Catasto.sql` e non si possono reimportare.

```bash
docker compose down
rm -rf ./mysql_data          # ATTENZIONE: cancella anche le segnalazioni
docker compose up -d         # reimporta init/Catasto.sql, poi il backend riapplica le migrazioni
```

---

## 6. Riferimenti e fonti

- Herlihy, David, e Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Dati digitalizzati (origine del dump `Catasto.sql`): ACRH, <https://journals.openedition.org/acrh/7458>.
- Immagini delle carte mostrate dal visore: Archivio di Stato di Firenze, Archivio digitale ICAR, servizio IIIF.

---

## 7. Registro delle modifiche

| Versione | Data | Autore | Descrizione |
|---|---|---|---|
| 1.x | — | — | Versioni precedenti, senza registro |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Riscrittura secondo CAT-DOC-00 e traduzione inglese |
