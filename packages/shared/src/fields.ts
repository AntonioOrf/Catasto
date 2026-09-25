/**
 * Registry dei campi interrogabili.
 *
 * Unica whitelist del progetto: il frontend genera la UI del query builder da
 * qui, il backend compila l'SQL da qui. Nessun nome di colonna arriva mai dal
 * client - il client manda solo una `key` presente in questa tabella.
 */

export type FieldType = "text" | "number" | "enum";

export type Operator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty";

/** Etichette italiane usate sia nella UI sia nell'anteprima leggibile della query. */
export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "è uguale a",
  neq: "è diverso da",
  contains: "contiene",
  not_contains: "non contiene",
  starts_with: "inizia con",
  gt: "maggiore di",
  gte: "maggiore o uguale a",
  lt: "minore di",
  lte: "minore o uguale a",
  between: "compreso tra",
  in: "è uno di",
  not_in: "non è uno di",
  is_empty: "è vuoto",
  is_not_empty: "è valorizzato",
};

/** Operatori che non portano valore: la UI non deve mostrare l'input. */
export const NO_VALUE_OPERATORS: readonly Operator[] = ["is_empty", "is_not_empty"];

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** Espressione SQL. Mai concatenata da input utente. */
  column: string;
  /** Alias di join richiesto (`usedTables` di FuocoModel). Assente = tabella base `f`. */
  table?: string;
  operators: readonly Operator[];
  /** Chiave della risposta di GET /api/filters che popola le opzioni enum. */
  optionsKey?: string;
  /**
   * Campo raggiungibile solo via sottoquery su una tabella figlia: la
   * condizione viene incapsulata in un EXISTS invece di richiedere un join.
   */
  existsSubquery?: { from: string; alias: string; on: string };
  /** Il campo può essere oggetto di una segnalazione di errore. */
  reportable?: boolean;
  /** Il campo esiste solo se compilato dalla redazione (vedi fuoco_segnature). */
  editorial?: boolean;
}

const TEXT_OPS: readonly Operator[] = [
  "contains",
  "not_contains",
  "starts_with",
  "eq",
  "neq",
  "is_empty",
  "is_not_empty",
];

const NUMBER_OPS: readonly Operator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "is_empty",
  "is_not_empty",
];

const ENUM_OPS: readonly Operator[] = ["eq", "neq", "in", "not_in", "is_empty", "is_not_empty"];

export const FIELD_REGISTRY: readonly FieldDef[] = [
  // --- Identificazione ---
  { key: "nome", label: "Nome fuoco", type: "text", column: "f.Nome_Fuoco", operators: TEXT_OPS, reportable: true },
  { key: "volume", label: "Volume", type: "text", column: "TRIM(f.Volume_Fuoco)", operators: TEXT_OPS, reportable: true },
  { key: "foglio", label: "Foglio (carta)", type: "text", column: "f.Foglio_Fuoco", operators: TEXT_OPS, reportable: true },

  // --- Dati economici ---
  { key: "fortune", label: "Fortune", type: "number", column: "f.Fortune_Fuoco", operators: NUMBER_OPS, reportable: true },
  { key: "credito", label: "Credito", type: "number", column: "f.Credito_Fuoco", operators: NUMBER_OPS, reportable: true },
  { key: "credito_m", label: "Credito ai Monti", type: "number", column: "f.CreditoM_Fuoco", operators: NUMBER_OPS, reportable: true },
  { key: "imponibile", label: "Imponibile", type: "number", column: "f.Imponibile_Fuoco", operators: NUMBER_OPS, reportable: true },
  { key: "deduzioni", label: "Deduzioni", type: "number", column: "f.Deduzioni_Fuoco", operators: NUMBER_OPS, reportable: true },

  // --- Attributi (id su tabelle di lookup) ---
  { key: "mestiere", label: "Mestiere", type: "enum", column: "f.Mestiere_Fuoco", operators: ENUM_OPS, optionsKey: "mestieri", reportable: true },
  { key: "bestiame", label: "Bestiame", type: "enum", column: "f.Bestiame_Fuoco", operators: ENUM_OPS, optionsKey: "bestiame", reportable: true },
  { key: "immigrazione", label: "Immigrazione", type: "enum", column: "f.Immigrazione_Fuoco", operators: ENUM_OPS, optionsKey: "immigrazione", reportable: true },
  { key: "rapporto", label: "Rapporto mestiere", type: "enum", column: "f.RapportoMestiere_Fuoco", operators: ENUM_OPS, optionsKey: "rapporto", reportable: true },
  { key: "casa", label: "Casa", type: "enum", column: "f.Casa_Fuoco", operators: ENUM_OPS, optionsKey: "casa", reportable: true },

  // --- Geografia (richiedono i join dinamici) ---
  { key: "serie", label: "Serie", type: "enum", column: "tser.id_serie", table: "tser", operators: ENUM_OPS, optionsKey: "serie", reportable: true },
  { key: "quartiere", label: "Quartiere", type: "enum", column: "tq.id_quartiere", table: "tq", operators: ENUM_OPS, optionsKey: "quartieri", reportable: true },
  { key: "piviere", label: "Piviere", type: "enum", column: "tpi.id_piviere", table: "tpi", operators: ENUM_OPS, optionsKey: "pivieri", reportable: true },
  { key: "popolo", label: "Popolo", type: "enum", column: "tp.id_popolo", table: "tp", operators: ENUM_OPS, optionsKey: "popoli", reportable: true },

  // --- Relazioni ---
  {
    key: "particolarita_parente",
    label: "Particolarità parente",
    type: "enum",
    column: "p_sub.Particolarita",
    operators: ENUM_OPS,
    optionsKey: "particolaritaParente",
    existsSubquery: { from: "parenti", alias: "p_sub", on: "p_sub.ID_FUOCO = f.ID_Fuochi" },
  },

  // --- Campi redazionali ---
  {
    key: "segnatura_portata",
    label: "Segnatura della portata",
    type: "text",
    column: "fs.segnatura",
    table: "fs",
    operators: TEXT_OPS,
    reportable: true,
    editorial: true,
  },
];

const FIELD_INDEX: ReadonlyMap<string, FieldDef> = new Map(
  FIELD_REGISTRY.map((f) => [f.key, f]),
);

export function getField(key: string): FieldDef | undefined {
  return FIELD_INDEX.get(key);
}

export function isReportableField(key: string): boolean {
  return getField(key)?.reportable === true;
}

export const REPORTABLE_FIELD_KEYS: readonly string[] = FIELD_REGISTRY.filter(
  (f) => f.reportable,
).map((f) => f.key);
