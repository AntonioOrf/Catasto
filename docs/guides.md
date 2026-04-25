# 🚀 Guida all'Installazione e al Deployment

Questa guida fornisce istruzioni dettagliate per configurare il progetto **Catasto Fiorentino 1427** in diversi ambienti.

---

## 💻 Sviluppo Locale (Bare Metal)

Questa modalità è consigliata per chi desidera modificare attivamente il codice con hot-reload immediato.

### 1. Prerequisiti
- **Node.js** (v18+)
- **MySQL Server** (attivo e funzionante)
- **Git**

### 2. Setup Iniziale
Clona la repository e installa le dipendenze per l'intero monorepo:
```bash
git clone <repository-url>
cd Catasto
npm install
```

### 3. Database
1. Crea un database chiamato `catasto` nel tuo server MySQL.
2. Importa lo schema:
   ```bash
   mysql -u root -p catasto < db/Catasto.sql
   ```

### 4. Configurazione (.env)
Crea i file `.env` nelle rispettive cartelle:
- **`backend-catasto/.env`**:
  ```env
  DB_HOST=localhost
  DB_USER=il_tuo_utente
  DB_PASSWORD=la_tua_password
  DB_NAME=catasto
  PORT=3001
  ```
- **`frontend-catasto/.env`**:
  ```env
  VITE_API_URL=http://localhost:3001
  ```

### 5. Avvio
Dalla root del progetto:
```bash
npm run dev
```

---

## 🐳 Deployment con Docker (Consigliato)

Abbiamo adottato un'architettura a **multi-container** per garantire la massima pulizia e isolamento dei servizi. 

### Perché due immagini separate?
1. **Frontend (Nginx)**: L'immagine frontend contiene solo i file statici compilati serviti da un server Nginx leggerissimo.
2. **Backend (Node.js)**: L'immagine backend contiene la logica API e i driver di connessione al database.
3. **Database (MySQL)**: Un container dedicato per la persistenza dei dati.

### 1. Avvio Rapido con Docker Compose
Assicurati di avere Docker e Docker Compose installati, quindi esegui dalla root:

```bash
docker-compose up -d --build
```

Questo comando:
- Crea la rete interna tra i servizi.
- Configura automaticamente il database MySQL e importa i dati da `db/Catasto.sql`.
- Avvia il backend sulla porta `3001`.
- Avvia il frontend sulla porta `80`.

### 2. Verifica dello Stato
Puoi controllare che tutti i container siano attivi con:
```bash
docker ps
```
Dovresti vedere tre container: `catasto-db`, `catasto-backend`, e `catasto-frontend`.

---

## 🛠 Risoluzione Problemi

### Errori Docker
- **Porta già occupata**: Se ricevi un errore sulla porta `3306` o `80`, assicurati che non ci siano altri servizi (come un MySQL locale) già attivi su quelle porte.
- **Dati non aggiornati**: Se modifichi il database e vuoi resettarlo, rimuovi il volume con `docker-compose down -v` e riavvia.

### Errori Node.js
- **node_modules mancanti**: Se hai appena clonato il progetto, assicurati di aver eseguito `npm install` dalla cartella principale.
- **TS Error**: Se riscontri errori di tipo durante la build, verifica di aver aggiornato i tipi nel pacchetto `@catasto/shared`.

---

<p align="center">Per ulteriori domande, consulta la documentazione specifica del <a href="backend.md">Backend</a> o del <a href="frontend.md">Frontend</a>.</p>
