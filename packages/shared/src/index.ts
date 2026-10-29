export * from "./fields.js";
export * from "./query-ast.js";
export * from "./segnalazioni.js";
export * from "./segnatura.js";
export * from "./labels.js";

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
  /** Solo nella vista "banco": parenti registrati (bocche) ed età media. */
  bocche?: number;
  eta_media?: number | null;
  /**
   * Id d'archivio del volume della portata, quando la segnatura accettata
   * indica un volume del fondo Catasto digitalizzato: permette di aprire la
   * portata nel visore come il campione.
   */
  codice_archivio_portata?: string | null;
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

/** Misure economiche delle statistiche (GET /api/catasto/stats). */
export const STATS_METRICS = ["fortune", "credito", "credito_m", "imponibile", "deduzioni"] as const;
export type StatsMetric = (typeof STATS_METRICS)[number];

/**
 * Riassunto di una misura. I valori assenti (`assenti`) sono contati a parte
 * e non entrano in somma, media e quantili: assente non vuol dire 0.
 * Con nessun valore presente le misure sono null.
 */
export interface MetricSummary {
  presenti: number;
  assenti: number;
  somma: number | null;
  media: number | null;
  mediana: number | null;
  q1: number | null;
  q3: number | null;
  min: number | null;
  max: number | null;
}

/** Distribuzione per categoria: le prime voci, il resto in `altro`, i non indicati a parte. */
export interface Distribution {
  voci: { label: string; n: number }[];
  altro: number;
  assenti: number;
}

export interface CatastoStats {
  fuochi: number;
  parenti: number;
  economia: Record<StatsMetric, MetricSummary>;
  mestieri: Distribution;
  quartieri: Distribution;
  serie: Distribution;
  /** Numero di fuochi per numero di membri registrati (0 = nessun parente registrato). */
  membri: { membri: number; fuochi: number }[];
  /** Parenti per fascia d'età di 5 anni (`da`, 90 = 90 e oltre) e sesso; età assente a parte. */
  eta: { fasce: { da: number; sesso: string | null; n: number }[]; assenti: number };
  statoCivile: Distribution;
  /** Fuochi per fascia dell'imponibile (`da` = estremo inferiore, vedi IMPONIBILE_BANDS). */
  fasceImponibile: { fasce: { da: number; n: number }[]; assenti: number };
}

/**
 * Fuochi confrontabili insieme (vista di confronto) e tetto di id di
 * GET /api/catasto/fuochi?ids=…, che serve a caricarli in una richiesta.
 */
export const COMPARE_MIN_FUOCHI = 2;
export const COMPARE_MAX_FUOCHI = 5;

/** Fuochi caricabili in una richiesta per id (nomi della selezione). */
export const FUOCHI_BY_IDS_MAX = 50;

/**
 * Fuochi di una selezione o di una raccolta: tetto del parametro `ids` della
 * ricerca e dell'export (GET /api/catasto?ids=…, /api/catasto/export?ids=…).
 */
export const SELECTION_MAX_FUOCHI = 500;

/** Suggerimenti di «Trova e aggiungi» nel Banco di lavoro (GET /api/catasto/suggest). */
export const SUGGEST_LIMIT = 8;

/** Come è stata letta la ricerca: numero del fuoco, carta del campione o parole. */
export type SuggestMode = "id" | "carta" | "testo";

/** Un fuoco suggerito: solo i campi che servono a riconoscerlo. */
export interface SuggestItem {
  id: number;
  nome: string;
  mestiere: string | null;
  quartiere: string | null;
  popolo: string | null;
  imponibile: number | null;
  volume: string | null;
  foglio: string | null;
}

export interface SuggestResponse {
  data: SuggestItem[];
  /** Fuochi che corrispondono in tutto; `data` ne porta al massimo SUGGEST_LIMIT. */
  total: number;
  mode: SuggestMode;
}

/** Fasce dell'imponibile nelle statistiche: estremi inferiori, in fiorini. */
export const IMPONIBILE_BANDS = [0, 1, 51, 201, 501, 1001] as const;
