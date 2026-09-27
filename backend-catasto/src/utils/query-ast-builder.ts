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
import { LIKE_SQL, likePattern, parseIdList } from "./query-builder.js";

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

/**
 * Profondita' dell'input grezzo, calcolata senza ricorsione e interrotta appena
 * supera il limite: lo schema zod ricorsivo, su qualche migliaio di livelli,
 * esaurirebbe lo stack (500) prima che `assertAstLimits` possa rifiutarlo.
 */
export function exceedsAstDepth(input: unknown, maxDepth = AST_MAX_DEPTH): boolean {
  const stack: [unknown, number][] = [[input, 1]];
  while (stack.length > 0) {
    const [node, depth] = stack.pop()!;
    if (depth > maxDepth) return true;
    const children = (node as { children?: unknown } | null)?.children;
    if (typeof node === "object" && Array.isArray(children)) {
      for (const child of children) stack.push([child, depth + 1]);
    }
  }
  return false;
}

const rootSchema = z.object({
  kind: z.literal("group"),
  op: z.enum(["AND", "OR"]),
  not: z.boolean().optional(),
  children: z.array(nodeSchema).max(AST_MAX_CONDITIONS),
});

// La pipe non esegue lo schema ricorsivo se il controllo di profondita' fallisce.
export const astSchema: z.ZodType<QueryGroup> = z
  .unknown()
  .superRefine((input, ctx) => {
    if (exceedsAstDepth(input)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Query troppo annidata (max ${AST_MAX_DEPTH} livelli)`,
      });
    }
  })
  .pipe(rootSchema) as unknown as z.ZodType<QueryGroup>;


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

/**
 * Serie, quartiere, piviere e popolo hanno opzioni da GROUP_CONCAT: le
 * partizioni omonime arrivano come un unico valore "3,7". Confrontato come
 * stringa MySQL lo leggerebbe come 3, quindi va espanso negli id numerici.
 */
const GROUPED_GEO_OPTIONS = new Set(["serie", "quartieri", "pivieri", "popoli"]);

const isGroupedGeo = (field: FieldDef): boolean =>
  field.optionsKey !== undefined && GROUPED_GEO_OPTIONS.has(field.optionsKey);

const groupedIds = (values: unknown[], field: FieldDef, operator: Operator): number[] => {
  const ids = values.flatMap((v) => (typeof v === "number" ? [v] : (parseIdList(v, field.key) ?? [])));
  if (ids.length === 0) {
    throw new ValidationError(`Valore mancante per ${field.key} ${operator}`);
  }
  if (ids.length > AST_MAX_IN_VALUES) {
    throw new ValidationError(`Troppi valori per ${field.key} (max ${AST_MAX_IN_VALUES})`);
  }
  return ids;
};

const inSql = (col: string, count: number, negated: boolean): string => {
  const placeholders = Array(count).fill("?").join(",");
  // NOT IN esclude anche i NULL: stessa semantica di neq / not_in.
  return negated ? `(${col} NOT IN (${placeholders}) OR ${col} IS NULL)` : `${col} IN (${placeholders})`;
};

/**
 * Sui numerici il confronto con '' e' sbagliato: MySQL converte '' in 0, quindi
 * `Eta = ''` e' vero per i neonati e un valore 0 risulterebbe "vuoto".
 */
const isNotEmptySql = (field: FieldDef): string =>
  field.type === "number"
    ? `${field.column} IS NOT NULL`
    : `(${field.column} IS NOT NULL AND ${field.column} <> '')`;

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

  // Una lista di id su eq / neq diventa IN / NOT IN; un id singolo resta com'e'.
  const geoIds =
    isGroupedGeo(field) && (operator === "eq" || operator === "neq")
      ? groupedIds([condition.value], field, operator)
      : undefined;
  if (geoIds && geoIds.length > 1) {
    return { sql: inSql(col, geoIds.length, operator === "neq"), params: geoIds };
  }

  switch (operator) {
    case "eq":
      sql = `${col} = ?`;
      params.push(geoIds ? geoIds[0] : coerceScalar(condition.value, field, operator));
      break;
    case "neq":
      // NULL <> 'x' e' NULL, non TRUE: senza il coalesce le righe vuote
      // sparirebbero da una negazione, che per l'utente e' un bug.
      sql = `(${col} <> ? OR ${col} IS NULL)`;
      params.push(geoIds ? geoIds[0] : coerceScalar(condition.value, field, operator));
      break;
    case "contains":
      sql = `${col} ${LIKE_SQL}`;
      params.push(likePattern(asString(condition.value, field, operator)));
      break;
    case "not_contains":
      sql = `(${col} NOT ${LIKE_SQL} OR ${col} IS NULL)`;
      params.push(likePattern(asString(condition.value, field, operator)));
      break;
    case "starts_with":
      sql = `${col} ${LIKE_SQL}`;
      params.push(likePattern(asString(condition.value, field, operator), "starts_with"));
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
      const raw = asArray(condition.value, field, operator);
      const values = isGroupedGeo(field)
        ? groupedIds(raw, field, operator)
        : raw.map((v) => coerceScalar(v, field, operator));
      sql = inSql(col, values.length, operator === "not_in");
      params.push(...values);
      break;
    }
    case "is_empty":
      sql = field.type === "number" ? `${col} IS NULL` : `(${col} IS NULL OR ${col} = '')`;
      break;
    case "is_not_empty":
      sql = isNotEmptySql(field);
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
      return isNotEmptySql(field);
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
