import type { QueryGroup } from "@catasto/shared";

/**
 * Filtri della ricerca semplice e parametro di query string corrispondente
 * (GET /api/catasto). Unica definizione: stato, reset, conteggi e query
 * string derivano tutti da qui, così un filtro nuovo non può essere
 * dimenticato in uno dei punti che lo usano.
 */
export const SIMPLE_FILTER_PARAMS = {
  searchPersona: "q_persona",
  searchLocalita: "q_localita",
  filterVolume: "volume",
  filterMestiere: "mestiere",
  filterRapporto: "rapporto",
  filterBestiame: "bestiame",
  filterImmigrazione: "immigrazione",
  filterParticolaritaParente: "particolarita_parente",
  filterCasa: "casa",
  filterSerie: "serie",
  filterQuartiere: "quartiere",
  filterPiviere: "piviere",
  filterPopolo: "popolo",
  filterFortuneMin: "fortune_min",
  filterFortuneMax: "fortune_max",
  filterCreditoMin: "credito_min",
  filterCreditoMax: "credito_max",
  filterCreditoMMin: "creditoM_min",
  filterCreditoMMax: "creditoM_max",
  filterImponibileMin: "imponibile_min",
  filterImponibileMax: "imponibile_max",
  filterDeduzioniMin: "deduzioni_min",
  filterDeduzioniMax: "deduzioni_max",
} as const;

export type SimpleFilterKey = keyof typeof SIMPLE_FILTER_PARAMS;
export type SimpleFilters = Record<SimpleFilterKey, string>;

const SIMPLE_FILTER_KEYS = Object.keys(SIMPLE_FILTER_PARAMS) as SimpleFilterKey[];

export const EMPTY_SIMPLE_FILTERS = Object.fromEntries(
  SIMPLE_FILTER_KEYS.map((key) => [key, ""]),
) as SimpleFilters;

/** Filtri della riga sempre visibile; gli altri stanno nel pannello "Altri filtri". */
export const BASE_FILTER_KEYS: readonly SimpleFilterKey[] = [
  "searchPersona",
  "searchLocalita",
  "filterVolume",
];

export const PANEL_FILTER_KEYS = SIMPLE_FILTER_KEYS.filter((key) => !BASE_FILTER_KEYS.includes(key));

/**
 * Gerarchia geografica: cambiare un livello azzera quelli sottostanti, le cui
 * opzioni dipendono dalla selezione superiore.
 */
export const GEO_CASCADE: Partial<Record<SimpleFilterKey, readonly SimpleFilterKey[]>> = {
  filterSerie: ["filterQuartiere", "filterPiviere", "filterPopolo"],
  filterQuartiere: ["filterPiviere", "filterPopolo"],
  filterPiviere: ["filterPopolo"],
};

export const DEFAULT_SORT_BY = "nome";
export const DEFAULT_SORT_ORDER = "ASC";
export type SortOrder = "ASC" | "DESC";

/** Tutto ciò che determina una ricerca: la chiave di cache di tabella e indice. */
export interface SearchParams extends SimpleFilters {
  sortBy: string;
  sortOrder: SortOrder;
  advancedMode: boolean;
  /** AST già ripulito dalle condizioni incomplete. */
  ast: QueryGroup;
}

export const countFilled = (filters: SimpleFilters, keys: readonly SimpleFilterKey[]) =>
  keys.reduce((acc, key) => (filters[key] !== "" ? acc + 1 : acc), 0);

export const buildParams = (search: Partial<SearchParams>): URLSearchParams => {
  const params = new URLSearchParams();

  for (const key of SIMPLE_FILTER_KEYS) {
    const value = search[key];
    if (value) params.append(SIMPLE_FILTER_PARAMS[key], value);
  }

  if (search.sortBy) params.append("sort_by", search.sortBy);
  if (search.sortOrder) params.append("order", search.sortOrder);

  return params;
};
