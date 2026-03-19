# Documentazione Frontend

Questo documento descrive l'architettura frontend, la struttura dei componenti e la gestione dello stato dell'applicazione Catasto.

## Panoramica

Il frontend è una **Single Page Application (SPA)** costruita con **React** e **Vite**, stilizzata con **Tailwind CSS**. Fornisce un'interfaccia interattiva per esplorare, filtrare e analizzare i dati storici del censimento.

## Architettura

L'applicazione enfatizza la **Separazione delle Responsabilità (SoC)**:

- **Livello API**: `src/api` gestisce tutte le comunicazioni HTTP.
- **Stato/Logica**: `src/hooks` incapsula la logica di business e la gestione dello stato.
- **Componenti UI**: `src/components` e `src/pages` si concentrano sulla presentazione.

### Struttura delle Directory (`src/`)

- **`api/`**: Client API e funzioni di servizio.
  - `client.js`: Wrapper Axios (o fetch) con configurazione base.
  - `catastoService.js`: Chiamate specifiche per i dati del censimento.
- **`components/`**: Elementi UI riutilizzabili.
  - `catasto/`: Componenti specifici del dominio (`CatastoTable`, `FilterPanel`, `CatastoRow`).
  - `common/`: Componenti UI generici (Loader, Pulsanti).
  - `layout/`: Componenti strutturali dell'app (`Sidebar`, `Header`).
- **`hooks/`**: Custom hooks React.
  - `useCatastoData`: Gestisce il recupero dati, stati di caricamento e paginazione.
  - `useCatastoFilters`: Centralizza lo stato dei filtri e la logica di ordinamento.
  - `useCatastoSidebar`: Gestisce i dati e lo stato specifici della sidebar.
- **`pages/`**: Componenti vista principali.
  - `HomePage.jsx`: La dashboard principale che compone tutti i sotto-componenti.

## Componenti Chiave

### `HomePage`

Il componente contenitore che orchestra i sotto-componenti specifici. Inizializza gli hook `useCatasto...` e passa lo stato ai figli.

### `CatastoTable` & `CatastoRow`

Renderizza la griglia dati principale. `CatastoRow` gestisce la funzionalità "espandi" per mostrare i dettagli familiari nidificati (`Parenti`) per uno specifico nucleo.

### `FilterPanel`

Un componente form complesso che permette agli utenti di inserire vari criteri di ricerca. Aggiorna lo stato centrale dei filtri, attivando l'aggiornamento dei dati.

### `Sidebar`

Mostra una lista navigabile di risultati o statistiche aggregate, permettendo agli utenti di saltare rapidamente a record specifici.

## Gestione dello Stato

Lo stato è gestito principalmente tramite **React Context** o **Custom Hooks** per evitare il prop-drilling dove possibile, anche se l'implementazione attuale si basa molto sulla composizione di hook in `HomePage`.

- **Filtri**: Memorizzati come un singolo oggetto (o stati individuali) in `useCatastoFilters`, sincronizzati con i parametri delle richieste API.
- **Dati**: Recuperati e memorizzati in `useCatastoData`, inclusi i metadati di paginazione.

## Stile

Lo stile è gestito da **Tailwind CSS**.

- **Tema**: Colori personalizzati e breakpoint sono definiti in `tailwind.config.js`.
- **Design Responsivo**: L'approccio Mobile-first è migliorato, anche se la vista tabellare complessa è ottimizzata per desktop/tablet.

## Configurazione

Le variabili d'ambiente sono usate per le connessioni API.

### `.env`

```env
VITE_API_URL=http://localhost:3001
```
