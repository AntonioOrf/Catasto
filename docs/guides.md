# Installation & Deployment Guide

This guide provides step-by-step instructions for setting up the Catasto project in different environments.

## Local Development

The project is structured as an npm monorepo, making it easy to manage both frontend and backend simultaneously.

### 1. Prerequisiti

- **Node.js** (v18 o superiore)
- **MySQL Server**
- **Git**

### 2. Setup Iniziale

Clona la repository e installa le dipendenze dalla root:

```bash
git clone <repository-url>
cd Catasto
npm install
```

### 3. Configurazione Database

1. Accedi al tuo server MySQL.
2. Crea un database (es. `catasto`).
3. Importa lo schema:
   ```bash
   mysql -u root -p catasto < db/Catasto.sql
   ```

### 4. Variabili d'Ambiente

Copia i file di esempio e configurali:

- In `backend-catasto/.env`: Configura le credenziali del DB.
- In `frontend-catasto/.env`: Configura l'URL dell'API (default: `http://localhost:3001`).

### 5. Avvio

Dalla root del progetto, avvia tutto con:

```bash
npm run dev
```

---

## Risoluzione Problemi Comune

- **Errore di connessione DB**: Verifica che il servizio MySQL sia attivo e che le credenziali nel file `.env` del backend siano corrette.
- **Vite HMR Error**: Se noti errori nel caricamento dei moduli dopo una modifica strutturale, prova a riavviare il server di sviluppo (`Ctrl+C` e poi `npm run dev`).
