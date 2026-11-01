import rateLimit, { type Options } from "express-rate-limit";
import { isSharedStateMysql } from "../config/shared-state.js";
import { MysqlRateLimitStore } from "./mysql-rate-limit-store.js";

/**
 * Crea un rate limiter con le opzioni comuni del progetto. Con
 * `SHARED_STATE=mysql` i contatori stanno nel database e valgono per tutte le
 * istanze; altrimenti in memoria, come con un solo container.
 *
 * `name` identifica il limiter nello store condiviso: due limiter con lo
 * stesso nome sommerebbero i conteggi.
 */
export function createLimiter(name: string, options: Partial<Options>) {
  const shared = isSharedStateMysql();
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    ...(shared
      ? {
          store: new MysqlRateLimitStore(name),
          // Se il DB non risponde la richiesta passa: fallirebbe comunque
          // nella query successiva, e un 500 del limiter non aiuta nessuno.
          passOnStoreError: true,
        }
      : {}),
  });
}
