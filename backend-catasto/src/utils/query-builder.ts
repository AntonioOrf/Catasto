import { AST_MAX_IN_VALUES, AST_MAX_TEXT_LENGTH } from "@catasto/shared";
import { ValidationError } from "./validation.js";

export interface QueryFilters {
  q_persona?: string;
  q_localita?: string;
  mestiere?: string;
  bestiame?: string;
  immigrazione?: string;
  rapporto?: string;
  volume?: string;
  fortune_min?: string | number;
  fortune_max?: string | number;
  credito_min?: string | number;
  credito_max?: string | number;
  creditoM_min?: string | number;
  creditoM_max?: string | number;
  imponibile_min?: string | number;
  imponibile_max?: string | number;
  deduzioni_min?: string | number;
  deduzioni_max?: string | number;
  serie?: string;
  quartiere?: string;
  piviere?: string;
  popolo?: string;
  particolarita_parente?: string;
  casa?: string;
}

/** Metacaratteri LIKE: senza escape un `%` o `_` dell'utente diventa un jolly. */
export const LIKE_ESCAPE_CHAR = "!";
export const escapeLike = (value: string): string =>
  value.replace(/[!%_]/g, (char) => LIKE_ESCAPE_CHAR + char);

const MAX_TEXT_LENGTH = AST_MAX_TEXT_LENGTH;
const MAX_IDS = AST_MAX_IN_VALUES;

/**
 * I filtri arrivano da `req.query`, che con il parser `qs` di Express puo'
 * contenere array e oggetti (`?mestiere[]=1&mestiere[]=2`). Accettiamo solo
 * scalari: qualunque altra forma e' un input costruito a mano e va rifiutata,
 * non passata a mysql2 dove produrrebbe SQL malformato.
 */
const text = (value: unknown, name: string): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ValidationError(`Parametro ${name} non valido`);
  }
  const str = String(value).trim();
  if (str.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`Parametro ${name} troppo lungo (max ${MAX_TEXT_LENGTH})`);
  }
  return str === "" ? undefined : str;
};

const num = (value: unknown, name: string): number | undefined => {
  const str = text(value, name);
  if (str === undefined) return undefined;
  const parsed = Number(str);
  if (!Number.isFinite(parsed)) throw new ValidationError(`Parametro ${name} non numerico`);
  return parsed;
};

/** Lista di id separati da virgola, come la producono i GROUP_CONCAT di /api/filters. */
const ids = (value: unknown, name: string): number[] | undefined => {
  const str = text(value, name);
  if (str === undefined) return undefined;
  const parts = str.split(",").map((p) => p.trim());
  if (parts.length > MAX_IDS || parts.some((p) => !/^\d+$/.test(p))) {
    throw new ValidationError(`Parametro ${name} non valido`);
  }
  return parts.map(Number);
};

const like = (value: string) => `%${escapeLike(value)}%`;
const LIKE = `LIKE ? ESCAPE '${LIKE_ESCAPE_CHAR}'`;

const EQUALITY_FILTERS = [
  ["mestiere", "f.Mestiere_Fuoco"],
  ["bestiame", "f.Bestiame_Fuoco"],
  ["immigrazione", "f.Immigrazione_Fuoco"],
  ["rapporto", "f.RapportoMestiere_Fuoco"],
  ["casa", "f.Casa_Fuoco"],
] as const;

const RANGE_FILTERS = [
  ["fortune", "f.Fortune_Fuoco"],
  ["credito", "f.Credito_Fuoco"],
  ["creditoM", "f.CreditoM_Fuoco"],
  ["imponibile", "f.Imponibile_Fuoco"],
  ["deduzioni", "f.Deduzioni_Fuoco"],
] as const;

const GEO_FILTERS = [
  ["serie", "tser", "tser.id_serie"],
  ["quartiere", "tq", "tq.id_quartiere"],
  ["piviere", "tpi", "tpi.id_piviere"],
  ["popolo", "tp", "tp.id_popolo"],
] as const;

export const buildQuery = (filters: QueryFilters) => {
  const raw = filters as Record<string, unknown>;
  let conditions = "WHERE 1=1";
  const params: unknown[] = [];
  const usedTables = new Set<string>(["f"]);

  const persona = text(raw.q_persona, "q_persona");
  if (persona) {
    conditions += ` AND (f.Nome_Fuoco ${LIKE})`;
    params.push(like(persona));
  }

  const localita = text(raw.q_localita, "q_localita");
  if (localita) {
    usedTables.add("tq").add("tp").add("tpi").add("tser");
    conditions += ` AND (tq.nome_quartiere ${LIKE} OR tp.nome_popolo ${LIKE} OR tpi.nome_piviere ${LIKE} OR tser.nome_serie ${LIKE})`;
    params.push(like(localita), like(localita), like(localita), like(localita));
  }

  const volume = text(raw.volume, "volume");
  if (volume) {
    conditions += " AND TRIM(f.Volume_Fuoco) = ?";
    params.push(volume);
  }

  for (const [key, column] of EQUALITY_FILTERS) {
    const value = num(raw[key], key);
    if (value !== undefined) {
      conditions += ` AND ${column} = ?`;
      params.push(value);
    }
  }

  for (const [key, column] of RANGE_FILTERS) {
    const min = num(raw[`${key}_min`], `${key}_min`);
    const max = num(raw[`${key}_max`], `${key}_max`);
    if (min !== undefined) {
      conditions += ` AND ${column} >= ?`;
      params.push(min);
    }
    if (max !== undefined) {
      conditions += ` AND ${column} <= ?`;
      params.push(max);
    }
  }

  for (const [key, table, column] of GEO_FILTERS) {
    const values = ids(raw[key], key);
    if (values) {
      usedTables.add(table);
      conditions += ` AND ${column} IN (${values.map(() => "?").join(",")})`;
      params.push(...values);
    }
  }

  const particolarita = num(raw.particolarita_parente, "particolarita_parente");
  if (particolarita !== undefined) {
    conditions += " AND EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Particolarita = ?)";
    params.push(particolarita);
  }

  return { conditions, params, usedTables };
};

export const buildOrderBy = (sort_by: string | undefined, order: string | undefined) => {
  const safeOrder = order && order.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const usedTables = new Set<string>();

  switch (sort_by) {
    case "fortune":
      return { clause: `ORDER BY f.Fortune_Fuoco ${safeOrder}`, usedTables };
    case "credito":
      return { clause: `ORDER BY f.Credito_Fuoco ${safeOrder}`, usedTables };
    case "creditoM":
      return { clause: `ORDER BY f.CreditoM_Fuoco ${safeOrder}`, usedTables };
    case "imponibile":
      return { clause: `ORDER BY f.Imponibile_Fuoco ${safeOrder}`, usedTables };
    case "deduzioni":
      return { clause: `ORDER BY f.Deduzioni_Fuoco ${safeOrder}`, usedTables };
    case "localita":
      usedTables.add("tq").add("tp");
      return {
        clause: `ORDER BY tq.nome_quartiere ${safeOrder}, tp.nome_popolo ${safeOrder}`,
        usedTables,
      };
    default:
      return { clause: `ORDER BY f.Nome_Fuoco ${safeOrder}`, usedTables };
  }
};
