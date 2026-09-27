import { AST_MAX_DEPTH, type QueryCondition, type QueryGroup, type QueryNode } from "@catasto/shared";

/**
 * Validazione strutturale dell'AST letto da fonti non fidate (URL condiviso,
 * localStorage). Controlla la forma, non la semantica: campi e operatori
 * ammessi li verifica il server. Serve a garantire che il render (pruneAst,
 * describeNode, QueryBuilder) non incontri mai nodi inattesi.
 *
 * La profondità segue astDepth: la radice è il livello 1 e una condizione
 * occupa un livello, come nel controllo del backend.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isScalar = (value: unknown): value is string | number =>
  typeof value === "string" || (typeof value === "number" && Number.isFinite(value));

const isConditionShape = (node: Record<string, unknown>): boolean =>
  node.kind === "condition" &&
  typeof node.field === "string" &&
  typeof node.operator === "string" &&
  (node.value === undefined ||
    isScalar(node.value) ||
    (Array.isArray(node.value) && node.value.every(isScalar)));

const isNodeAt = (value: unknown, level: number): boolean => {
  if (level > AST_MAX_DEPTH || !isObject(value)) return false;
  if (value.kind === "condition") return isConditionShape(value);
  if (value.kind !== "group") return false;
  return (
    (value.op === "AND" || value.op === "OR") &&
    (value.not === undefined || typeof value.not === "boolean") &&
    Array.isArray(value.children) &&
    value.children.every((child) => isNodeAt(child, level + 1))
  );
};

export function isQueryNode(value: unknown): value is QueryNode {
  return isNodeAt(value, 1);
}

export function isQueryCondition(value: unknown): value is QueryCondition {
  return isObject(value) && isConditionShape(value);
}

/** Radice valida: un gruppo con tutto il sottoalbero ben formato. */
export function isQueryGroup(value: unknown): value is QueryGroup {
  return isObject(value) && value.kind === "group" && isNodeAt(value, 1);
}
