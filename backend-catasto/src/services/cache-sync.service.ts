import type { NextFunction, Request, Response } from "express";
import pool from "../config/db.js";
import { isSharedStateMysql } from "../config/shared-state.js";
import { CommonModel } from "../models/common.model.js";
import { TraduzioniModel } from "../models/traduzioni.model.js";

/**
 * Invalidazione delle cache in memoria (opzioni dei filtri e traduzioni) anche
 * quando girano più istanze del backend.
 *
 * POST /api/filters/cache/invalidate arriva a una sola istanza: con
 * `SHARED_STATE=mysql` quella incrementa la "generazione" in
 * `cache_generazioni` (migrazione 005), e ogni istanza, al più una volta ogni
 * SYNC_INTERVAL_MS, la rilegge e svuota le proprie cache se è cambiata. Il
 * controllo è pigro (fatto da una richiesta /api, non da un timer): funziona
 * anche su piattaforme serverless dove i processi vengono congelati.
 */
const CACHE_NAME = "filtri";
export const SYNC_INTERVAL_MS = 30_000;

let knownGeneration: number | undefined;
let lastCheck = 0;
let inFlight: Promise<void> | null = null;

/** Svuota le cache di questa istanza. */
export function clearLocalCaches(): void {
  CommonModel.invalidateFilters();
  TraduzioniModel.clearCache();
}

async function readGeneration(): Promise<number> {
  const [rows]: any = await pool.query("SELECT generazione FROM cache_generazioni WHERE nome = ?", [CACHE_NAME]);
  return rows[0] ? Number(rows[0].generazione) : 0;
}

/**
 * Svuota le cache di questa istanza e, con stato condiviso, segnala alle altre
 * di fare lo stesso.
 */
export async function invalidateCaches(): Promise<void> {
  clearLocalCaches();
  if (!isSharedStateMysql()) return;
  await pool.query(
    `INSERT INTO cache_generazioni (nome, generazione) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE generazione = generazione + 1`,
    [CACHE_NAME],
  );
  // Questa istanza è già allineata: niente secondo svuotamento al prossimo controllo.
  knownGeneration = await readGeneration();
  lastCheck = Date.now();
}

/**
 * Rilegge la generazione se l'ultimo controllo è più vecchio di
 * SYNC_INTERVAL_MS. Richieste concorrenti condividono la stessa query.
 */
export function syncCaches(now = Date.now()): Promise<void> {
  if (now - lastCheck < SYNC_INTERVAL_MS) return Promise.resolve();
  if (inFlight) return inFlight;
  lastCheck = now;
  inFlight = readGeneration()
    .then((generation) => {
      // Al primo controllo le cache sono vuote o appena caricate: basta
      // memorizzare la generazione.
      if (knownGeneration !== undefined && generation !== knownGeneration) clearLocalCaches();
      knownGeneration = generation;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Middleware per /api: un errore del controllo non blocca la richiesta, al
 * peggio le cache restano quelle vecchie fino al TTL.
 */
export function cacheSyncMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  syncCaches()
    .catch((error: Error) => console.warn("⚠️  Sincronizzazione cache fallita:", error.message))
    .finally(() => next());
}

/** Solo per i test. */
export function resetCacheSyncState(): void {
  knownGeneration = undefined;
  lastCheck = 0;
  inFlight = null;
}
