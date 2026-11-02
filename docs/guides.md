# Installazione e deployment

🇮🇹 **Italiano** · 🇬🇧 [English](en/installation.md)

| Campo | Valore |
|---|---|
| Identificativo | `CAT-DOC-01` |
| Titolo | Installazione e deployment del portale Catasto fiorentino del 1427/30 |
| Versione | 2.5 |
| Data | 2026-11-02 |
| Stato | Approvato |
| Classificazione | Pubblico |
| Responsabili | Antonio Orfitelli, Pasquale Ruotolo |
| Lingua | Italiano (testo di riferimento) |
| Traduzione | [English](en/installation.md) |
| Documenti collegati | [Standard documentale](standard-documentale.md) (`CAT-DOC-00`) · [Architettura e modello dati](architettura.md) (`CAT-DOC-02`) · [Backend e API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Casi d'uso](casi-d-uso.md) (`CAT-DOC-05`) · [Revisione del codice](revisione-codice.md) (`CAT-DOC-06`) · [Portabilità](portabilita.md) (`CAT-DOC-07`) · [Readme del repository](../readme.md) |

---

## 1. Scopo e destinatari

Il documento è rivolto a sviluppatori e amministratori di sistema. Descrive come configurare il portale del **Catasto fiorentino del 1427/30** in sviluppo locale (§2) e in produzione con Docker (§3) e su Vercel (§4), come viene pubblicata automaticamente l'immagine Docker (§5) e come risolvere i problemi più frequenti (§6). Altre piattaforme (Kubernetes, OpenShift, Podman, macchine senza container) e il trasferimento sui server di un ateneo sono trattati in [Portabilità e trasferimento all'ateneo](portabilita.md). Le variabili d'ambiente sono descritte in dettaglio in [Backend e API](backend.md), sezione «Variabili d'ambiente»; la procedura corrisponde al caso d'uso UC-8 «Installare e aggiornare il portale» di [Casi d'uso](casi-d-uso.md). Per la struttura complessiva si veda [Architettura e modello dati](architettura.md).

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

Le migrazioni creano le tabelle applicative (`segnalazioni`, `fuoco_segnature`, `traduzioni_lookup`, `luoghi_geo`). **Sono obbligatorie**: senza di esse la ricerca risponde con un errore 500 e la mappa resta vuota. Vanno rilanciate dopo ogni `git pull` che aggiunge un file in `backend-catasto/migrations/`.

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
| `catasto-app` | `ipavon/catasto1427:latest` | **`1427`** | sito statico e API Node.js nello stesso processo |

Il `docker-compose.yml` **scarica le immagini da Docker Hub**: non compila il codice locale. Il database è raggiungibile solo dal server stesso (loopback); dall'esterno si espone solo la porta 1427, da mettere dietro un terminatore TLS (reverse proxy o CDN).

### 3.2 Prima installazione

```bash
# nella cartella che contiene docker-compose.yml
cp .env.prod.example .env      # poi modificare tutti i valori segreti
mkdir -p init && cp /percorso/del/Catasto.sql init/Catasto.sql

docker compose up -d
```

Al primo avvio MySQL importa `init/Catasto.sql` (può richiedere diversi minuti); il container `app` parte quando il database risulta sano.

Variabili da impostare in `.env` (il file di esempio le commenta tutte):

