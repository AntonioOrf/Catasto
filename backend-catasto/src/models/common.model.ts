import pool from "../config/db.js";
import { Parenti } from "@catasto/shared";

export class CommonModel {
  private static cachedFilters: any = null;

  static async getFilters(): Promise<any> {
    if (this.cachedFilters) {
      return this.cachedFilters;
    }

    const [bestiame]: any = await pool.query("SELECT ID_Bestiame as id, Bestiame as label FROM bestiame");
    const [rapporto]: any = await pool.query("SELECT ID_Rapporto as id, RapportoLavoro as label FROM rapporto_mestiere");
    const [immigrazione]: any = await pool.query("SELECT Id as id, Immigrazione as label FROM immigrazione");
    const [mestieri]: any = await pool.query("SELECT id, Mestiere as label FROM mestieri ORDER BY Mestiere");
    const [serie]: any = await pool.query("SELECT id_serie as id, nome_serie as label FROM t_serie ORDER BY nome_serie");
    const [quartieri]: any = await pool.query("SELECT id_quartiere as id, nome_quartiere as label FROM t_quartieri ORDER BY nome_quartiere");
    const [pivieri]: any = await pool.query("SELECT id_piviere as id, nome_piviere as label FROM t_pivieri ORDER BY nome_piviere");
    const [popoli]: any = await pool.query("SELECT id_popolo as id, nome_popolo as label FROM t_popoli ORDER BY nome_popolo");
    const [particolaritaParente]: any = await pool.query("SELECT ID_ParticolaritaParenti as id, ParticolaritaParenti as label FROM particolarita_parenti ORDER BY ParticolaritaParenti");
    const [casa]: any = await pool.query("SELECT Id_casa as id, Casa as label FROM casa ORDER BY Casa");

    this.cachedFilters = {
      bestiame,
      rapporto,
      immigrazione,
      mestieri,
      serie,
      quartieri,
      pivieri,
      popoli,
      particolaritaParente,
      casa
    };

    return this.cachedFilters;
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

  static async getMestieriList(): Promise<any[]> {
    const [rows]: any = await pool.query("SELECT * FROM mestieri ORDER BY Mestiere ASC");
    return rows;
  }
}
