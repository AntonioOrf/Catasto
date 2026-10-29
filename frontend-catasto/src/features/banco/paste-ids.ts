import { SELECTION_MAX_FUOCHI } from "@catasto/shared";

export interface PastedIds {
  /** Id distinti, nell'ordine in cui compaiono, al massimo `max`. */
  ids: number[];
  /** Numeri che comparivano più di una volta (contati una volta). */
  repeated: number;
  /** Id distinti scartati perché oltre il limite. */
  over: number;
}

/**
 * Numeri dei fuochi da un testo incollato: qualunque separatore va bene
 * (virgole, spazi, a capo, tabulazioni di un foglio di calcolo, «#»).
 */
export function parsePastedIds(text: string, max: number = SELECTION_MAX_FUOCHI): PastedIds {
  const all = (text.match(/\d{1,10}/g) ?? []).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0);
  const distinct = [...new Set(all)];
  return { ids: distinct.slice(0, max), repeated: all.length - distinct.length, over: Math.max(0, distinct.length - max) };
}
