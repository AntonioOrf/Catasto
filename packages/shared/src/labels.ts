import { FIELD_REGISTRY, NO_VALUE_OPERATORS, OPERATOR_LABELS, getField, type Operator } from "./fields.js";
import type { QueryNode } from "./query-ast.js";
import type { FilterOption } from "./index.js";

/**
 * Etichette dei campi e degli operatori nelle lingue del sito, e descrizione
 * leggibile di una query. Stanno qui e non nel frontend perché servono anche
 * al backend (intestazione degli export). Il registry resta in italiano.
 */

export type Lingua = "it" | "en";

export const FIELD_LABELS_EN: Record<string, string> = {
  nome: "Household name",
  volume: "Volume",
  foglio: "Folio (sheet)",
  fortune: "Fortune",
  credito: "Credit",
  credito_m: "Credit in the Monte",
  imponibile: "Taxable assets",
  deduzioni: "Deductions",
  mestiere: "Occupation",
  bestiame: "Livestock",
  immigrazione: "Immigration",
  rapporto: "Employment relation",
  casa: "House",
  serie: "Series",
  quartiere: "Quarter",
  piviere: "Pieve (rural parish)",
  popolo: "Popolo (parish)",
  particolarita_parente: "Relative's particularity",
  eta_parente: "Relative's age",
  segnatura_portata: "Portata shelfmark",
};

export const OPERATOR_LABELS_EN: Record<Operator, string> = {
  eq: "is equal to",
  neq: "is not equal to",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  gt: "greater than",
  gte: "greater than or equal to",
  lt: "less than",
  lte: "less than or equal to",
  between: "between",
  in: "is one of",
  not_in: "is not one of",
  is_empty: "is empty",
  is_not_empty: "is filled in",
};

export function fieldLabelIn(key: string, lang: Lingua): string {
  if (lang === "en" && FIELD_LABELS_EN[key]) return FIELD_LABELS_EN[key];
  return getField(key)?.label ?? key;
}

export function operatorLabelIn(operator: Operator, lang: Lingua): string {
  return (lang === "en" ? OPERATOR_LABELS_EN : OPERATOR_LABELS)[operator] ?? operator;
}

// Un campo aggiunto al registry senza traduzione deve emergere nei test, non in produzione.
export const MISSING_FIELD_TRANSLATIONS = FIELD_REGISTRY.map((f) => f.key).filter(
  (key) => !(key in FIELD_LABELS_EN),
);

const DESCRIBE_WORDS: Record<Lingua, Record<"all" | "and" | "or" | "not" | "invalid" | "between", string>> = {
  it: {
    all: "tutti i fuochi",
    and: " e ",
    or: " oppure ",
    not: "non ({expr})",
    invalid: "condizione non valida",
    // Congiunzione tra i due estremi di "tra ... e ..."
    between: " e ",
  },
  en: {
    all: "all households",
    and: " and ",
    or: " or ",
    not: "not ({expr})",
    invalid: "invalid condition",
    between: " and ",
  },
};

export type OptionsByKey = Record<string, FilterOption[]>;

/**
 * Traduce l'AST in linguaggio leggibile: "Nome fuoco contiene "Rossi" e non
 * (...)". Le etichette delle opzioni enum vengono da `options` (le risposte
 * di GET /api/filters, già nella lingua giusta); un id senza opzione resta id.
 */
export function describeQuery(node: QueryNode, options: OptionsByKey, lang: Lingua, depth = 0): string {
  const words = DESCRIBE_WORDS[lang];

  if (node.kind === "group") {
    if (node.children.length === 0) return words.all;

    const parts = node.children.map((child) => describeQuery(child, options, lang, depth + 1));
    const joined = parts.join(node.op === "AND" ? words.and : words.or);
    const wrapped = node.children.length > 1 && depth > 0 ? `(${joined})` : joined;

    return node.not ? words.not.replace("{expr}", wrapped) : wrapped;
  }

  const field = getField(node.field);
  if (!field) return words.invalid;

  const label = fieldLabelIn(field.key, lang);
  const operator = operatorLabelIn(node.operator as Operator, lang);
  if (NO_VALUE_OPERATORS.includes(node.operator as Operator)) {
    return `${label} ${operator}`;
  }

  const values = Array.isArray(node.value) ? node.value : [node.value];
  const labels = values.map((value) => {
    if (value === undefined || value === "") return "…";
    if (field.optionsKey) {
      const match = options[field.optionsKey]?.find((o) => String(o.id) === String(value));
      if (match) return `"${match.label}"`;
    }
    return typeof value === "number" ? String(value) : `"${value}"`;
  });

  const valueLabel = node.operator === "between" ? labels.join(words.between) : labels.join(", ");

  return `${label} ${operator} ${valueLabel}`;
}
