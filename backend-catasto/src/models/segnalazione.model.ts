import type { PoolConnection } from "mysql2/promise";
import pool from "../config/db.js";
import type { Segnalazione, StatoSegnalazione } from "@catasto/shared";

export interface SegnalazioneRow {
  id_fuoco: number | null;
  id_registrazione: number | null;
  tipo: string;
  campo: string | null;
  valore_attuale: string | null;
  valore_proposto: string | null;
  note: string | null;
  email: string | null;
  ip_hash: string | null;
}

export interface FuocoRiepilogo {
  nome: string | null;
  volume: string | number | null;
  foglio: string | number | null;
  serie: string | null;
  quartiere: string | null;
  piviere: string | null;
  popolo: string | null;
}

/** Luogo della mappa con la posizione attuale (null se non localizzato o senza luoghi_geo). */
export interface LuogoRiepilogo {
  serie: string | null;
  quartiere: string | null;
  piviere: string | null;
  popolo: string | null;
  lat: number | null;
  lng: number | null;
  certezza: string | null;
  nome_moderno: string | null;
}

/** Nome del luogo per elenchi e moderazione: "serie › quartiere › piviere › popolo". */
const NOME_LUOGO = `CONCAT_WS(' › ', lser.nome_serie, lq.nome_quartiere, lpi.nome_piviere, lpo.nome_popolo)`;
const JOIN_LUOGO = `
       LEFT JOIN t_struttura_catastale lts ON lts.id_registrazione = s.id_registrazione
       LEFT JOIN t_serie lser ON lser.id_serie = lts.id_serie
       LEFT JOIN t_quartieri lq ON lq.id_quartiere = lts.id_quartiere
       LEFT JOIN t_pivieri lpi ON lpi.id_piviere = lts.id_piviere
       LEFT JOIN t_popoli lpo ON lpo.id_popolo = lts.id_popolo`;

export class SegnalazioneModel {
  static async create(row: SegnalazioneRow): Promise<number> {
    const [result]: any = await pool.query(
      `INSERT INTO segnalazioni
        (id_fuoco, id_registrazione, tipo, campo, valore_attuale, valore_proposto, note, email, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id_fuoco,
        row.id_registrazione,
        row.tipo,
        row.campo,
        row.valore_attuale,
        row.valore_proposto,
        row.note,
        row.email,
        row.ip_hash,
      ],
    );
    return result.insertId as number;
  }

  static async fuocoExists(id: number): Promise<boolean> {
    const [rows]: any = await pool.query("SELECT 1 FROM fuochi WHERE ID_Fuochi = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  /** Conteggio per finestra temporale: secondo livello di difesa dopo il rate limit per IP. */
  static async countRecentByIp(ipHash: string, windowMinutes: number): Promise<number> {
    const [rows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM segnalazioni
       WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL ? MINUTE)`,
      [ipHash, windowMinutes],
    );
    return rows[0].total as number;
  }

