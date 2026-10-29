import { defineMessages } from "../i18n/messages";

export const clientMessages = defineMessages({
  it: {
    serverUnreachable: "Il server non risponde. Controlla la connessione e riprova.",
    withStatus: "{message} (errore {status})",
    invalidResponse: "{message} (risposta del server non valida)",
    advancedSearchFailed: "La ricerca avanzata non è riuscita",
    sidebarFailed: "Impossibile caricare l'indice",
    tableFailed: "Il server non ha risposto correttamente",
    parentiFailed: "Impossibile caricare la composizione familiare",
    filtersFailed: "Impossibile caricare le opzioni dei filtri",
    manifestFailed: "Impossibile scaricare le informazioni del volume dall'Archivio di Stato",
    exportFailed: "L'export non è riuscito",
    statsFailed: "Impossibile calcolare le statistiche",
  },
  en: {
    serverUnreachable: "The server is not responding. Check your connection and try again.",
    withStatus: "{message} (error {status})",
    invalidResponse: "{message} (invalid server response)",
    advancedSearchFailed: "The advanced search failed",
    sidebarFailed: "Could not load the index",
    tableFailed: "The server did not respond correctly",
    parentiFailed: "Could not load the household members",
    filtersFailed: "Could not load the filter options",
    manifestFailed: "Could not download the volume information from the State Archives",
    exportFailed: "The export failed",
    statsFailed: "Could not compute the statistics",
  },
});
