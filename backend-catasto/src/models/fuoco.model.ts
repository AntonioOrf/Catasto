import pool from "../config/db.js";
import { Fuoco, SidebarItem } from "@catasto/shared";

export class FuocoModel {
  static async count(conditions: string, params: any[], usedTables: Set<string>): Promise<number> {
    const countJoins = `
      FROM fuochi f
      ${usedTables.has("m") ? "LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id" : ""}
      ${usedTables.has("tq") ? "LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere" : ""}
      ${usedTables.has("tp") ? (usedTables.has("tq") ? "" : "LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione ") + "LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo" : ""}
      ${usedTables.has("tpi") ? (usedTables.has("tq") || usedTables.has("tp") ? "" : "LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione ") + "LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere" : ""}
      ${usedTables.has("tser") ? (usedTables.has("tq") || usedTables.has("tp") || usedTables.has("tpi") ? "" : "LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione ") + "LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie" : ""}
    `;
    const sql = `SELECT COUNT(*) as total ${countJoins} ${conditions}`;
    const [rows]: any = await pool.query(sql, params);
    return rows[0].total;
  }

  static async findAll(conditions: string, params: any[], orderByClause: string, limit: number, offset: number): Promise<Fuoco[]> {
    const baseJoins = `
      FROM fuochi f
      LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id
      LEFT JOIN casa c ON f.Casa_Fuoco = c.Id_casa
      LEFT JOIN particolarita_fuoco pf ON f.Particolarita_Fuoco = pf.Id
      LEFT JOIN bestiame b ON f.Bestiame_Fuoco = b.ID_Bestiame
      LEFT JOIN immigrazione i ON f.Immigrazione_Fuoco = i.Id
      LEFT JOIN rapporto_mestiere rm ON f.RapportoMestiere_Fuoco = rm.ID_Rapporto
      LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione
      LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
      LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
      LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
      LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
      LEFT JOIN t_archivio_volumi tav ON f.Volume_Fuoco = tav.volume
    `;
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
        tav.codice_archivio
      ${baseJoins} ${conditions} ${orderByClause} LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(sql, [...params, limit, offset]);
    return rows as Fuoco[];
  }

  static async getSidebar(conditions: string, params: any[], orderByClause: string, limit: number, offset: number): Promise<SidebarItem[]> {
    const sidebarJoins = `
      FROM fuochi f
      LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id
      LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione
      LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
      LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
      LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
      LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
    `;
    const sql = `SELECT f.ID_Fuochi as id, f.Nome_Fuoco as nome, m.Mestiere as mestiere ${sidebarJoins} ${conditions} ${orderByClause} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(sql, [...params, limit, offset]);
    return rows as SidebarItem[];
  }
}
