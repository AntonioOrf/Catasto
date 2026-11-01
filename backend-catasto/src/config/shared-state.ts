/**
 * Dove vive lo stato che le istanze del backend devono condividere quando ne
 * girano più d'una (Kubernetes/OpenShift con più repliche, più VM dietro un
 * bilanciatore, Vercel): contatori dei rate limit e "generazione" delle cache.
 *
 * - vuota o `memory` (default): tutto in memoria, come con un solo container;
 * - `mysql`: nel database dell'applicazione, senza servizi aggiuntivi (niente
 *   Redis). Costa qualche scrittura in più sul DB per ogni richiesta /api.
 *
 * Un valore sconosciuto blocca l'avvio invece di ricadere in silenzio sulla
 * memoria: con più repliche i limiti diventerebbero N volte più larghi.
 */
export type SharedState = "memory" | "mysql";

export function parseSharedState(value: string | undefined): SharedState {
  const v = value?.trim().toLowerCase();
  if (!v || v === "memory") return "memory";
  if (v === "mysql") return "mysql";
  throw new Error(`SHARED_STATE non valida: "${value}" (valori ammessi: memory, mysql)`);
}

export const isSharedStateMysql = (): boolean => parseSharedState(process.env.SHARED_STATE) === "mysql";
