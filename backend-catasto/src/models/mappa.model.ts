import pool from "../config/db.js";
import { buildFrom } from "./fuoco.model.js";
import { num, type StatsFilters } from "./stats.model.js";

/**
 * Aggregati dei fuochi di una ricerca per luogo (`id_registrazione`), e
 * coordinate dei luoghi (`luoghi_geo`, migrazioni 005–006). Le condizioni
 * arrivano già compilate da `buildQuery` o `buildQueryFromAst`: la mappa
 * mostra esattamente i fuochi della tabella.
 */

export interface AggregatoLuogo {
  id: number;
  fuochi: number;
  imponibile_medio: number | null;
  con_mestiere: number;
  con_migrazione: number;
  ampiezza_media: number;
}

export interface GeoLuogo {
  id: number;
  lat: number | null;
  lng: number | null;
  certezza: string;
  nome_moderno: string | null;
  serie: string | null;
  piviere: string | null;
  popolo: string | null;
  quartiere: string | null;
}

export class MappaModel {
  static async aggregati(q: StatsFilters): Promise<AggregatoLuogo[]> {
    // mestiere 0 = "non specificato", immigrazione 0 = "Non specificato".
    const sql = `
      SELECT ts.id_registrazione AS id, COUNT(*) AS fuochi,
        AVG(f.Imponibile_Fuoco) AS imponibile_medio,
        SUM(f.Mestiere_Fuoco IS NOT NULL AND f.Mestiere_Fuoco <> 0) AS con_mestiere,
        SUM(f.Immigrazione_Fuoco IS NOT NULL AND f.Immigrazione_Fuoco <> 0) AS con_migrazione,
        AVG(COALESCE(pc.n, 0)) AS ampiezza_media
      ${buildFrom([...q.usedTables, "ts"])}
      LEFT JOIN (SELECT ID_FUOCO, COUNT(*) AS n FROM parenti GROUP BY ID_FUOCO) pc ON pc.ID_FUOCO = f.ID_Fuochi
      ${q.conditions}
      GROUP BY ts.id_registrazione`;
    const [rows]: any = await pool.query(sql, q.params);
    return rows.map((r: any) => ({
      id: Number(r.id),
      fuochi: Number(r.fuochi),
      imponibile_medio: num(r.imponibile_medio),
      con_mestiere: Number(r.con_mestiere ?? 0),
      con_migrazione: Number(r.con_migrazione ?? 0),
      ampiezza_media: num(r.ampiezza_media) ?? 0,
    }));
  }

  /** Tutti i luoghi con nomi e coordinate (o senza, se non localizzati). */
  static async luoghi(): Promise<GeoLuogo[]> {
    const [rows]: any = await pool.query(`
      SELECT ts.id_registrazione AS id, lg.lat, lg.lng, lg.certezza, lg.nome_moderno,
        tser.nome_serie AS serie, tpi.nome_piviere AS piviere, tp.nome_popolo AS popolo, tq.nome_quartiere AS quartiere
      FROM t_struttura_catastale ts
      LEFT JOIN luoghi_geo lg ON lg.id_registrazione = ts.id_registrazione
      LEFT JOIN t_serie tser ON tser.id_serie = ts.id_serie
      LEFT JOIN t_pivieri tpi ON tpi.id_piviere = ts.id_piviere
      LEFT JOIN t_popoli tp ON tp.id_popolo = ts.id_popolo
      LEFT JOIN t_quartieri tq ON tq.id_quartiere = ts.id_quartiere`);
    return rows.map((r: any) => ({
      id: Number(r.id),
      lat: num(r.lat),
      lng: num(r.lng),
      certezza: r.certezza ?? "non_trovata",
      nome_moderno: r.nome_moderno ?? null,
      serie: r.serie ?? null,
      piviere: r.piviere ?? null,
      popolo: r.popolo ?? null,
      quartiere: r.quartiere ?? null,
    }));
  }
}
