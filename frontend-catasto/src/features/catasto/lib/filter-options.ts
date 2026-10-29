import type { FilterOptions } from "@catasto/shared";

/** Opzioni dei filtri prima che arrivi la risposta di GET /api/filters. */
export const EMPTY_FILTER_OPTIONS: FilterOptions = {
  bestiame: [],
  rapporto: [],
  immigrazione: [],
  mestieri: [],
  serie: [],
  quartieri: [],
  pivieri: [],
  popoli: [],
  particolaritaParente: [],
  casa: [],
};
