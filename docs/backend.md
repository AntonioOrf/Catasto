# Documentazione Backend

Questo documento fornisce una guida completa all'architettura backend, agli endpoint API e alla configurazione dell'applicazione Catasto.

## Panoramica

Il backend è realizzato con **Node.js** ed **Express**, e funge da API RESTful per interrogare i dati del Catasto Fiorentino del 1427. Si connette a un database **MySQL** e gestisce filtraggi complessi, paginazione e aggregazione dei dati.

## Architettura

Il progetto segue un pattern modulare **Controller-Service-Route** (principalmente Controller-Route in questa implementazione) per separare le responsabilità.

### Struttura delle Directory

- **`server.js`**: Punto di ingresso dell'applicazione. Inizializza Express, i middleware (CORS, parsing JSON) e monta le rotte.
- **`config/`**: File di configurazione.
  - `db.js`: Gestisce il pool di connessioni MySQL e le variabili d'ambiente.
- **`controllers/`**: Logica principale. Gestisce le richieste, interagisce con il DB e invia le risposte.
  - `catasto.controller.js`: Logica principale per il recupero e il filtraggio dei dati del censimento.
  - `parenti.controller.js`: Logica per recuperare i membri della famiglia ("bocche") per uno specifico "fuoco".
  - `system.controller.js`: Utility di sistema (es. health checks).
- **`routes/`**: Definizioni delle rotte API.
  - `catasto.routes.js`: Rotte per il recupero dei dati principali.
  - `parenti.routes.js`: Rotte per i dettagli della famiglia.
  - `system.routes.js`: Rotte di sistema.
- **`utils/`**: Funzioni di supporto.
  - `queryHelpers.js`: Funzioni per costruire dinamicamente le clausole SQL `WHERE` e `ORDER BY` basate sui filtri del frontend.

## Endpoint API

### Dati Catasto

#### `GET /api/catasto`

Recupera una lista paginata di record del censimento basata sui filtri.

**Parametri Query:**

- `page` (int): Numero di pagina (default: 1).
- `limit` (int): Risultati per pagina (default: 50).
- `sort_by` (string): Campo per l'ordinamento (es. `famiglia`, `imponibile`).
- `order` (string): Direzione dell'ordinamento (`ASC` o `DESC`).
- **Filtri**:
  - `persona`: Ricerca per nome del capofamiglia (corrispondenza parziale).
  - `localita`: Ricerca per località (corrispondenza parziale).
  - `quartiere`, `gonfalone`: Filtri specifici per località.
  - `mestiere`: Filtro per professione.
  - `imponibile_min/max`: Filtro per range di ricchezza imponibile.
  - `...` (vari altri filtri economici e demografici).

#### `GET /api/catasto/sidebar`

Recupera dati aggregati o una lista completa di ID/Nomi per la navigazione laterale, rispettando i filtri correnti.

### Dettagli Famiglia

#### `GET /api/parenti/:id`

Recupera la lista dei membri della famiglia per uno specifico ID famiglia (`id_fuoco`).

**Parametri:**

- `id` (int): L'identificativo unico del nucleo familiare.

### Sistema

#### `GET /api/system/ping`

Endpoint di controllo salute (Health check). Restituisce `{ status: "ok" }`.

## Configurazione

Il backend si basa su variabili d'ambiente memorizzate nel file `.env` nella directory `backend-catasto`.

### Variabili Richieste

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tua_password
DB_NAME=catasto
DB_PORT=3306
PORT=3001
```
