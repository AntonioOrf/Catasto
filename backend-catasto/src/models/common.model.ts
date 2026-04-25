import pool from "../config/db.js";
import { Parenti } from "@catasto/shared";

export class CommonModel {
  static async getFilters(): Promise<any> {
    const [bestiame]: any = await pool.query("SELECT ID_Bestiame as id, Bestiame as label FROM bestiame");
    const [rapporto]: any = await pool.query("SELECT ID_Rapporto as id, RapportoLavoro as label FROM rapporto_mestiere");
    const [immigrazione]: any = await pool.query("SELECT Id as id, Immigrazione as label FROM immigrazione");
    const [mestieri]: any = await pool.query("SELECT id, Mestiere as label FROM mestieri ORDER BY Mestiere");

    return {
      bestiame,
      rapporto,
      immigrazione,
      mestieri
    };
  }

  static async getParenti(fuocoId: number): Promise<Parenti[]> {
    const sql = `
      SELECT p.Eta as eta, rp.Parentela as parentela_desc, sp.Sesso_Parenti as sesso,
        scp.StatoCivle as stato_civile, pp.ParticolaritàParenti as particolarita
      FROM parenti p
      LEFT JOIN rapporti_parentela rp ON p.Parentela = rp.ID_Parentela
      LEFT JOIN sesso_parenti sp ON p.Sesso = sp.ID_Sesso_Parenti
      LEFT JOIN statocivile_parenti scp ON p.StatoCivile = scp.ID_StatoCivile
      LEFT JOIN particolarita_parenti pp ON p.Particolarita = pp.ID_ParticolaritàParenti
      WHERE p.ID_FUOCO = ?
    `;
    const [rows]: any = await pool.query(sql, [fuocoId]);
    return rows as Parenti[];
  }

  static async getMestieriList(): Promise<any[]> {
    const [rows]: any = await pool.query("SELECT * FROM mestieri ORDER BY Mestiere ASC");
    return rows;
  }
}
