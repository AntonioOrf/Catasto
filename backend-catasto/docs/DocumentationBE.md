# Backend Catasto Fiorentino

Backend REST API per il sistema di consultazione del Catasto Fiorentino, basato su Node.js ed Express.

## Struttura del Progetto

Il progetto è organizzato secondo un'architettura modulare (Controller-Routes) per garantire manutenibilità e scalabilità, separando la logica di business dalla definizione delle rotte e dalla configurazione.

### 📂 Directory e File

#### 1. Root (`/`)
- **`server.js`**: **Entry point** dell'applicazione.
  - Inizializza l'app Express.
  - Configura i middleware (es. CORS).
  - Importa e monta i file di routing.
  - Avvia il server in ascolto sulla porta specificata.

#### 2. Configurazione (`config/`)
Gestione delle configurazioni e connessioni esterne.
- **`db.js`**: Gestisce la connessione al database MySQL.
  - Crea e sposta un pool di connessioni per efficienza.
  - Gestisce variabili d'ambiente per credenziali sensibili.

#### 3. Controllers (`controllers/`)
Contiene la logica "core" dell'applicazione. Ogni funzione qui riceve la `req` (richiesta), interagisce con il DB e invia la `res` (risposta).
- **`catasto.controller.js`**: Logica per i dati principali del catasto.
  - `getAll`: Gestisce filtri complessi, paginazione e ordinamento per la tabella principale.
  - `getSidebar`: Versione ottimizzata per caricare l'elenco laterale.
- **`parenti.controller.js`**:
  - `getByFuocoId`: Recupera i membri della famiglia associati a un "Fuoco".
- **`system.controller.js`**:
  - `ping`: Semplice health-check per verificare che il server sia vivo.

#### 4. Routes (`routes/`)
Definisce gli endpoint URL e li collega alle funzioni dei Controller.
- **`catasto.routes.js`**: Mappa `GET /` e `GET /sidebar` alle rispettive funzioni di `catasto.controller`.
- **`parenti.routes.js`**: Mappa `GET /:id` alla funzione di recupero parenti.
- **`system.routes.js`**: Definisce la rotta di ping.

#### 5. Utilities (`utils/`)
Funzioni di supporto riutilizzabili per mantenere pulito il codice dei controller.
- **`queryHelpers.js`**:
  - `buildQuery(filters)`: Costruisce dinamicamente la stringa SQL `WHERE` e l'array dei parametri in base ai filtri ricevuti dal frontend.
  - `buildOrderBy(sort_by, order)`: Genera in modo sicuro la clausola `ORDER BY` mappando i nomi dei campi frontend a quelli del database.

## Utilizzo

### Installazione
```bash
npm install
```

### Avvio
```bash
node server.js
```

### Variabili d'Ambiente (.env)
Il sistema richiede un file `.env` con:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `PORT` (opzionale, default 3001)
