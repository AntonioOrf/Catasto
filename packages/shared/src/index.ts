export * from "./fields.js";
export * from "./query-ast.js";
export * from "./segnalazioni.js";

export interface Fuoco {
  id: number;
  nome: string;
  imponibile: number;
  credito: number;
  credito_m: number;
  fortune: number;
  deduzioni: number;
  volume: string;
  foglio: string;
  particolarita_fuoco?: string;
  bestiame?: string;
  immigrazione?: string;
  rapporto_mestiere?: string;
  mestiere?: string;
  casa?: string;
  quartiere?: string;
  popolo?: string;
  piviere?: string;
  serie?: string;
  codice_archivio?: string;
  /**
   * Dato redazionale assente nel dump dell'Archivio: valorizzato solo dalle
   * segnalazioni accettate, quindi null per la grande maggioranza dei fuochi.
   * La UI non deve mostrare nulla quando manca.
   */
  segnatura_portata?: string | null;
}

export interface SidebarItem {
  id: number;
  nome: string;
  mestiere: string;
}

export interface Parenti {
  eta: number;
  parentela_desc: string;
  sesso: string;
  stato_civile: string;
  particolarita: string;
}

/**
 * Carta di un volume digitalizzato, proiettata dal manifest IIIF
 * dell'Archivio (GET /api/catasto/manifest/:id). `image` è sempre https.
 */
export interface IiifPage {
  label: string;
  image: string;
}

/** Opzione di un filtro enum (GET /api/filters): gli id raggruppati sono separati da virgola. */
export interface FilterOption {
  id: string | number;
  label: string;
}

// `type` e non `interface`: così resta assegnabile a Record<string, FilterOption[]>.
export type FilterOptions = {
  bestiame: FilterOption[];
  rapporto: FilterOption[];
  immigrazione: FilterOption[];
  mestieri: FilterOption[];
  serie: FilterOption[];
  quartieri: FilterOption[];
  pivieri: FilterOption[];
  popoli: FilterOption[];
  particolaritaParente: FilterOption[];
  casa: FilterOption[];
};

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  error?: string;
}
