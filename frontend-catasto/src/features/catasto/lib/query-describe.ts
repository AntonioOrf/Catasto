import {
  NO_VALUE_OPERATORS,
  OPERATOR_LABELS,
  getField,
  type Operator,
  type QueryNode,
} from "@catasto/shared";

export type OptionsByKey = Record<string, { id: string | number; label: string }[]>;

/**
 * Traduce l'AST in italiano leggibile. Serve all'anteprima del builder: una
 * query annidata con AND/OR è facile da comporre per sbaglio, e vederla scritta
 * è l'unico modo in cui un utente non tecnico si accorge dell'errore.
 */
export function describeNode(node: QueryNode, options: OptionsByKey, depth = 0): string {
  if (node.kind === "group") {
    if (node.children.length === 0) return "tutti i fuochi";

    const parts = node.children.map((child) => describeNode(child, options, depth + 1));
    const joined = parts.join(node.op === "AND" ? " e " : " oppure ");
    const wrapped = node.children.length > 1 && depth > 0 ? `(${joined})` : joined;

    return node.not ? `non (${wrapped})` : wrapped;
  }

  const field = getField(node.field);
  if (!field) return "condizione non valida";

  const operatorLabel = OPERATOR_LABELS[node.operator as Operator] ?? node.operator;
  if (NO_VALUE_OPERATORS.includes(node.operator as Operator)) {
    return `${field.label} ${operatorLabel}`;
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

  const valueLabel =
    node.operator === "between" ? labels.join(" e ") : labels.join(", ");

  return `${field.label} ${operatorLabel} ${valueLabel}`;
}
