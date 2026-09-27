import type { PoolConnection } from "mysql2/promise";
import pool from "../config/db.js";
import type { Segnalazione, StatoSegnalazione } from "@catasto/shared";

export interface SegnalazioneRow {
  id_fuoco: number | null;
  tipo: string;
  campo: string | null;
  valore_attuale: string | null;
  valore_proposto: string | null;
  note: string | null;
  email: string | null;
  ip_hash: string | null;
}

export class SegnalazioneModel {
  static async create(row: SegnalazioneRow): Promise<number> {
    const [result]: any = await pool.query(
      `INSERT INTO segnalazioni
        (id_fuoco, tipo, campo, valore_attuale, valore_proposto, note, email, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id_fuoco,
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
      `SELECT s.id, s.id_fuoco, f.Nome_Fuoco as nome_fuoco, s.tipo, s.campo,
              s.valore_attuale, s.valore_proposto, s.note, s.email, s.stato, s.created_at
       FROM segnalazioni s
       LEFT JOIN fuochi f ON f.ID_Fuochi = s.id_fuoco
       ${where}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      params,
    );
    return rows as Segnalazione[];
  }

  static async findById(id: number): Promise<Segnalazione | null> {
    const [rows]: any = await pool.query(
      `SELECT s.id, s.id_fuoco, f.Nome_Fuoco as nome_fuoco, s.tipo, s.campo,
              s.valore_attuale, s.valore_proposto, s.note, s.email, s.stato, s.created_at
       FROM segnalazioni s
       LEFT JOIN fuochi f ON f.ID_Fuochi = s.id_fuoco
       WHERE s.id = ?`,
      [id],
    );
    return (rows[0] as Segnalazione) ?? null;
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
      `SELECT id, id_fuoco, tipo, campo, valore_attuale, valore_proposto, note, email, stato, created_at
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

  /** Ritira la segnatura solo se è ancora quella pubblicata da `idSegnalazione`. */
  async deleteSegnatura(idFuoco: number, idSegnalazione: number): Promise<void> {
    await this.db.query("DELETE FROM fuoco_segnature WHERE id_fuoco = ? AND id_segnalazione = ?", [
      idFuoco,
      idSegnalazione,
    ]);
  }
}
