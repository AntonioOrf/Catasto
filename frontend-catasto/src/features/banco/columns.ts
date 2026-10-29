import { FIELD_REGISTRY, type Fuoco, type StatsMetric } from "@catasto/shared";

/**
 * Colonne del Banco di lavoro. L'elenco viene dal registro dei campi di
 * `@catasto/shared` (gli stessi della ricerca avanzata), più quattro colonne
 * derivate: il riferimento al campione (volume e carta insieme), la località
 * (quartiere » popolo), le bocche e l'età media, che arrivano dalla vista
 * "banco" del backend. I campi dei parenti (età, particolarità) restano
 * filtri: per fuoco non hanno un valore solo.
 *
 * La scelta (ordine e colonne spente) si ricorda sul dispositivo.
 */
export const COLUMNS_STORAGE_KEY = "catasto.banco.colonne.v1";

export type ColumnKind = "text" | "number" | "ref";

export interface ColumnDef {
  key: string;
  kind: ColumnKind;
  /** Proprietà del fuoco mostrata (assente per le colonne composte). */
  prop?: keyof Fuoco;
  /** Chiave di ordinamento del backend (`sort_by`); assente = non ordinabile. */
  sortKey?: string;
  /** Misura delle statistiche per media e mediana in fondo alla tabella. */
  metric?: StatsMetric | "bocche";
  /** Accesa senza scelte dell'utente. */
  defaultVisible: boolean;
}

/** Campo del registro → proprietà del fuoco nella risposta della ricerca. */
const REGISTRY_PROPS: Record<string, keyof Fuoco> = {
  nome: "nome",
  fortune: "fortune",
  credito: "credito",
  credito_m: "credito_m",
  imponibile: "imponibile",
  deduzioni: "deduzioni",
  mestiere: "mestiere",
  bestiame: "bestiame",
  immigrazione: "immigrazione",
  rapporto: "rapporto_mestiere",
  casa: "casa",
  serie: "serie",
  quartiere: "quartiere",
  piviere: "piviere",
  popolo: "popolo",
  segnatura_portata: "segnatura_portata",
};

const SORT_KEYS: Record<string, string> = {
  nome: "nome",
  fortune: "fortune",
  credito: "credito",
  credito_m: "creditoM",
  imponibile: "imponibile",
  deduzioni: "deduzioni",
  localita: "localita",
};

const METRICS: Record<string, StatsMetric> = {
  fortune: "fortune",
  credito: "credito",
  credito_m: "credito_m",
  imponibile: "imponibile",
  deduzioni: "deduzioni",
};

/** Ordine e visibilità di partenza, come nel mockup del Banco. */
const DEFAULT_ORDER = ["nome", "mestiere", "localita", "imponibile", "fortune", "bocche", "campione"];

const fromRegistry: ColumnDef[] = FIELD_REGISTRY.filter((f) => REGISTRY_PROPS[f.key]).map((f) => ({
  key: f.key,
  kind: f.type === "number" ? "number" : "text",
  prop: REGISTRY_PROPS[f.key],
  sortKey: SORT_KEYS[f.key],
  metric: METRICS[f.key],
  defaultVisible: DEFAULT_ORDER.includes(f.key),
}));

const derived: ColumnDef[] = [
  { key: "localita", kind: "text", sortKey: "localita", defaultVisible: true },
  { key: "bocche", kind: "number", prop: "bocche", metric: "bocche", defaultVisible: true },
  { key: "eta_media", kind: "number", prop: "eta_media", defaultVisible: false },
  { key: "campione", kind: "ref", defaultVisible: true },
];

const byDefaultOrder = (a: ColumnDef, b: ColumnDef) => {
  const ia = DEFAULT_ORDER.indexOf(a.key);
  const ib = DEFAULT_ORDER.indexOf(b.key);
  return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
};

export const COLUMNS: readonly ColumnDef[] = [...fromRegistry, ...derived].sort(byDefaultOrder);
const COLUMN_INDEX = new Map(COLUMNS.map((c) => [c.key, c]));

/** Il nome del capofamiglia identifica la riga: non si spegne. */
export const LOCKED_COLUMN = "nome";

export interface ColumnsState {
  order: string[];
  hidden: string[];
}

export const defaultColumns = (): ColumnsState => ({
  order: COLUMNS.map((c) => c.key),
  hidden: COLUMNS.filter((c) => !c.defaultVisible).map((c) => c.key),
});

/**
 * Stato letto dal dispositivo, ripulito: chiavi sconosciute fuori, colonne
 * nuove (aggiunte al registro dopo il salvataggio) in coda con la loro
 * visibilità di partenza, il nome sempre acceso.
 */
export function normalizeColumns(value: unknown): ColumnsState {
  if (typeof value !== "object" || value === null) return defaultColumns();
  const v = value as Record<string, unknown>;
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((k): k is string => typeof k === "string" && COLUMN_INDEX.has(k)) : []);
  const order = [...new Set(strings(v.order))];
  const added = COLUMNS.filter((c) => !order.includes(c.key));
  const hidden = new Set(strings(v.hidden));
  for (const c of added) if (!c.defaultVisible) hidden.add(c.key);
  hidden.delete(LOCKED_COLUMN);
  return { order: [...order, ...added.map((c) => c.key)], hidden: [...hidden] };
}

export function loadColumns(): ColumnsState {
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    return raw ? normalizeColumns(JSON.parse(raw)) : defaultColumns();
  } catch {
    return defaultColumns();
  }
}

export function storeColumns(state: ColumnsState): void {
  try {
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // scelta non ricordata: vale finché la pagina è aperta
  }
}

export function resetColumns(): ColumnsState {
  try {
    localStorage.removeItem(COLUMNS_STORAGE_KEY);
  } catch {
    // niente da togliere
  }
  return defaultColumns();
}

export function toggleColumn(state: ColumnsState, key: string): ColumnsState {
  if (key === LOCKED_COLUMN || !COLUMN_INDEX.has(key)) return state;
  const hidden = state.hidden.includes(key) ? state.hidden.filter((k) => k !== key) : [...state.hidden, key];
  return { ...state, hidden };
}

/** Sposta la colonna alla posizione `to` (trascinamento, o ±1 da tastiera). */
export function moveColumn(state: ColumnsState, key: string, to: number): ColumnsState {
  const from = state.order.indexOf(key);
  if (from === -1) return state;
  const target = Math.max(0, Math.min(state.order.length - 1, to));
  if (target === from) return state;
  const order = state.order.filter((k) => k !== key);
  order.splice(target, 0, key);
  return { ...state, order };
}

export const visibleColumns = (state: ColumnsState): ColumnDef[] =>
  state.order.filter((k) => !state.hidden.includes(k)).flatMap((k) => COLUMN_INDEX.get(k) ?? []);

export const getColumn = (key: string) => COLUMN_INDEX.get(key);
