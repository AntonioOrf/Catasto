import {
  NO_VALUE_OPERATORS,
  getField,
  type FilterOption,
  type Operator,
  type QueryNode,
} from "@catasto/shared";
import { fieldLabel, operatorLabel } from "../../../i18n/fields";
import { getLang, type Lang } from "../../../i18n/language";
import { translate } from "../../../i18n/messages";
import { queryDescribeMessages as messages } from "./query-describe.messages";

export type OptionsByKey = Record<string, FilterOption[]>;

/**
 * Traduce l'AST in linguaggio leggibile (nella lingua attiva). Serve
 * all'anteprima del builder: una query annidata con AND/OR è facile da
 * comporre per sbaglio, e vederla scritta è l'unico modo in cui un utente non
 * tecnico si accorge dell'errore. Le etichette delle opzioni arrivano già
 * tradotte dal backend.
 */
export function describeNode(
  node: QueryNode,
  options: OptionsByKey,
  depth = 0,
  lang: Lang = getLang(),
): string {
  const t = (key: keyof typeof messages.it, vars?: Record<string, string>) =>
    translate(messages, key, vars, lang);

  if (node.kind === "group") {
    if (node.children.length === 0) return t("allHouseholds");

    const parts = node.children.map((child) => describeNode(child, options, depth + 1, lang));
    const joined = parts.join(node.op === "AND" ? t("and") : t("or"));
    const wrapped = node.children.length > 1 && depth > 0 ? `(${joined})` : joined;

    return node.not ? t("not", { expr: wrapped }) : wrapped;
  }

  const field = getField(node.field);
  if (!field) return t("invalidCondition");

  const label = fieldLabel(field.key, lang);
  const operator = operatorLabel(node.operator as Operator, lang);
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

  const valueLabel =
    node.operator === "between" ? labels.join(t("between")) : labels.join(", ");

  return `${label} ${operator} ${valueLabel}`;
}
