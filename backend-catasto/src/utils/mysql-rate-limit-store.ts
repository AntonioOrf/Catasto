import type { ClientRateLimitInfo, Options, Store } from "express-rate-limit";
import pool from "../config/db.js";

/**
 * Store di express-rate-limit sulla tabella `rate_limit_hits` (migrazione
 * 005): i conteggi sono condivisi da tutte le istanze del backend, così con N
 * repliche il limite resta quello dichiarato e non diventa N volte più largo.
 *
 * Gli orari sono sempre calcolati dal database (NOW(3)): gli orologi delle
 * istanze possono divergere, e i fusi orari di Node e della sessione MySQL
 * non entrano in gioco.
 */

// Una volta ogni tante richieste si cancellano le righe scadute da tempo:
// niente job esterni da configurare, e la tabella resta piccola.
const CLEANUP_PROBABILITY = 0.01;

export class MysqlRateLimitStore implements Store {
  windowMs = 60_000;
  // Le chiavi (IP) sono condivise fra istanze: express-rate-limit non deve
  // trattarle come locali al processo.
  localKeys = false;

  /** `prefix` distingue i limiter (api, export, stats...) che contano lo stesso IP. */
  constructor(readonly prefix: string) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const [rows]: any = await pool.query(
      `SELECT hits, TIMESTAMPDIFF(MICROSECOND, NOW(3), reset_at) DIV 1000 AS ms_left
       FROM rate_limit_hits WHERE chiave = ? AND reset_at > NOW(3)`,
      [this.key(key)],
    );
    if (!rows[0]) return undefined;
    return { totalHits: Number(rows[0].hits), resetTime: new Date(Date.now() + Number(rows[0].ms_left)) };
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const k = this.key(key);
    const windowUs = this.windowMs * 1000;
    // Upsert atomico: finestra scaduta = si riparte da 1 con una nuova
    // scadenza, altrimenti +1. `hits` è assegnato prima di `reset_at`, quindi
    // entrambe le condizioni leggono il reset_at precedente.
    await pool.query(
      `INSERT INTO rate_limit_hits (chiave, hits, reset_at)
       VALUES (?, 1, NOW(3) + INTERVAL ? MICROSECOND)
       ON DUPLICATE KEY UPDATE
         hits = IF(reset_at <= NOW(3), 1, hits + 1),
         reset_at = IF(reset_at <= NOW(3), NOW(3) + INTERVAL ? MICROSECOND, reset_at)`,
      [k, windowUs, windowUs],
    );

    if (Math.random() < CLEANUP_PROBABILITY) {
      pool
        .query("DELETE FROM rate_limit_hits WHERE reset_at < NOW(3) - INTERVAL 1 HOUR LIMIT 1000")
        .catch((error: Error) => console.warn("⚠️  Pulizia rate_limit_hits fallita:", error.message));
    }

    const info = await this.get(key);
    // Riga appena scaduta fra le due query: la richiesta conta come la prima
    // della finestra successiva.
    return info ?? { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
  }

  async decrement(key: string): Promise<void> {
    await pool.query(
      "UPDATE rate_limit_hits SET hits = GREATEST(hits - 1, 0) WHERE chiave = ? AND reset_at > NOW(3)",
      [this.key(key)],
    );
  }

  async resetKey(key: string): Promise<void> {
    await pool.query("DELETE FROM rate_limit_hits WHERE chiave = ?", [this.key(key)]);
  }
}
