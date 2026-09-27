import { defineMessages } from "../../i18n";

export const customAutocompleteMessages = defineMessages({
  it: {
    all: "Tutti",
    placeholder: "Cerca...",
    clearNamed: "Azzera {label}",
    clearSelection: "selezione",
    clear: "Azzera",
    filterAria: "Filtra le opzioni",
    filterPlaceholder: "Filtra lista...",
    noMatch: "Nessuna voce contiene \"{term}\"",
    truncated: "Mostrate {max} voci su {total}: scrivi per restringere.",
  },
  en: {
    all: "All",
    placeholder: "Search...",
    clearNamed: "Clear {label}",
    clearSelection: "selection",
    clear: "Clear",
    filterAria: "Filter the options",
    filterPlaceholder: "Filter list...",
    noMatch: "No entry contains \"{term}\"",
    truncated: "Showing {max} of {total} entries: type to narrow down.",
  },
});
