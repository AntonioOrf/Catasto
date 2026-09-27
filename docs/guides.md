# 🚀 Guida all'installazione e al deployment

Istruzioni per configurare il progetto **Catasto Fiorentino 1427** in sviluppo e in produzione.

> Vedi anche: [Architettura](architettura.md) · [Backend e variabili d'ambiente](backend.md#variabili-dambiente) · [Caso d'uso UC-8](casi-d-uso.md#uc-8--installare-e-aggiornare-il-portale)

---

## 💻 Sviluppo locale

Consigliato per modificare il codice con ricaricamento immediato.

### 1. Prerequisiti

- **Node.js 20** o superiore (React Router 7 e Vite richiedono Node ≥ 20; la CI usa Node 20)
- **MySQL 8** in esecuzione
- **Git**
- Il dump **`Catasto.sql`**: non è nel repository per scelta (i dati non sono pubblici), va richiesto a chi gestisce il progetto

### 2. Installazione

```bash
git clone https://github.com/AntonioOrf/Catasto.git
cd Catasto
npm install        # installa tutti i workspace e compila @catasto/shared
```

### 3. Database

```bash
mkdir -p init && cp /percorso/del/Catasto.sql init/Catasto.sql
mysql -u root -p -e "CREATE DATABASE catasto CHARACTER SET utf8mb4"
mysql -u root -p catasto < init/Catasto.sql
```

### 4. Configurazione

**`backend-catasto/.env`** (letto da `npm run dev` e dalle migrazioni in sviluppo):

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

### 5. Migrazioni

Creano le tabelle applicative (`segnalazioni`, `fuoco_segnature`). **Sono obbligatorie**: senza di esse la ricerca risponde con un errore 500.

```bash
npm run db:migrate -w catasto-backend
```

### 6. Avvio

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3005> · stato: <http://localhost:3005/health>

### 7. Controlli prima di una PR

Sono gli stessi passi della CI:

```bash
npm run build
npm run lint -w catasto-frontend
(cd backend-catasto && npx tsc --noEmit)
(cd frontend-catasto && npx tsc --noEmit)
npm test
```

---

## 🐳 Produzione con Docker

### Servizi

| Container | Immagine | Porta host | Ruolo |
|---|---|---|---|
| `catasto-db` | `mysql:8.0` | `127.0.0.1:3306` | database; dati in `./mysql_data` |
| `catasto-backend` | `ipavon/catasto1427-backend:latest` | `127.0.0.1:3005` | API Node.js |
| `catasto-frontend` | `ipavon/catasto1427-frontend:latest` | **`1427`** | nginx: sito statico e proxy di `/api` verso il backend |

Il `docker-compose.yml` **scarica le immagini da Docker Hub**: non compila il codice locale. Backend e database sono raggiungibili solo dal server stesso (loopback); dall'esterno si espone solo la porta 1427, da mettere dietro un terminatore TLS (reverse proxy o CDN).

### 1. Prima installazione

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
| `TRUST_PROXY` | già `1` | numero di proxy davanti al backend: usare un numero, non `true` |
| `CORS_ORIGIN`, `PUBLIC_API_URL` | no | solo se frontend o API stanno su un altro dominio |

### 2. Migrazioni

```bash
docker compose exec backend node backend-catasto/dist/scripts/migrate.js
```

Vanno eseguite dopo la prima installazione e dopo ogni aggiornamento che aggiunge file in `backend-catasto/migrations/`. Il runner applica solo quelle nuove.

### 3. Verifica

```bash
docker compose ps                        # tre container "running", db "healthy"
curl http://127.0.0.1:3005/health        # {"status":"ok","db":"up"}
curl -I http://127.0.0.1:1427/           # 200 dal frontend
```

Infine inviare una segnalazione di prova dal sito e confermare l'email di attivazione che FormSubmit manda al primo invio.

### 4. Aggiornamento

```bash
docker compose pull backend frontend
docker compose up -d backend frontend
# se ci sono nuove migrazioni:
docker compose exec backend node backend-catasto/dist/scripts/migrate.js
```

In alternativa il server può controllare periodicamente Docker Hub (ad esempio con Watchtower) e aggiornare i container da solo; le migrazioni restano un passo manuale.

Per tornare a una versione precedente, sostituire `:latest` con il tag dello SHA corto (es. `ipavon/catasto1427-backend:1a2b3c4`) e rieseguire `docker compose up -d`.

### 5. Compilare le immagini in locale

Utile per provare modifiche non ancora pubblicate. Il contesto di build è la root del monorepo:

```bash
docker build -f backend-catasto/Dockerfile  -t ipavon/catasto1427-backend:latest  .
docker build -f frontend-catasto/Dockerfile -t ipavon/catasto1427-frontend:latest .
docker compose up -d
```

---

## 🤖 Immagini Docker automatiche

`.github/workflows/docker.yml` costruisce e pubblica su Docker Hub `ipavon/catasto1427-backend` e `ipavon/catasto1427-frontend` a ogni push su `main`, **dopo** che la CI (`ci.yml`) è passata. Ogni immagine ha due tag: `latest` e lo SHA corto del commit.

Configurazione una tantum, in GitHub → Settings → Secrets and variables → Actions:

- `DOCKERHUB_USERNAME`: utente Docker Hub (`ipavon`)
- `DOCKERHUB_TOKEN`: access token creato su Docker Hub → Account settings → Personal access tokens, con permesso *Read & Write*

Il workflow si può lanciare anche a mano da Actions → Docker images → Run workflow. Attenzione: avviato a mano pubblica `:latest` dal ramo scelto senza passare dalla CI, quindi va usato solo su `main`.

---

## 🛠 Risoluzione dei problemi

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| La ricerca risponde "Internal Server Error" su un'installazione nuova | migrazioni non eseguite (`fuoco_segnature` mancante) | eseguire le migrazioni |
| `/health` risponde `503` | il backend non raggiunge MySQL | controllare le variabili `DB_*` / `MYSQL_*` e `docker compose logs db` |
| Porta già occupata | un altro servizio usa 1427, 3005 o 3306 | liberare la porta o cambiarla in `docker-compose.yml` |
| Il backend non parte con `invalid IP address: true` | `TRUST_PROXY=true` | usare un numero (`1`) |
| Le segnalazioni rispondono 500 | manca `SEGNALAZIONI_SALT` | impostarla in `.env` e riavviare il backend |
| Le email non arrivano | vedi i log del backend | [diagnosi FormSubmit](backend.md#flusso-email-formsubmit) |
| I filtri mostrano valori vecchi dopo un reimport | opzioni in cache nel backend | `docker compose restart backend` |
| Il visore non carica le carte (errore) | il servizio ICAR non risponde (502 nei log del backend) | riprovare più tardi; resta il link al sito originale |
| Troppe richieste (`429`) | rate limit per IP | con un proxy davanti, verificare `TRUST_PROXY` |
| Errori di tipo in build | `@catasto/shared` non ricompilato | `npm run build -w @catasto/shared` |

### Ripartire da un database pulito

I dati di MySQL sono in `./mysql_data` (bind mount): `docker compose down -v` **non** li cancella.

```bash
docker compose down
rm -rf ./mysql_data          # ATTENZIONE: cancella anche le segnalazioni
docker compose up -d         # reimporta init/Catasto.sql
docker compose exec backend node backend-catasto/dist/scripts/migrate.js
```