| Variabile | Obbligatoria | Note |
|---|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | sì | credenziali del database |
| `SEGNALAZIONI_SALT` | sì | stringa casuale lunga; senza, le segnalazioni falliscono |
| `ADMIN_TOKEN` | consigliata | abilita l'API di moderazione |
| `MODERAZIONE_SECRET` | consigliata | abilita i link Accetta/Respingi nelle email |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN` | consigliate | inoltro email delle segnalazioni |
| `TRUST_PROXY` | secondo il caso | vuota se la porta 1427 è esposta direttamente; `1` se davanti c'è un reverse proxy e la porta non è raggiungibile senza passare da lì. Usare un numero (`true` renderebbe falsificabile l'IP) |
| `CORS_ORIGIN`, `PUBLIC_API_URL` | no | solo se frontend o API stanno su un altro dominio |

### 3.3 Migrazioni

Il container `app` applica le migrazioni **da solo a ogni avvio**, prima di far partire il server: il runner esegue solo i file di `backend-catasto/migrations/` non ancora registrati. Nei log (`docker compose logs app`) compaiono le righe `✅ …` o `↩️ … (già applicata)`.

Se una migrazione fallisce, il server non parte e il compose lo riavvia. Per rilanciare le migrazioni a mano:

```bash
docker compose exec app node backend-catasto/dist/scripts/migrate.js
```

### 3.4 Verifica

```bash
docker compose ps                        # catasto-db e catasto-app "healthy"
curl http://127.0.0.1:1427/health        # {"status":"ok","db":"up"}
curl -I http://127.0.0.1:1427/           # 200 text/html (il sito)
```

Infine inviare una segnalazione di prova dal sito e confermare l'email di attivazione che FormSubmit manda al primo invio.

### 3.5 Aggiornamento

```bash
docker compose pull app
docker compose up -d app   # le nuove migrazioni si applicano all'avvio
```

Passaggio dalla vecchia configurazione a due immagini (`catasto-backend` + `catasto-frontend` con nginx): aggiornare `docker-compose.yml` e `.env`, poi `docker compose pull app && docker compose up -d --remove-orphans`, che ferma e rimuove i due container vecchi. Se davanti alla porta 1427 c'è un reverse proxy, rivedere `TRUST_PROXY` (vedi `.env.prod.example`).

In alternativa il server può controllare periodicamente Docker Hub (ad esempio con Watchtower) e aggiornare i container da solo; anche in questo caso le migrazioni si applicano all'avvio del backend.

Per tornare a una versione precedente, sostituire `:latest` con il tag dello SHA corto (es. `ipavon/catasto1427:1a2b3c4`, illustrativo) e rieseguire `docker compose up -d`.

### 3.6 Compilare l'immagine in locale

Utile per provare modifiche non ancora pubblicate. Il contesto di build è la root del monorepo:

```bash
docker build -t ipavon/catasto1427:latest .
docker compose up -d
```

### 3.7 Allineare il database da TiDB

Se la produzione su Vercel (§4) usa TiDB Cloud, il MySQL del server Docker è una copia separata: le scritture di un sito non arrivano all'altro. Per riallinearlo a TiDB, che fa da fonte autorevole:

1. Salvare le credenziali di TiDB (le stesse di Vercel) in un file `.tidb.env` con permessi 600: `TIDB_HOST`, `TIDB_PORT` (4000), `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DB`.
2. Fare un backup del MySQL locale:
   ```bash
   docker compose exec -T db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' > backup-mysql-$(date +%F).sql
   ```
3. Confrontare le due basi dati (tabelle, numero di righe, `schema_migrations`, `segnalazioni`): le righe presenti solo nel MySQL locale, per esempio segnalazioni arrivate dal sito Docker, vanno esportate a parte e reinserite dopo l'import.
4. Fare il dump da TiDB con il client di `mysql:8.0`, in TLS con verifica del certificato:
   ```bash
   docker run --rm --env-file .tidb.env mysql:8.0 sh -c 'mysqldump -h "$TIDB_HOST" -P "$TIDB_PORT" -u "$TIDB_USER" -p"$TIDB_PASSWORD" --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/pki/tls/certs/ca-bundle.crt --single-transaction --skip-lock-tables --skip-add-locks --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --skip-routines --skip-triggers --default-character-set=utf8mb4 "$TIDB_DB"' > dump-tidb-$(date +%F).sql
   ```
   Il file deve terminare con `-- Dump completed`. I commenti specifici di TiDB (`/*T![...] */`) sono ignorati da MySQL.
5. Fermare l'applicazione e importare:
   ```bash
   docker compose stop app
   docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 "$MYSQL_DATABASE"' < dump-tidb-$(date +%F).sql
   docker compose start app
   ```
6. Ripetere il conteggio delle righe e la verifica del §3.4, poi cancellare `.tidb.env`.

In alternativa il container può usare direttamente TiDB (in `.env`: `DB_HOST` e credenziali di TiDB, `DB_PORT=4000`, `DB_SSL=true` nel servizio `app`): un solo database per i due siti, senza sincronizzazioni.

---

## 4. Produzione su Vercel

Su Vercel un solo progetto serve sito e API: il frontend come sito statico, il backend come Vercel Function (`frontend-catasto/api/index.js`, che esporta l'app Express). Il database è esterno, per esempio TiDB Cloud.

La funzione non importa i sorgenti del backend: `npm run build` del frontend, dopo `vite build`, compila `backend-catasto/src/app.ts` in un solo file, `frontend-catasto/server/app.mjs` (`scripts/build-api.mjs`, esbuild), con dentro il pacchetto condiviso `@catasto/shared` e tutte le dipendenze npm del backend (express, mysql2, exceljs...): il file usa solo i moduli di Node. Su Vercel la radice del progetto è `frontend-catasto`, e la funzione non riceve né il collegamento dei workspace a `@catasto/shared` né le dipendenze del backend: con import esterni ogni rotta falliva con `ERR_MODULE_NOT_FOUND`.

### 4.1 Impostazioni del progetto

| Impostazione | Valore |
|---|---|
| Root Directory | `frontend-catasto` |
| Framework | Vite |
| Include files outside the Root Directory | attiva (default): la funzione importa `backend-catasto/` |

`vercel.json` instrada `/api/*` e `/health` alla funzione e il resto a `index.html`.

### 4.2 Variabili d'ambiente

| Variabile | Valore |
|---|---|
| `VITE_API_URL` | **non impostata**: sito e API stanno sullo stesso dominio |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | credenziali del database |
| `DB_PORT` | `4000` per TiDB Cloud |
| `DB_SSL` | `true` |
| `TRUST_PROXY` | `1` |
| `SEGNALAZIONI_SALT`, `ADMIN_TOKEN` | come in Docker (stesso `SEGNALAZIONI_SALT` se il database è condiviso) |
| `FORMSUBMIT_EMAIL`, `FORMSUBMIT_ORIGIN`, `MODERAZIONE_SECRET`, `PUBLIC_API_URL` | facoltative; `PUBLIC_API_URL` è l'URL del sito |
| `DB_CONNECTION_LIMIT` | facoltativa; default 5 connessioni per istanza della funzione |

Le variabili vanno impostate per l'ambiente Production e, se si vogliono anteprime funzionanti, anche per Preview.

### 4.3 Migrazioni

Su Vercel **le migrazioni non partono da sole**: una Vercel Function non ha un avvio in cui eseguire il runner, come invece fanno il container Docker (§3.3) e il servizio systemd. Dopo ogni rilascio che aggiunge un file in `backend-catasto/migrations/` vanno applicate a mano, da una macchina con il repository, puntando al database di produzione (le stesse credenziali di §4.2):

```bash
DB_HOST=<host> DB_PORT=4000 DB_USER=<utente> DB_PASSWORD=<password> DB_NAME=<database> DB_SSL=true npm run db:migrate -w catasto-backend
```

Il runner applica solo i file non ancora registrati in `schema_migrations` e prende un lock MySQL, quindi rilanciarlo non fa danni. Finché non si applicano, le funzioni che usano le tabelle nuove restano vuote: per esempio senza `luoghi_geo` (migrazioni 006–007) la mappa mostra «Le coordinate dei luoghi non sono ancora caricate nel database».

### 4.4 Verifica e limiti

`https://<dominio>/health` deve rispondere `{"status":"ok","db":"up"}`. Ogni richiesta dura al massimo 60 secondi (export molto grandi compresi); il rate limit è in memoria, quindi vale per singola istanza della funzione.

Installazione e build sono fissate in `vercel.json`: `"installCommand": "cd .. && npm ci"` installa dalla radice del monorepo le dipendenze di tutti i workspace (con la sola radice `frontend-catasto` mancherebbero quelle del backend, e il bundle non si compilerebbe), `"buildCommand": "npm run build"` compila sito e backend. Un valore diverso nelle impostazioni del progetto non li sostituisce. Se il backend non si avvia (bundle mancante, variabile d'ambiente non valida come `SHARED_STATE`, dipendenza assente), `api/index.js` non lascia andare in crash la funzione: ogni rotta risponde `503` con `{"error": "Avvio del backend non riuscito", "dettaglio": "…"}` e l'errore completo finisce nei log della funzione.

---

## 5. Immagini Docker automatiche

### 5.1 Pubblicazione

`.github/workflows/docker.yml` costruisce e pubblica su Docker Hub `ipavon/catasto1427` (sito e API in un'unica immagine) a ogni push su `main`, **dopo** che la CI (`ci.yml`) è passata. L'immagine ha due tag: `latest` e lo SHA corto del commit.

### 5.2 Configurazione dei segreti

Configurazione una tantum, in GitHub → Settings → Secrets and variables → Actions:

- `DOCKERHUB_USERNAME`: utente Docker Hub (`ipavon`)
- `DOCKERHUB_TOKEN`: access token creato su Docker Hub → Account settings → Personal access tokens, con permesso *Read & Write*

### 5.3 Avvio manuale

Il workflow si può lanciare anche a mano da Actions → Docker images → Run workflow. Attenzione: avviato a mano pubblica `:latest` dal ramo scelto senza passare dalla CI, quindi va usato solo su `main`.

---

## 6. Risoluzione dei problemi

### 6.1 Sintomi, cause e soluzioni

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| La ricerca risponde "Internal Server Error" (sviluppo) | migrazioni non eseguite (`fuoco_segnature` mancante) | `npm run db:migrate -w catasto-backend` |
| La mappa dice «Le coordinate dei luoghi non sono ancora caricate nel database (migrazioni 006 e 007)» | la tabella `luoghi_geo` non esiste nel database a cui si collega il backend: migrazioni non applicate (sviluppo, Vercel) o tabella persa in un trasferimento del database | sviluppo: `npm run db:migrate -w catasto-backend`; Docker: `docker compose exec app node backend-catasto/dist/scripts/migrate.js`; Vercel: §4.3. Se il runner risponde `↩️ 006_luoghi_geo.sql (già applicata)` ma la tabella manca, vedi sotto |
| Il runner dice «già applicata» ma la tabella della migrazione non esiste | `schema_migrations` è stata copiata senza la tabella (dump parziale) | cancellare le righe delle migrazioni interessate, per esempio `DELETE FROM schema_migrations WHERE name IN ('006_luoghi_geo.sql','007_luoghi_geo_automatici.sql');`, e rilanciare le migrazioni |
| Il container del backend si riavvia di continuo | una migrazione fallisce all'avvio | `docker compose logs app`, riga `❌ … fallita` |
| `/health` risponde `503` | il backend non raggiunge MySQL | controllare le variabili `DB_*` / `MYSQL_*` e `docker compose logs db` |
| Porta già occupata | un altro servizio usa 1427, 3005 o 3306 | liberare la porta o cambiarla in `docker-compose.yml` |
| Le segnalazioni rispondono 500 | manca `SEGNALAZIONI_SALT` | impostarla in `.env` e riavviare il backend |
| Le email non arrivano | vedi i log del backend | diagnosi FormSubmit in [Backend e API](backend.md), sezione «Flusso email (FormSubmit)» |
| I filtri mostrano valori vecchi dopo un reimport | opzioni in cache nel backend (dato derivato, fino a `FILTERS_CACHE_TTL`, di default un'ora) | `POST /api/filters/cache/invalidate` con `ADMIN_TOKEN` (vedi `docs/backend.md`), oppure `docker compose restart app` |
| Il visore delle carte non carica le carte (errore) | il servizio ICAR non risponde (502 nei log del backend) | riprovare più tardi; resta il link al sito originale |
| Troppe richieste (`429`) | rate limit per IP | con un proxy davanti, verificare `TRUST_PROXY` |
| Errori di tipo in build | `@catasto/shared` non ricompilato | `npm run build -w @catasto/shared` |

### 6.2 Ripartire da un database pulito

I dati di MySQL sono in `./mysql_data` (bind mount): `docker compose down -v` **non** li cancella.

> **Attenzione** — Cancellare `./mysql_data` elimina anche i dati contribuiti (segnalazioni e segnature della portata verificate), che non sono contenuti nel dump `Catasto.sql` e non si possono reimportare.

```bash
docker compose down
rm -rf ./mysql_data          # ATTENZIONE: cancella anche le segnalazioni
docker compose up -d         # reimporta init/Catasto.sql, poi il backend riapplica le migrazioni
```

---

## 7. Riferimenti e fonti

- Herlihy, David, e Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Dati digitalizzati (origine del dump `Catasto.sql`): ACRH, <https://journals.openedition.org/acrh/7458>.
- Immagini delle carte mostrate dal visore: Archivio di Stato di Firenze, Archivio digitale ICAR, servizio IIIF.

---

## 8. Registro delle modifiche

| Versione | Data | Autore | Descrizione |
|---|---|---|---|
| 1.x | — | — | Versioni precedenti, senza registro |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Riscrittura secondo CAT-DOC-00 e traduzione inglese |
| 2.1 | 2026-11-01 | Pasquale Ruotolo | Immagine Docker unica (`app`), produzione su Vercel (§4), allineamento del database da TiDB (§3.7), `TRUST_PROXY` secondo il caso |
| 2.2 | 2026-11-01 | Pasquale Ruotolo | Rimando a CAT-DOC-07 per le altre piattaforme |
| 2.3 | 2026-11-01 | Pasquale Ruotolo | Vercel: il backend della funzione è compilato in un solo file con `@catasto/shared` (§4) |
| 2.4 | 2026-11-01 | Pasquale Ruotolo | Vercel: comando di build in `vercel.json`, errore di avvio del backend in risposta (503) e nei log (§4.3) |
| 2.5 | 2026-11-02 | Pasquale Ruotolo | Vercel: dipendenze npm del backend nel bundle della funzione, installazione dalla radice del monorepo (§4) |
| 2.6 | 2026-11-02 | Pasquale Ruotolo | Vercel: migrazioni da applicare a mano (§4.3, la verifica passa a §4.4); mappa senza coordinate e `schema_migrations` senza tabelle in §6.1 |
