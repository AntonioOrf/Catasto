import type { Operator } from "./fields.js";

/**
 * AST serializzabile della ricerca avanzata.
 *
 * Viaggia come JSON nel body di POST /api/catasto/query, nel localStorage dei
 * preset e nel fragment dell'URL condiviso: ogni modifica alla forma richiede
 * un bump di SAVED_QUERIES_STORAGE_KEY.
 */

export type QueryValue = string | number;

export interface QueryCondition {
  kind: "condition";
  field: string;
  operator: Operator;
  /** Assente per is_empty/is_not_empty; array per in/not_in/between. */
  value?: QueryValue | QueryValue[];
}

export interface QueryGroup {
  kind: "group";
  op: "AND" | "OR";
  not?: boolean;
  children: QueryNode[];
}

export type QueryNode = QueryGroup | QueryCondition;

/** Limiti anti-abuso: una query oltre questi valori è rifiutata, non troncata. */
export const AST_MAX_DEPTH = 5;
export const AST_MAX_CONDITIONS = 50;
export const AST_MAX_IN_VALUES = 100;
export const AST_MAX_TEXT_LENGTH = 200;

export const emptyGroup = (op: "AND" | "OR" = "AND"): QueryGroup => ({
  kind: "group",
  op,
  children: [],
});

export function isGroup(node: QueryNode): node is QueryGroup {
  return node.kind === "group";
}

export function countConditions(node: QueryNode): number {
  return isGroup(node) ? node.children.reduce((n, c) => n + countConditions(c), 0) : 1;
}

export function astDepth(node: QueryNode): number {
  if (!isGroup(node) || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(astDepth));
}

/** Un gruppo senza condizioni compila a `1=1`: equivale a nessun filtro. */
export function isAstEmpty(node: QueryNode): boolean {
  return countConditions(node) === 0;
}

export interface SavedQuery {
  id: string;
  nome: string;
  ast: QueryGroup;
  createdAt: string;
}
