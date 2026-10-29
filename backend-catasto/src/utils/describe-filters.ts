import {
  describeQuery,
  type Lingua,
  type OptionsByKey,
  type QueryCondition,
  type QueryGroup,
  type QueryNode,
} from "@catasto/shared";

/**
 * Descrizione leggibile della ricerca semplice, con le stesse parole della
 * ricerca avanzata: i parametri della query string diventano condizioni
 * dell'AST equivalenti e passano da `describeQuery`. Solo per l'intestazione
 * degli export: la ricerca vera la compila `buildQuery`.
 */

const LOCALITA_LABEL: Record<Lingua, string> = { it: "Località contiene", en: "Place contains" };
const IDS_LABEL: Record<Lingua, string> = { it: "fuochi scelti a mano: {n}", en: "hand-picked households: {n}" };

const ENUM_PARAMS = [
  ["mestiere", "mestiere"],
  ["bestiame", "bestiame"],
  ["immigrazione", "immigrazione"],
  ["rapporto", "rapporto"],
  ["casa", "casa"],
  ["serie", "serie"],
  ["quartiere", "quartiere"],
  ["piviere", "piviere"],
  ["popolo", "popolo"],
  ["particolarita_parente", "particolarita_parente"],
] as const;

const RANGE_PARAMS = [
  ["fortune", "fortune"],
  ["credito", "credito"],
  ["creditoM", "credito_m"],
  ["imponibile", "imponibile"],
  ["deduzioni", "deduzioni"],
] as const;

const scalar = (value: unknown): string | undefined =>
  (typeof value === "string" || typeof value === "number") && String(value).trim() !== ""
    ? String(value).trim()
    : undefined;

export function simpleFiltersToAst(filters: Record<string, unknown>): QueryGroup {
  const children: QueryNode[] = [];
  const condition = (field: string, operator: QueryCondition["operator"], value: string | number): QueryCondition => ({
    kind: "condition",
    field,
    operator,
    value,
  });

  const persona = scalar(filters.q_persona);
  if (persona) children.push(condition("nome", "contains", persona));
  const volume = scalar(filters.volume);
  if (volume) children.push(condition("volume", "eq", volume));

  for (const [param, field] of ENUM_PARAMS) {
    const value = scalar(filters[param]);
    if (value) children.push(condition(field, "eq", value));
  }
  for (const [param, field] of RANGE_PARAMS) {
    const min = scalar(filters[`${param}_min`]);
    const max = scalar(filters[`${param}_max`]);
    if (min !== undefined) children.push(condition(field, "gte", Number(min)));
    if (max !== undefined) children.push(condition(field, "lte", Number(max)));
  }
  return { kind: "group", op: "AND", children };
}

export function describeSimpleFilters(filters: Record<string, unknown>, options: OptionsByKey, lang: Lingua): string {
  const ast = simpleFiltersToAst(filters);
  const localita = scalar(filters.q_localita);
  const ids = scalar(filters.ids);
  if (!localita && !ids) return describeQuery(ast, options, lang);
  const rest = ast.children.length > 0 ? describeQuery(ast, options, lang) : "";
  const parts = [
    ids ? IDS_LABEL[lang].replace("{n}", String(ids.split(",").length)) : "",
    localita ? `${LOCALITA_LABEL[lang]} "${localita}"` : "",
    rest,
  ].filter(Boolean);
  return parts.join(lang === "it" ? " e " : " and ");
}
