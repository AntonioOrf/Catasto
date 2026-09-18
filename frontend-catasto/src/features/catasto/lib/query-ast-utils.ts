import { NO_VALUE_OPERATORS, type Operator, type QueryGroup, type QueryNode } from "@catasto/shared";

/**
 * Rimuove dall'AST le condizioni ancora incomplete.
 *
 * Il builder è uno stato di editing: mentre l'utente sceglie il campo e prima
 * di digitare il valore la condizione esiste ma non è interrogabile. Inviarla
 * produrrebbe un 400 a ogni carattere. Qui l'albero di editing viene separato
 * dall'albero eseguibile: si filtra, non si blocca la digitazione.
 */
const isComplete = (node: QueryNode): boolean => {
  if (node.kind === "group") return true;

  if (NO_VALUE_OPERATORS.includes(node.operator as Operator)) return true;

  const { value, operator } = node;

  if (operator === "between") {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((v) => v !== "" && v !== undefined && v !== null)
    );
  }

  if (operator === "in" || operator === "not_in") {
    return Array.isArray(value) && value.length > 0;
  }

  return value !== "" && value !== undefined && value !== null;
};

export function pruneAst(group: QueryGroup): QueryGroup {
  const children = group.children
    .map((child) => (child.kind === "group" ? pruneAst(child) : child))
    .filter((child) =>
      child.kind === "group" ? child.children.length > 0 : isComplete(child),
    );

  return { ...group, children };
}
