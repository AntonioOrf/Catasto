import pool from "../config/db.js";
import { Fuoco, SidebarItem } from "@catasto/shared";

/**
 * Join opzionali, in ordine di dipendenza: `requires` indica il join che deve
 * precedere (le tabelle geografiche passano da t_struttura_catastale).
 * Unica definizione per conteggio, tabella e sidebar: prima erano tre copie
 * da tenere allineate a mano.
 */
const JOINS: ReadonlyArray<{ alias: string; sql: string; requires?: string }> = [
  { alias: "m", sql: "LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id" },
  { alias: "c", sql: "LEFT JOIN casa c ON f.Casa_Fuoco = c.Id_casa" },
  { alias: "pf", sql: "LEFT JOIN particolarita_fuoco pf ON f.Particolarita_Fuoco = pf.Id" },
  { alias: "b", sql: "LEFT JOIN bestiame b ON f.Bestiame_Fuoco = b.ID_Bestiame" },
  { alias: "i", sql: "LEFT JOIN immigrazione i ON f.Immigrazione_Fuoco = i.Id" },
  { alias: "rm", sql: "LEFT JOIN rapporto_mestiere rm ON f.RapportoMestiere_Fuoco = rm.ID_Rapporto" },
  { alias: "ts", sql: "LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione" },
  { alias: "tq", sql: "LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere", requires: "ts" },
  { alias: "tp", sql: "LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo", requires: "ts" },
  { alias: "tpi", sql: "LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere", requires: "ts" },
  { alias: "tser", sql: "LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie", requires: "ts" },
  { alias: "tav", sql: "LEFT JOIN t_archivio_volumi tav ON f.Volume_Fuoco = CAST(tav.volume AS UNSIGNED)" },
  { alias: "fs", sql: "LEFT JOIN fuoco_segnature fs ON fs.id_fuoco = f.ID_Fuochi" },
];

/** Tutte le tabelle proiettate dalla vista completa della tabella. */
const TABLE_VIEW_ALIASES = JOINS.map((j) => j.alias);

function buildFrom(aliases: Iterable<string>): string {
  const needed = new Set(aliases);
  for (const join of JOINS) {
    if (needed.has(join.alias) && join.requires) needed.add(join.requires);
  }
  const joins = JOINS.filter((j) => needed.has(j.alias)).map((j) => j.sql);
  return ["FROM fuochi f", ...joins].join("\n      ");
}

export interface FuocoQuery {
  conditions: string;
  params: unknown[];
  /** Alias richiesti da WHERE e ORDER BY. */
  usedTables: Set<string>;
  orderByClause: string;
  limit: number;
  offset: number;
}

export class FuocoModel {
  /** Il conteggio ignora l'ordinamento: gli bastano i join usati dal WHERE. */
  static async count(conditions: string, params: unknown[], filterTables: Set<string>): Promise<number> {
    const sql = `SELECT COUNT(*) as total ${buildFrom(filterTables)} ${conditions}`;
    const [rows]: any = await pool.query(sql, params);
    return rows[0].total;
  }

  static async findAll(q: FuocoQuery): Promise<Fuoco[]> {
    const sql = `
      SELECT
        f.ID_Fuochi as id, f.Nome_Fuoco as nome,
        f.Imponibile_Fuoco as imponibile, f.Credito_Fuoco as credito,
        f.CreditoM_Fuoco as credito_m, f.Fortune_Fuoco as fortune, f.Deduzioni_Fuoco as deduzioni,
        f.Volume_Fuoco as volume, f.Foglio_Fuoco as foglio,
        pf.Particolarita as particolarita_fuoco,
        b.Bestiame as bestiame, i.Immigrazione as immigrazione, rm.RapportoLavoro as rapporto_mestiere,
        m.Mestiere as mestiere, c.Casa as casa,
        tq.nome_quartiere as quartiere, tp.nome_popolo as popolo,
        tpi.nome_piviere as piviere, tser.nome_serie as serie,
        tav.codice_archivio,
        fs.segnatura as segnatura_portata
      ${buildFrom(TABLE_VIEW_ALIASES)} ${q.conditions} ${q.orderByClause} LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(sql, [...q.params, q.limit, q.offset]);
    return rows as Fuoco[];
  }

  static async getSidebar(q: FuocoQuery): Promise<SidebarItem[]> {
    const from = buildFrom(["m", ...q.usedTables]);
    const sql = `SELECT f.ID_Fuochi as id, f.Nome_Fuoco as nome, m.Mestiere as mestiere ${from} ${q.conditions} ${q.orderByClause} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(sql, [...q.params, q.limit, q.offset]);
    return rows as SidebarItem[];
  }
}
