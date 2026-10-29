import pool from "../config/db.js";
import type { StatsMetric } from "@catasto/shared";
import { buildFrom } from "./fuoco.model.js";
import { groupedLabel } from "./common.model.js";

/**
 * Aggregati SQL sulle righe di una ricerca. Ogni metodo riceve le condizioni
 * già compilate (`buildQuery` o `buildQueryFromAst`), quindi le statistiche
 * descrivono sempre esattamente i fuochi della tabella.
 */

export interface StatsFilters {
  conditions: string;
  params: unknown[];
  usedTables: Set<string>;
}

export const METRIC_COLUMNS: Record<StatsMetric, string> = {
  fortune: "f.Fortune_Fuoco",
  credito: "f.Credito_Fuoco",
  credito_m: "f.CreditoM_Fuoco",
  imponibile: "f.Imponibile_Fuoco",
  deduzioni: "f.Deduzioni_Fuoco",
};

/** Aggiunge una condizione al WHERE compilato, senza cambiarne la precedenza. */
export const andWhere = (conditions: string, extra: string): string =>
  `WHERE (${conditions.replace(/^\s*WHERE\s+/i, "")}) AND ${extra}`;

/** mysql2 restituisce DECIMAL e SUM come stringhe, COUNT come numeri. */
export const num = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Quantili richiesti: posizioni 1-based della definizione "tipo 7" (R, numpy, Excel). */
export const QUANTILES = [0.25, 0.5, 0.75] as const;

/**
 * Quantile con interpolazione lineare fra le due osservazioni vicine
 * (h = (n-1)p + 1). `values` mappa la posizione (1-based) al valore.
 */
export function quantile(values: ReadonlyMap<number, number>, count: number, p: number): number | null {
  if (count === 0) return null;
  const h = (count - 1) * p + 1;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  const a = values.get(lo);
  const b = values.get(hi);
  if (a === undefined || b === undefined) return null;
  return a + (h - lo) * (b - a);
}

export class StatsModel {
  /** Conteggio dei fuochi e, per ogni misura, valori presenti, somma, media, minimo e massimo. */
  static async summary(q: StatsFilters): Promise<Record<string, unknown>> {
    const parts = Object.entries(METRIC_COLUMNS).flatMap(([key, col]) => [
      `COUNT(${col}) AS ${key}_presenti`,
      `SUM(${col}) AS ${key}_somma`,
      `AVG(${col}) AS ${key}_media`,
      `MIN(${col}) AS ${key}_min`,
      `MAX(${col}) AS ${key}_max`,
    ]);
    const sql = `SELECT COUNT(*) AS fuochi, ${parts.join(", ")} ${buildFrom(q.usedTables)} ${q.conditions}`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows[0];
  }

  /**
   * Valori alle posizioni che servono a mediana e quartili, ordinati con una
   * window function: al massimo sei righe per misura, mai l'intera colonna.
   */
  static async quantileRows(q: StatsFilters, metric: StatsMetric): Promise<{ values: Map<number, number>; count: number }> {
    const col = METRIC_COLUMNS[metric];
    const positions = QUANTILES.flatMap((p) => [`FLOOR((cnt - 1) * ${p}) + 1`, `CEIL((cnt - 1) * ${p}) + 1`]);
    const sql = `
      WITH v AS (
        SELECT x, ROW_NUMBER() OVER (ORDER BY x) AS rn, COUNT(*) OVER () AS cnt
        FROM (SELECT ${col} AS x ${buildFrom(q.usedTables)} ${andWhere(q.conditions, `${col} IS NOT NULL`)}) s
      )
      SELECT rn, x, cnt FROM v WHERE rn IN (${positions.join(", ")})`;
    const [rows]: any = await pool.query(sql, q.params);
    const values = new Map<number, number>();
    for (const row of rows) values.set(Number(row.rn), Number(row.x));
    return { values, count: rows.length > 0 ? Number(rows[0].cnt) : 0 };
  }

  /** Fuochi per etichetta (null = non indicato), dalla più frequente. */
  static async countBy(q: StatsFilters, label: string, aliases: string[]): Promise<{ label: string | null; n: number }[]> {
    const sql = `SELECT ${label} AS label, COUNT(*) AS n ${buildFrom([...q.usedTables, ...aliases])} ${q.conditions}
      GROUP BY label ORDER BY n DESC, label`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows.map((r: any) => ({ label: r.label ?? null, n: Number(r.n) }));
  }

  static mestieri(q: StatsFilters) {
    return this.countBy(q, "m.Mestiere", ["m"]);
  }

  /** Partizioni omonime ("San Giovanni (I)" e "(II)") unite come nei filtri. */
  static quartieri(q: StatsFilters) {
    return this.countBy(q, groupedLabel("tq.nome_quartiere"), ["tq"]);
  }

  static serie(q: StatsFilters) {
    return this.countBy(q, groupedLabel("tser.nome_serie"), ["tser"]);
  }

  /** Sottoquery degli id dei fuochi della ricerca, per gli aggregati sui parenti. */
  private static fuochiIds(q: StatsFilters): string {
    return `SELECT f.ID_Fuochi ${buildFrom(q.usedTables)} ${q.conditions}`;
  }

  /** Numero di fuochi per numero di membri registrati, compresi quelli senza parenti. */
  static async membri(q: StatsFilters): Promise<{ membri: number; fuochi: number }[]> {
    const sql = `
      SELECT COALESCE(c.n, 0) AS membri, COUNT(*) AS fuochi
      FROM (${this.fuochiIds(q)}) ids
      LEFT JOIN (SELECT ID_FUOCO, COUNT(*) AS n FROM parenti GROUP BY ID_FUOCO) c ON c.ID_FUOCO = ids.ID_Fuochi
      GROUP BY membri ORDER BY membri`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows.map((r: any) => ({ membri: Number(r.membri), fuochi: Number(r.fuochi) }));
  }

  /** Parenti per fascia d'età di 5 anni (90 = 90 e oltre) e sesso. `da` null = età assente. */
  static async eta(q: StatsFilters): Promise<{ da: number | null; sesso: string | null; n: number }[]> {
    const sql = `
      SELECT CASE WHEN p.Eta IS NULL THEN NULL ELSE LEAST(FLOOR(p.Eta / 5) * 5, 90) END AS da,
        sp.Sesso_Parenti AS sesso, COUNT(*) AS n
      FROM parenti p
      LEFT JOIN sesso_parenti sp ON p.Sesso = sp.ID_Sesso_Parenti
      WHERE p.ID_FUOCO IN (${this.fuochiIds(q)})
      GROUP BY da, sesso ORDER BY da, sesso`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows.map((r: any) => ({ da: num(r.da), sesso: r.sesso ?? null, n: Number(r.n) }));
  }

  static async statoCivile(q: StatsFilters): Promise<{ label: string | null; n: number }[]> {
    const sql = `
      SELECT scp.StatoCivle AS label, COUNT(*) AS n
      FROM parenti p
      LEFT JOIN statocivile_parenti scp ON p.StatoCivile = scp.ID_StatoCivile
      WHERE p.ID_FUOCO IN (${this.fuochiIds(q)})
      GROUP BY label ORDER BY n DESC, label`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows.map((r: any) => ({ label: r.label ?? null, n: Number(r.n) }));
  }
}
