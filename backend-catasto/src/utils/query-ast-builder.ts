import { z } from "zod";
import {
  AST_MAX_CONDITIONS,
  AST_MAX_DEPTH,
  AST_MAX_IN_VALUES,
  AST_MAX_TEXT_LENGTH,
  astDepth,
  countConditions,
  getField,
  type FieldDef,
  type Operator,
  type QueryCondition,
  type QueryGroup,
  type QueryNode,
} from "@catasto/shared";
import { ValidationError } from "./validation.js";

/**
 * Compila l'AST della ricerca avanzata nello stesso contratto di `buildQuery`
 * ({ conditions, params, usedTables }), cosi' FuocoModel e i suoi join dinamici
 * restano invariati.
 *
 * Regola non negoziabile: dal client arrivano solo `field` (chiave del
 * registry) e valori. Ogni frammento SQL viene dal registry o da questo file, i
 * valori passano esclusivamente per placeholder `?`.
 */

const valueSchema = z.union([z.string().max(AST_MAX_TEXT_LENGTH), z.number().finite()]);

const conditionSchema = z.object({
  kind: z.literal("condition"),
  field: z.string().max(64),
  operator: z.string().max(20),
  value: z.union([valueSchema, z.array(valueSchema).max(AST_MAX_IN_VALUES)]).optional(),
});

// z.lazy + ZodType esplicito: senza l'annotazione TS non riesce a inferire un
// tipo ricorsivo e collassa su `any`.
const nodeSchema: z.ZodType<QueryNode> = z.lazy(() =>
  z.union([
    conditionSchema as unknown as z.ZodType<QueryCondition>,
    z.object({
      kind: z.literal("group"),
      op: z.enum(["AND", "OR"]),
      not: z.boolean().optional(),
      children: z.array(nodeSchema).max(AST_MAX_CONDITIONS),
    }) as unknown as z.ZodType<QueryGroup>,
  ]),
);

export const astSchema: z.ZodType<QueryGroup> = z.object({
  kind: z.literal("group"),
  op: z.enum(["AND", "OR"]),
  not: z.boolean().optional(),
  children: z.array(nodeSchema).max(AST_MAX_CONDITIONS),
}) as unknown as z.ZodType<QueryGroup>;

/** Escape dei metacaratteri LIKE: senza, un `%` dell'utente scansiona l'intera tabella. */
const LIKE_ESCAPE_CHAR = "!";
const escapeLike = (value: string): string =>
  value.replace(/[!%_]/g, (char) => LIKE_ESCAPE_CHAR + char);

const asString = (value: unknown, field: FieldDef, operator: Operator): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new ValidationError(`Valore mancante per ${field.key} ${operator}`);
};

const asNumber = (value: unknown, field: FieldDef, operator: Operator): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`Valore non numerico per ${field.key} ${operator}`);
  }
  return parsed;
};

