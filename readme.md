<div align="center">
  <h1>📜 Catasto Fiorentino 1427</h1>
  <h3>Archivio Digitale e Sistema di Esplorazione</h3>
  <p>Una piattaforma full-stack moderna per esplorare, cercare e analizzare i dati storici del catasto della Repubblica di Firenze.</p>

  <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; margin-bottom: 20px;">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  </div>

  <img src="https://cdn.imgchest.com/files/bab7c9a2309e.png" alt="Screenshot del Progetto" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 100%;" />
</div>

---

## Panoramica del Progetto

Il progetto **Catasto Fiorentino 1427** è un portale digitale progettato per rendere i dati storici del censimento della Firenze del XV secolo accessibili, ricercabili e visivamente accattivanti. Basata sulla monumentale ricerca di Klapisch-Zuber e sugli sforzi di digitalizzazione di [ACRH](https://journals.openedition.org/acrh/7458), questa applicazione offre a studiosi e appassionati di storia un'interfaccia potente per navigare nel tessuto sociale ed economico del Rinascimento.

## Funzionalità Principali

- **Sistema di Ricerca Avanzata**: Filtraggio multi-livello per capofamiglia, località (Quartiere, Popolo, Piviere), professione e stato di immigrazione.
- **Analisi Economica**: Approfondimento sulla ricchezza storica con filtri precisi per _Fortune_, _Credito_, _Imponibile_ e _Deduzioni_.
- **Strutture Familiari**: "Fuochi" (nuclei familiari) esplorabili con elenchi dettagliati di membri, età e relazioni.
- **Visualizzatore di Manoscritti IIIF**: Visualizzatore integrato per i documenti d'archivio originali (Archivio di Stato di Firenze) con funzionalità di zoom e navigazione.
- **Alte Prestazioni**: Costruito come un monorepo TypeScript con paginazione lato server ottimizzata e un frontend Tailwind v4 fulmineo.
- **Interfaccia Elegante**: Un'estetica raffinata "Blue Archive" con supporto completo per la modalità scura e design responsivo.

---

## Stack Tecnologico

### Frontend

- **React 18** con **Vite** per build ottimizzate.
- **TypeScript** per la sicurezza dei tipi e uno sviluppo robusto.
- **Tailwind CSS v4** che utilizza variabili CSS avanzate per la gestione dei temi.
- **Lucide React** per un'iconografia coerente e di alta qualità.

### Backend

- **Node.js** & **Express** che forniscono una robusta API RESTful.
- **TSX/TSUP** per l'esecuzione e il bundling moderno di TypeScript.
- **MySQL** per l'archiviazione di dati relazionali ad alte prestazioni.

### Architettura Monorepo

- **Pacchetto Condiviso**: Tipi e interfacce centralizzati in `@catasto/shared`.
- **Strumentazione Integrata**: Script di sviluppo e build unificati dalla root.

---

## Documentazione

- [Guida Dettagliata Backend](docs/backend.md) - Endpoint API, modelli e logica dei servizi.
- [Documentazione Frontend](docs/frontend.md) - Struttura dei componenti, gestione dello stato e stile.
- [Installazione e Distribuzione](docs/guides.md) - Guida completa alla configurazione e istruzioni Docker.

---

<div align="center">
  <p>Creato con passione per la storia e la tecnologia.</p>
</div>
