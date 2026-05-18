import pool from "../config/db.js";
import { Parenti } from "@catasto/shared";

export class CommonModel {
  private static cachedFilters: any = null;

  static async getFilters(serieId?: string, quartiereId?: string, piviereId?: string): Promise<any> {
    let baseFilters = this.cachedFilters;

    if (!baseFilters) {
      const [bestiame]: any = await pool.query("SELECT ID_Bestiame as id, Bestiame as label FROM bestiame");
      const [rapporto]: any = await pool.query("SELECT ID_Rapporto as id, RapportoLavoro as label FROM rapporto_mestiere");
      const [immigrazione]: any = await pool.query("SELECT Id as id, Immigrazione as label FROM immigrazione");
      const [mestieri]: any = await pool.query("SELECT id, Mestiere as label FROM mestieri ORDER BY Mestiere");
      const [serie]: any = await pool.query("SELECT GROUP_CONCAT(id_serie) as id, TRIM(REGEXP_REPLACE(nome_serie, ' \\\\([IVX]+\\\\)$', '')) as label FROM t_serie GROUP BY label ORDER BY label");
      const [quartieri]: any = await pool.query("SELECT GROUP_CONCAT(id_quartiere) as id, TRIM(REGEXP_REPLACE(nome_quartiere, ' \\\\([IVX]+\\\\)$', '')) as label FROM t_quartieri GROUP BY label ORDER BY label");
      const [pivieri]: any = await pool.query("SELECT GROUP_CONCAT(id_piviere) as id, TRIM(REGEXP_REPLACE(nome_piviere, ' \\\\([IVX]+\\\\)$', '')) as label FROM t_pivieri GROUP BY label ORDER BY label");
      const [popoli]: any = await pool.query("SELECT GROUP_CONCAT(id_popolo) as id, TRIM(REGEXP_REPLACE(nome_popolo, ' \\\\([IVX]+\\\\)$', '')) as label FROM t_popoli GROUP BY label ORDER BY label");
      const [particolaritaParente]: any = await pool.query("SELECT ID_ParticolaritaParenti as id, ParticolaritaParenti as label FROM particolarita_parenti ORDER BY ParticolaritaParenti");
      const [casa]: any = await pool.query("SELECT Id_casa as id, Casa as label FROM casa ORDER BY Casa");

      baseFilters = {
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
      this.cachedFilters = baseFilters;
    }

    if (!serieId && !quartiereId && !piviereId) {
      return baseFilters;
    }

    // Dynamic query for geographic options based on selections
    const geoConditions = [];
    const geoParams = [];

    if (serieId) {
      const ids = String(serieId).split(",");
      geoConditions.push(`ts.id_serie IN (${ids.map(() => '?').join(',')})`);
      geoParams.push(...ids);
    }
    if (quartiereId) {
      const ids = String(quartiereId).split(",");
      geoConditions.push(`ts.id_quartiere IN (${ids.map(() => '?').join(',')})`);
      geoParams.push(...ids);
    }
    if (piviereId) {
      const ids = String(piviereId).split(",");
      geoConditions.push(`ts.id_piviere IN (${ids.map(() => '?').join(',')})`);
      geoParams.push(...ids);
    }

    const whereClause = geoConditions.length > 0 ? "WHERE " + geoConditions.join(" AND ") : "";

    const [quartieri]: any = await pool.query(`
      SELECT GROUP_CONCAT(DISTINCT tq.id_quartiere) as id, TRIM(REGEXP_REPLACE(tq.nome_quartiere, ' \\\\([IVX]+\\\\)$', '')) as label 
      FROM t_struttura_catastale ts 
      JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere 
      ${whereClause} 
      GROUP BY label
      ORDER BY label
    `, geoParams);

    const [pivieri]: any = await pool.query(`
      SELECT GROUP_CONCAT(DISTINCT tpi.id_piviere) as id, TRIM(REGEXP_REPLACE(tpi.nome_piviere, ' \\\\([IVX]+\\\\)$', '')) as label 
      FROM t_struttura_catastale ts 
      JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere 
      ${whereClause} 
      GROUP BY label
      ORDER BY label
    `, geoParams);

    const [popoli]: any = await pool.query(`
      SELECT GROUP_CONCAT(DISTINCT tp.id_popolo) as id, TRIM(REGEXP_REPLACE(tp.nome_popolo, ' \\\\([IVX]+\\\\)$', '')) as label 
      FROM t_struttura_catastale ts 
      JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo 
      ${whereClause} 
      GROUP BY label
      ORDER BY label
    `, geoParams);

    return {
      ...baseFilters,
      quartieri,
      pivieri,
      popoli
    };
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
