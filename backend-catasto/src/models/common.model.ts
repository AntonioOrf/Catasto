import pool from "../config/db.js";
import type { FilterOptions, Parenti } from "@catasto/shared";
import { parseIdList } from "../utils/query-builder.js";

/**
 * Etichetta senza il numero romano finale ("San Giovanni (II)" -> "San
 * Giovanni"): le partizioni omonime diventano una sola voce, con gli id
 * raggruppati da GROUP_CONCAT e separati da virgola.
 */
const groupedLabel = (column: string) =>
  `TRIM(REGEXP_REPLACE(${column}, ' \\\\([IVX]+\\\\)$', ''))`;

const STATIC_FILTER_QUERIES = {
  bestiame: "SELECT ID_Bestiame as id, Bestiame as label FROM bestiame",
  rapporto: "SELECT ID_Rapporto as id, RapportoLavoro as label FROM rapporto_mestiere",
  immigrazione: "SELECT Id as id, Immigrazione as label FROM immigrazione",
  mestieri: "SELECT id, Mestiere as label FROM mestieri ORDER BY Mestiere",
  serie: `SELECT GROUP_CONCAT(id_serie) as id, ${groupedLabel("nome_serie")} as label FROM t_serie GROUP BY label ORDER BY label`,
  quartieri: `SELECT GROUP_CONCAT(id_quartiere) as id, ${groupedLabel("nome_quartiere")} as label FROM t_quartieri GROUP BY label ORDER BY label`,
  pivieri: `SELECT GROUP_CONCAT(id_piviere) as id, ${groupedLabel("nome_piviere")} as label FROM t_pivieri GROUP BY label ORDER BY label`,
  popoli: `SELECT GROUP_CONCAT(id_popolo) as id, ${groupedLabel("nome_popolo")} as label FROM t_popoli GROUP BY label ORDER BY label`,
  particolaritaParente: "SELECT ID_ParticolaritaParenti as id, ParticolaritaParenti as label FROM particolarita_parenti ORDER BY ParticolaritaParenti",
  casa: "SELECT Id_casa as id, Casa as label FROM casa ORDER BY Casa",
} as const satisfies Record<keyof FilterOptions, string>;

/** Opzioni geografiche ristrette dalla selezione del livello superiore. */
const DEPENDENT_GEO = [
  ["quartieri", "t_quartieri", "tq", "id_quartiere", "nome_quartiere"],
  ["pivieri", "t_pivieri", "tpi", "id_piviere", "nome_piviere"],
  ["popoli", "t_popoli", "tp", "id_popolo", "nome_popolo"],
] as const;

export interface GeoSelection {
  serie?: unknown;
  quartiere?: unknown;
  piviere?: unknown;
}

const GEO_SELECTION_COLUMNS = [
  ["serie", "ts.id_serie"],
  ["quartiere", "ts.id_quartiere"],
  ["piviere", "ts.id_piviere"],
] as const;

async function loadStaticFilters(): Promise<FilterOptions> {
  const entries = await Promise.all(
    Object.entries(STATIC_FILTER_QUERIES).map(async ([key, sql]) => {
      const [rows] = await pool.query(sql);
      return [key, rows] as const;
    }),
  );
  return Object.fromEntries(entries) as unknown as FilterOptions;
}

export class CommonModel {
  // Promise e non valore: richieste concorrenti a freddo condividono lo stesso
  // caricamento invece di lanciare dieci query ciascuna.
  private static staticFilters: Promise<FilterOptions> | null = null;

  static async getFilters(selection: GeoSelection = {}): Promise<FilterOptions> {
    if (!this.staticFilters) {
      this.staticFilters = loadStaticFilters().catch((error) => {
        // Un errore transitorio del DB non deve restare in cache per sempre.
        this.staticFilters = null;
        throw error;
      });
    }
    const baseFilters = await this.staticFilters;

    const conditions: string[] = [];
    const params: number[] = [];
    for (const [key, column] of GEO_SELECTION_COLUMNS) {
      const ids = parseIdList(selection[key], key);
      if (ids) {
        conditions.push(`${column} IN (${ids.map(() => "?").join(",")})`);
        params.push(...ids);
      }
    }

    if (conditions.length === 0) return baseFilters;

    const where = `WHERE ${conditions.join(" AND ")}`;
    const dependent = await Promise.all(
      DEPENDENT_GEO.map(async ([key, table, alias, idColumn, nameColumn]) => {
        const [rows] = await pool.query(
          `SELECT GROUP_CONCAT(DISTINCT ${alias}.${idColumn}) as id, ${groupedLabel(`${alias}.${nameColumn}`)} as label
           FROM t_struttura_catastale ts
           JOIN ${table} ${alias} ON ts.${idColumn} = ${alias}.${idColumn}
           ${where}
           GROUP BY label
           ORDER BY label`,
          params,
        );
        return [key, rows] as const;
      }),
    );

    return { ...baseFilters, ...Object.fromEntries(dependent) };
  }

  static async getParenti(fuocoId: number): Promise<Parenti[]> {
    const sql = `
      SELECT p.Eta as eta, rp.Parentela as parentela_desc, sp.Sesso_Parenti as sesso,
        scp.StatoCivle as stato_civile, pp.ParticolaritaParenti as particolarita
      FROM parenti p
      LEFT JOIN rapporti_parentela rp ON p.Parentela = rp.ID_Parentela
      LEFT JOIN sesso_parenti sp ON p.Sesso = sp.ID_Sesso_Parenti
      LEFT JOIN statocivile_parenti scp ON p.StatoCivile = scp.ID_StatoCivile
      LEFT JOIN particolarita_parenti pp ON p.Particolarita = pp.ID_ParticolaritaParenti
      WHERE p.ID_FUOCO = ?
    `;
    const [rows]: any = await pool.query(sql, [fuocoId]);
    return rows as Parenti[];
  }

  static async getMestieriList(): Promise<Record<string, unknown>[]> {
    const [rows]: any = await pool.query("SELECT * FROM mestieri ORDER BY Mestiere ASC");
    return rows;
  }
}
