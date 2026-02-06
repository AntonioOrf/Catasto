<div align="center">
  <h1>📜 Catasto Fiorentino del 1427/30 </h1>
  <h3>Sistema Digitale di Consultazione dei Registri dei Fuochi</h3>
  <p>Un'applicazione Full-Stack per l'esplorazione, la ricerca e l'analisi di dati censuari storici.</p>

  <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; margin-bottom: 20px;">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  </div>
</div>

---

## 📖 Descrizione del Progetto

Questo progetto web si propone di rendere accessibili in modo più fluido e semplice i dati del Catasto Fiorentino del 1427/29 raccolti da Klapisch-Zuber nel suo noto volume "Tuscans and Their Families: A Study of the Florentine Catasto of 1427"
e digitalizzati in formato excel dalla stessa presso questo [link](https://journals.openedition.org/acrh/7458)

---

## ✨ Funzionalità Principali

### 🔍 1. Sistema di Ricerca Avanzato

L'applicazione offre due livelli di ricerca:

- **Ricerca Rapida:** Barre di ricerca testuale per **Capofamiglia** e **Località** (Quartiere, Popolo, Piviere), sempre visibili in alto.
- **Pannello Filtri Avanzati (Collassabile):** Un'area dedicata per affinare la ricerca tramite:
  - **Mestiere:** Ricerca per professione (es. Fabbro, Notaio).
  - **Rapporto Mestiere:** Filtro per ruolo lavorativo (Maestro, Garzone, Apprendista).
  - **Bestiame:** Filtro per tipologia di animali posseduti (Bovini, animali da soma, ecc.).
  - **Immigrazione:** Filtro per status di residenza (Cittadino, Forestiero, Contadino).

### 💰 2. Analisi Economica Dettagliata

È possibile filtrare i risultati basandosi su **4 range economici** distinti, inserendo valori Minimi e Massimi in Fiorini:

- **Fortune:** Patrimonio complessivo.
- **Credito & Credito del Monte:** Analisi dei crediti finanziari differenziati tra crediti personali e crediti pubblici.
- **Imponibile Totale:** La base tassabile del nucleo.
- **Deduzioni:** Le deduzioni fiscali applicati al fuoco.

### 📊 3. Visualizzazione Dati & Ordinamento

- **Tabella Interattiva:** Mostra i dati sintetici (Nome, Localizzazione, Dati Economici, Riferimenti Archivistici).
- **Ordinamento Cliccabile:** È possibile ordinare i risultati (Crescente/Decrescente) cliccando sulle intestazioni delle colonne: _Capofamiglia_, _Località_, _Dati Sintetici (Fortune, Credito, ecc.)_.
- **Riferimenti Archivistici:** Ogni riga mostra chiaramente il **Volume** e il **Foglio** del campione catastale originale per facilitare la consultazione sia fisica che, nel caso di alcuni volumi, digitale tramite il [sito](https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/2722310.)

### 👨‍👩‍👧‍👦 4. Dettagli Espandibili (Drill-Down)

Cliccando su una riga, questa si espande mostrando una scheda di dettaglio completa:

- **Quadro Economico Completo:** Valori esatti di Imponibile, Deduzioni, Crediti e note specifiche.
- **Composizione Familiare:** Tabella dinamica che elenca tutti i membri del fuoco, con età, ruolo parentale (Moglie, Figlio/a), sesso e stato civile.

### 🚀 5. Navigazione Veloce & Sidebar Intelligente

- **Sidebar "Indice Totale":** Una colonna laterale (collassabile) carica **tutti** i risultati della query corrente (anche migliaia), permettendo una visione d'insieme immediata.
- **Salto Pagina Automatico:** Cliccando un nome nella sidebar che si trova in una pagina diversa della tabella, l'app calcola automaticamente la pagina corretta, la carica e scrolla fino alla riga selezionata aprendone i dettagli.
- **Paginazione a Tendina:** Selezione rapida della pagina tramite menu dropdown in basso.

---

## 🛠️ Architettura del Progetto

Il progetto è strutturato come un'applicazione **Monorepo** (Frontend e Backend nella stessa repository) ma separati logicamente.

### 🖥️ Frontend (`/frontend-catasto`)

- Sviluppato con **React 18** e **Vite**.
- Styling con **Tailwind CSS v3** per un design responsivo e performante.
- Icone vettoriali tramite **Lucide React**.
- Gestione Variabili d'Ambiente per URL API dinamici.

### ⚙️ Backend (`/backend-catasto`)

- Server **Node.js** con framework **Express**.
- Interazione con il database tramite **MySQL2**.
- API RESTful che supportano paginazione, ordinamento lato server e filtri complessi.
- Configurazione CORS e dotenv per la sicurezza in produzione.

### 🗄️ Database

- Database Relazionale **MySQL**.
- Schema complesso con tabelle correlate per _Fuochi, Parenti, Mestieri, Toponomastica (Quartieri, Popoli), Dati Economici_.

---

## 🚀 Installazione e Avvio Locale

Segui questi passaggi per avviare il progetto sul tuo computer.

### Prerequisiti

- Node.js installato.
- MySQL Server installato e attivo.

### 1. Configurazione Database

Importa il file `.sql` (dump del database) nel tuo server MySQL locale. Assicurati che il database si chiami `catasto` (o aggiorna il file `.env`).

### 2. Configurazione Backend

```bash
cd backend-catasto
npm install
```

Crea un file `.env` nella cartella `backend-catasto`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=la_tua_password
DB_NAME=catasto
DB_PORT=3306
PORT=3001
```

Avvia il server:

```bash
node server.js
```

### 3. Configurazione Frontend

In un nuovo terminale:

```bash
cd frontend-catasto
npm install
```

_(Nota: Assicurati che `package.json` usi Tailwind v3.4.1 per evitare conflitti)_

Crea un file `.env` nella cartella `frontend-catasto`:

```env
VITE_API_URL=http://localhost:3001
```

Avvia l'interfaccia:

```bash
npm run dev
```

---

## ☁️ Deploy (Messa in Produzione)

Il progetto è configurato per essere hostato gratuitamente utilizzando una combinazione di servizi cloud:

1.  **Database:** TiDB Cloud o Aiven (MySQL Hosting).
2.  **Backend:** Render o Railway (Node.js Hosting).
3.  **Frontend:** Vercel o Netlify (Static Site Hosting).

Assicurati di aggiornare le variabili d'ambiente nei rispettivi pannelli di controllo dei servizi cloud (es. `VITE_API_URL` su Vercel deve puntare all'URL di Render).

---

<div align="center">
<p>Sviluppato con passione per la storia e la tecnologia.</p>
</div>
