# Documentazione Frontend Catasto

Questa documentazione fornisce una panoramica dettagliata dell'architettura frontend del progetto "Catasto". Il frontend è sviluppato utilizzando **React** con **Vite** come build tool.

## Indice

1. [Capitolo 1: Panoramica e Architettura](#capitolo-1-panoramica-e-architettura)
2. [Capitolo 2: Struttura delle Directory](#capitolo-2-struttura-delle-directory)
3. [Capitolo 3: Layer API](#capitolo-3-layer-api)
4. [Capitolo 4: Gestione dello Stato e Hooks](#capitolo-4-gestione-dello-stato-e-hooks)
5. [Capitolo 5: Componenti](#capitolo-5-componenti)
6. [Capitolo 6: Entry Point e Configurazione](#capitolo-6-entry-point-e-configurazione)

---

## Capitolo 1: Panoramica e Architettura

L'applicazione segue un'architettura **Single Page Application (SPA)** standard basata su React. L'obiettivo principale è visualizzare, filtrare ed esplorare i dati del Catasto.

Il design pattern principale utilizzato è la **Separation of Concerns (SoC)**:

- **API Logic**: Separata in servizi dedicati (`src/api`).
- **Business Logic & State**: Incapsulata in Custom Hooks (`src/hooks`).
- **UI Presentation**: Gestita tramite componenti funzionali React (`src/components`, `src/pages`).

---

## Capitolo 2: Struttura delle Directory

La cartella `src` è organizzata come segue:

- **`api/`**: Contiene le funzioni per effettuare chiamate HTTP al backend.
- **`assets/`**: Risorse statiche come immagini o icone globali.
- **`components/`**: Componenti React riutilizzabili.
  - `catasto/`: Componenti specifici per la logica di business del catasto (tabella, filtri).
  - `common/`: Componenti generici (es. Spinner).
  - `layout/`: Componenti strutturali (Header, Sidebar).
- **`hooks/`**: Custom hooks per condividere la logica stateful tra i componenti.
- **`pages/`**: Componenti "Pagina" che rappresentano intere viste (es. `HomePage`).
- **`utils/`**: Funzioni di utilità e costanti.

---

## Capitolo 3: Layer API

La comunicazione con il backend è centralizzata nella cartella `src/api`.

### 3.1 `client.js`

File base per la configurazione delle richieste.

- Espone `API_URL` (configurabile tramite `.env`).
- Contiene `buildParams(filters)`: una funzione cruciale che trasforma l'oggetto di stato dei filtri del frontend in `URLSearchParams` compatibili con l'API del backend. Mappa chiavi come `searchPersona` in query string come `q_persona`.

### 3.2 `catastoService.js`

Contiene le chiamate specifiche:

- `fetchCatastoData(filters, page, limit)`: Recupera i dati tabellari paginati.
- `fetchSidebarData(filters)`: Recupera i dati aggregati per la sidebar.
- `fetchParentiData(idFuoco)`: Recupera i membri della famiglia (parenti) per un dato "Fuoco" (nucleo familiare).

---

## Capitolo 4: Gestione dello Stato e Hooks

La logica complessa è spostata fuori dai componenti visuali e dentro i Custom Hooks in `src/hooks`.

### 4.1 `useCatastoData`

Gestisce il ciclo di vita dei dati principali.

- **Stato**: Mantiene l'array dei dati (`data`), stato di caricamento (`loading`), errori, paginazione (`page`, `totalPages`) e gestione dell'espansione righe (`expandedId`, `parentiData`).
- **Effetti**: Reagisce ai cambiamenti dei filtri o della pagina per lanciare `fetchCatastoData`.
- **Debounce**: Implementa un ritardo (es. 500ms) per evitare chiamate API eccessive durante la digitazione.

### 4.2 `useCatastoFilters`

Centralizza lo stato di tutti i filtri.

- Gestisce `useState` per ogni campo di input (nome, località, mestiere, range numerici, ecc.).
- Gestisce lo stato e la logica di **ordinamento** (`sortBy`, `sortOrder`) tramite `handleSort`.
- Restituisce tutti gli stati e i setter, permettendo a qualsiasi componente (come `FilterPanel`) di agire sui filtri globali.

### 4.3 `useCatastoSidebar`

Hook specializzato per la sidebar.

- Recupera i dati aggregati separatamente dai dati della tabella principale.
- Reagisce agli stessi filtri per aggiornare i grafici/statistiche nella sidebar in modo coerente con la tabella.

---

## Capitolo 5: Componenti

### 5.1 `pages/HomePage.jsx`

Il componente "Container" principale.

- Orchestra tutto: invoca gli hook `useCatastoFilters` e `useCatastoData`.
- Passa lo stato e le funzioni callback ai componenti figli (`Header`, `Sidebar`, `FilterPanel`, `CatastoTable`).
- Non contiene logica di business diretta, ma collega i pezzi.

### 5.2 `components/catasto/`

- **`CatastoTable.jsx`**: Renderizza la griglia dei dati. Itera sull'array `data` e crea le righe.
- **`CatastoRow.jsx`**: Renderizza una singola riga. Gestisce il click per espandere/collassare i dettagli e mostra la sotto-tabella dei "parenti" se espansa.
- **`FilterPanel.jsx`**: Un modulo complesso contenente tutti gli input form per i filtri. Riceve i setter degli stati dei filtri.
- **`Pagination.jsx`**: Componente UI per navigare tra le pagine.

### 5.3 `components/layout/`

- **`Sidebar.jsx`**: Mostra statistiche o link di navigazione laterale.
- **`Header.jsx`**: Barra di navigazione superiore, contiene il titolo e interruttori globali (es. tema scuro, se presente).

---

## Capitolo 6: Entry Point e Configurazione

### `src/main.jsx`

Punto di ingresso di React. Monta l'albero dei componenti nel DOM (`root`) e wrappa l'app in eventuali Provider globali (es. `React.StrictMode`).

### `src/App.jsx`

Componente radice. Attualmente renderizza `HomePage`. In futuro, qui verrebbe configurato il Router (es. `react-router-dom`) se l'applicazione dovesse avere più viste distinte.

### `src/utils/constants.js`

Contiene costanti statiche, come le opzioni per i menu a tendina (liste di mestieri comuni, tipologie di bestiame) per evitare valori hardcoded sparsi nel codice.
