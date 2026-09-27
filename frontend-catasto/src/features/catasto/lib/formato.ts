/**
 * Formati di visualizzazione dei dati del fuoco. I dati assenti restano
 * assenti: null e undefined non diventano 0, e 0 resta un valore reale.
 */

const numberFormat = new Intl.NumberFormat("it-IT");

export const NON_INDICATO = "Non indicato";

const assente = (value: unknown): value is null | undefined => value === null || value === undefined;

/** Stesso formato ovunque: prima la sintesi usava il locale del browser e il dettaglio nessuno. */
export const fiorini = (value: number | null | undefined) =>
  assente(value) ? NON_INDICATO : `${numberFormat.format(value)} fiorini`;

/** Età del parente: 0 è un neonato, non un dato mancante. */
export const eta = (value: number | null | undefined) => (assente(value) ? "-" : String(value));

/** Piviere e popolo, solo le parti presenti. Stringa vuota se mancano entrambi. */
export const piviereEPopolo = (piviere?: string | null, popolo?: string | null) =>
  [piviere, popolo].filter((part) => part && part.trim()).join(" » ");
