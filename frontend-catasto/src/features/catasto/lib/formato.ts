import { LOCALES, getLang, type Lang } from "../../../i18n/language";
import { translate } from "../../../i18n/messages";
import { formatoMessages as messages } from "./formato.messages";

/**
 * Formati di visualizzazione dei dati del fuoco. I dati assenti restano
 * assenti: null e undefined non diventano 0, e 0 resta un valore reale.
 * Numeri e testi seguono la lingua attiva ("1.234" in italiano, "1,234" in inglese).
 */

const numberFormats: Partial<Record<Lang, Intl.NumberFormat>> = {};
const numberFormat = (lang: Lang) => (numberFormats[lang] ??= new Intl.NumberFormat(LOCALES[lang]));

/** Etichetta del dato mancante nella lingua data. */
export const nonIndicato = (lang: Lang = getLang()) => translate(messages, "notStated", undefined, lang);

/** Etichetta italiana del dato mancante (compatibilità): nella UI usare `nonIndicato()`. */
export const NON_INDICATO = messages.it.notStated;

const assente = (value: unknown): value is null | undefined => value === null || value === undefined;

/** Stesso formato ovunque: prima la sintesi usava il locale del browser e il dettaglio nessuno. */
export const fiorini = (value: number | null | undefined, lang: Lang = getLang()) =>
  assente(value)
    ? nonIndicato(lang)
    : translate(messages, "florins", { n: numberFormat(lang).format(value) }, lang);

/** Età del parente: 0 è un neonato, non un dato mancante. */
export const eta = (value: number | null | undefined) => (assente(value) ? "-" : String(value));

/** Piviere e popolo, solo le parti presenti. Stringa vuota se mancano entrambi. */
export const piviereEPopolo = (piviere?: string | null, popolo?: string | null) =>
  [piviere, popolo].filter((part) => part && part.trim()).join(" » ");