const asArray = (value: unknown, field: FieldDef, operator: Operator): unknown[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field.key} ${operator} richiede una lista di valori`);
  }
  return value;
};

/**
 * Valore tipizzato secondo il campo. Per gli enum il tipo originale va
 * preservato: gli id di lookup sono INT e passare '4' invece di 4 costringe
 * MySQL a un cast che rende l'indice inutilizzabile.
 */
const coerceScalar = (value: unknown, field: FieldDef, operator: Operator) => {
  if (field.type === "number") return asNumber(value, field, operator);
  if (field.type === "enum" && typeof value === "number") return value;
  return asString(value, field, operator);
};

interface Compiled {
  sql: string;
  params: unknown[];
}

function compileCondition(condition: QueryCondition, usedTables: Set<string>): Compiled {
  const field = getField(condition.field);
  if (!field) {
    throw new ValidationError(`Campo non riconosciuto: ${condition.field}`);
  }

  const operator = condition.operator as Operator;
  if (!field.operators.includes(operator)) {
    throw new ValidationError(`Operatore ${operator} non ammesso su ${field.key}`);
  }

  // Un campo in sottoquery non richiede il join sulla query esterna.
  if (field.table && !field.existsSubquery) usedTables.add(field.table);

  const col = field.column;
  const params: unknown[] = [];
  let sql: string;

  switch (operator) {
    case "eq":
      sql = `${col} = ?`;
      params.push(coerceScalar(condition.value, field, operator));
      break;
    case "neq":
      // NULL <> 'x' e' NULL, non TRUE: senza il coalesce le righe vuote
      // sparirebbero da una negazione, che per l'utente e' un bug.
      sql = `(${col} <> ? OR ${col} IS NULL)`;
      params.push(coerceScalar(condition.value, field, operator));
      break;
    case "contains":
      sql = `${col} LIKE ? ESCAPE '${LIKE_ESCAPE_CHAR}'`;
      params.push(`%${escapeLike(asString(condition.value, field, operator))}%`);
      break;
    case "not_contains":
      sql = `(${col} NOT LIKE ? ESCAPE '${LIKE_ESCAPE_CHAR}' OR ${col} IS NULL)`;
      params.push(`%${escapeLike(asString(condition.value, field, operator))}%`);
      break;
    case "starts_with":
      sql = `${col} LIKE ? ESCAPE '${LIKE_ESCAPE_CHAR}'`;
      params.push(`${escapeLike(asString(condition.value, field, operator))}%`);
      break;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const sqlOperator = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[operator];
      sql = `${col} ${sqlOperator} ?`;
      params.push(asNumber(condition.value, field, operator));
      break;
    }
    case "between": {
      const [min, max] = asArray(condition.value, field, operator);
      sql = `${col} BETWEEN ? AND ?`;
      params.push(asNumber(min, field, operator), asNumber(max, field, operator));
      break;
    }
    case "in":
    case "not_in": {
      const values = asArray(condition.value, field, operator).map((v) =>
        coerceScalar(v, field, operator),
      );
      const placeholders = values.map(() => "?").join(",");
      sql =
        operator === "in"
          ? `${col} IN (${placeholders})`
          : `(${col} NOT IN (${placeholders}) OR ${col} IS NULL)`;
      params.push(...values);
      break;
    }
    case "is_empty":
      sql = `(${col} IS NULL OR ${col} = '')`;
      break;
    case "is_not_empty":
      sql = `(${col} IS NOT NULL AND ${col} <> '')`;
      break;
    default:
      throw new ValidationError(`Operatore non supportato: ${operator}`);
  }

  if (field.existsSubquery) {
    const { from, alias, on } = field.existsSubquery;
    // is_empty su una relazione significa "nessuna riga figlia che soddisfa",
    // quindi la negazione va fuori dall'EXISTS.
    const negated = operator === "is_empty" || operator === "neq" || operator === "not_in";
    const inner = negated ? buildPositiveInner(condition, field) : sql;
    const exists = `EXISTS (SELECT 1 FROM ${from} ${alias} WHERE ${on} AND ${inner})`;
    return { sql: negated ? `NOT ${exists}` : exists, params };
  }

  return { sql, params };
}

/**
 * Per gli operatori negativi su una relazione serve la forma positiva della
 * condizione dentro l'EXISTS (`NOT EXISTS(... = ?)`), non la negazione dentro.
 */
function buildPositiveInner(condition: QueryCondition, field: FieldDef): string {
  switch (condition.operator) {
    case "neq":
      return `${field.column} = ?`;
    case "not_in": {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value];
      return `${field.column} IN (${values.map(() => "?").join(",")})`;
    }
    default:
      return `(${field.column} IS NOT NULL AND ${field.column} <> '')`;
  }
}

function compileNode(node: QueryNode, usedTables: Set<string>): Compiled {
  if (node.kind === "condition") return compileCondition(node, usedTables);

  const compiled = node.children.map((child) => compileNode(child, usedTables));
  if (compiled.length === 0) return { sql: "1=1", params: [] };

  const joined = compiled.map((c) => c.sql).join(` ${node.op} `);
  const params = compiled.flatMap((c) => c.params);
  const sql = compiled.length === 1 ? joined : `(${joined})`;

  return { sql: node.not ? `NOT (${sql})` : sql, params };
}

/** Limiti strutturali: rifiutiamo, non tronchiamo, per non eseguire una query diversa da quella chiesta. */
export function assertAstLimits(ast: QueryGroup): void {
  if (astDepth(ast) > AST_MAX_DEPTH) {
    throw new ValidationError(`Query troppo annidata (max ${AST_MAX_DEPTH} livelli)`);
  }
  if (countConditions(ast) > AST_MAX_CONDITIONS) {
    throw new ValidationError(`Troppe condizioni (max ${AST_MAX_CONDITIONS})`);
  }
}

export function buildQueryFromAst(ast: QueryGroup) {
  assertAstLimits(ast);

  const usedTables = new Set<string>(["f"]);
  const { sql, params } = compileNode(ast, usedTables);

  return { conditions: `WHERE ${sql}`, params, usedTables };
}
