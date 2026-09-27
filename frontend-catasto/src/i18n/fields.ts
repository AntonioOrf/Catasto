import { FIELD_REGISTRY, OPERATOR_LABELS, getField, type Operator } from "@catasto/shared";
import { getLang, type Lang } from "./language";

/**
 * Etichette inglesi del registry condiviso: `@catasto/shared` resta in
 * italiano (lo usa anche il backend), la UI sceglie la lingua da qui.
 */
const FIELD_LABELS_EN: Record<string, string> = {
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

const OPERATOR_LABELS_EN: Record<Operator, string> = {
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

export function fieldLabel(key: string, lang: Lang = getLang()): string {
  if (lang === "en" && FIELD_LABELS_EN[key]) return FIELD_LABELS_EN[key];
  return getField(key)?.label ?? key;
}

export function operatorLabel(operator: Operator, lang: Lang = getLang()): string {
  return (lang === "en" ? OPERATOR_LABELS_EN : OPERATOR_LABELS)[operator] ?? operator;
}

// Un campo aggiunto al registry senza traduzione deve emergere nei test, non in produzione.
export const MISSING_FIELD_TRANSLATIONS = FIELD_REGISTRY.map((f) => f.key).filter(
  (key) => !(key in FIELD_LABELS_EN),
);