  static async findAll(
    stato: StatoSegnalazione | undefined,
    limit: number,
    offset: number,
  ): Promise<Segnalazione[]> {
    const where = stato ? "WHERE s.stato = ?" : "";
    const params = stato ? [stato, limit, offset] : [limit, offset];

    const [rows]: any = await pool.query(
      `SELECT s.id, s.id_fuoco, f.Nome_Fuoco as nome_fuoco,
              s.id_registrazione, ${NOME_LUOGO} as nome_luogo, s.tipo, s.campo,
              s.valore_attuale, s.valore_proposto, s.note, s.email, s.stato, s.created_at
       FROM segnalazioni s
       LEFT JOIN fuochi f ON f.ID_Fuochi = s.id_fuoco${JOIN_LUOGO}
       ${where}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      params,
    );
    return rows as Segnalazione[];
  }

  static async findById(id: number): Promise<Segnalazione | null> {
    const [rows]: any = await pool.query(
      `SELECT s.id, s.id_fuoco, f.Nome_Fuoco as nome_fuoco,
              s.id_registrazione, ${NOME_LUOGO} as nome_luogo, s.tipo, s.campo,
              s.valore_attuale, s.valore_proposto, s.note, s.email, s.stato, s.created_at
       FROM segnalazioni s
       LEFT JOIN fuochi f ON f.ID_Fuochi = s.id_fuoco${JOIN_LUOGO}
       WHERE s.id = ?`,
      [id],
    );
    return (rows[0] as Segnalazione) ?? null;
  }

  /**
   * Luogo della mappa con la posizione attuale; null se il luogo non esiste.
   * Senza la tabella luoghi_geo (migrazioni 005–006 non applicate) il luogo
   * risulta non localizzato invece di far fallire la segnalazione.
   */
  static async findLuogoRiepilogo(idRegistrazione: number): Promise<LuogoRiepilogo | null> {
    const select = (conGeo: boolean) => `
      SELECT tser.nome_serie as serie, tq.nome_quartiere as quartiere,
             tpi.nome_piviere as piviere, tp.nome_popolo as popolo,
             ${conGeo ? "lg.lat, lg.lng, lg.certezza, lg.nome_moderno" : "NULL as lat, NULL as lng, NULL as certezza, NULL as nome_moderno"}
      FROM t_struttura_catastale ts
      ${conGeo ? "LEFT JOIN luoghi_geo lg ON lg.id_registrazione = ts.id_registrazione" : ""}
      LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
      LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
      LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
      LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
      WHERE ts.id_registrazione = ?
      LIMIT 1`;

    let rows: any;
    try {
      [rows] = await pool.query(select(true), [idRegistrazione]);
    } catch (err) {
      if ((err as { code?: string })?.code !== "ER_NO_SUCH_TABLE") throw err;
      [rows] = await pool.query(select(false), [idRegistrazione]);
    }
    const r = rows[0];
    if (!r) return null;
    return {
      serie: r.serie ?? null,
      quartiere: r.quartiere ?? null,
      piviere: r.piviere ?? null,
      popolo: r.popolo ?? null,
      lat: r.lat === null || r.lat === undefined ? null : Number(r.lat),
      lng: r.lng === null || r.lng === undefined ? null : Number(r.lng),
      certezza: r.certezza ?? null,
      nome_moderno: r.nome_moderno ?? null,
    };
  }

  /** Dati del fuoco da mostrare nell'email alla redazione: nome, carta e località. */
  static async findFuocoRiepilogo(id: number): Promise<FuocoRiepilogo | null> {
    const [rows]: any = await pool.query(
      `SELECT f.Nome_Fuoco as nome, TRIM(f.Volume_Fuoco) as volume, f.Foglio_Fuoco as foglio,
              tser.nome_serie as serie, tq.nome_quartiere as quartiere,
              tpi.nome_piviere as piviere, tp.nome_popolo as popolo
       FROM fuochi f
       LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione
       LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
       LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
       LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
       LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
       WHERE f.ID_Fuochi = ?
       LIMIT 1`,
      [id],
    );
    return (rows[0] as FuocoRiepilogo) ?? null;
  }

  /** Esegue `work` in una transazione; rollback automatico se lancia. */
  static async transaction<T>(work: (tx: SegnalazioneTx) => Promise<T>): Promise<T> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(new SegnalazioneTx(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

/** Operazioni di moderazione, legate a una connessione in transazione. */
export class SegnalazioneTx {
  constructor(private readonly db: PoolConnection) {}

  /** FOR UPDATE: due moderatori sulla stessa segnalazione non si sovrascrivono a metà. */
  async findByIdForUpdate(id: number): Promise<Segnalazione | null> {
    const [rows]: any = await this.db.query(
      `SELECT id, id_fuoco, id_registrazione, tipo, campo, valore_attuale, valore_proposto, note, email, stato, created_at
       FROM segnalazioni WHERE id = ? FOR UPDATE`,
      [id],
    );
    return (rows[0] as Segnalazione) ?? null;
  }

  async updateStato(id: number, stato: StatoSegnalazione): Promise<void> {
    await this.db.query("UPDATE segnalazioni SET stato = ? WHERE id = ?", [stato, id]);
  }

  /**
   * Pubblica la segnatura proposta sulla scheda del fuoco. Upsert: una nuova
   * segnalazione accettata sullo stesso fuoco corregge la precedente.
   */
  async upsertSegnatura(idFuoco: number, segnatura: string, idSegnalazione: number): Promise<void> {
    await this.db.query(
      `INSERT INTO fuoco_segnature (id_fuoco, segnatura, id_segnalazione)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE segnatura = VALUES(segnatura), id_segnalazione = VALUES(id_segnalazione)`,
      [idFuoco, segnatura, idSegnalazione],
    );
  }

  /**
   * Ultima segnatura ancora accettata sullo stesso fuoco, esclusa quella che
   * si sta revocando: è il dato da ripristinare al posto di quella ritirata.
   */
  async findUltimaSegnaturaAccettata(
    idFuoco: number,
    esclusa: number,
  ): Promise<{ id: number; valore_proposto: string } | null> {
    const [rows]: any = await this.db.query(
      `SELECT id, valore_proposto FROM segnalazioni
       WHERE id_fuoco = ? AND tipo = 'segnatura' AND stato = 'accettata' AND id <> ?
         AND valore_proposto IS NOT NULL AND valore_proposto <> ''
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1 FOR UPDATE`,
      [idFuoco, esclusa],
    );
    return rows[0] ?? null;
  }

  /** Sostituisce la segnatura solo se è ancora quella pubblicata da `daSegnalazione`. */
  async replaceSegnatura(
    idFuoco: number,
    daSegnalazione: number,
    segnatura: string,
    idSegnalazione: number,
  ): Promise<void> {
    await this.db.query(
      `UPDATE fuoco_segnature SET segnatura = ?, id_segnalazione = ?
       WHERE id_fuoco = ? AND id_segnalazione = ?`,
      [segnatura, idSegnalazione, idFuoco, daSegnalazione],
    );
  }

  /** Ritira la segnatura solo se è ancora quella pubblicata da `idSegnalazione`. */
  async deleteSegnatura(idFuoco: number, idSegnalazione: number): Promise<void> {
    await this.db.query("DELETE FROM fuoco_segnature WHERE id_fuoco = ? AND id_segnalazione = ?", [
      idFuoco,
      idSegnalazione,
    ]);
  }
}
