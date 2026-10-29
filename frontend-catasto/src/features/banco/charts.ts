import { IMPONIBILE_BANDS, type CatastoStats } from "@catasto/shared";

/**
 * Dati dei tre grafici del Banco, calcolati dalle statistiche di tutta la
 * query (non dalla pagina), e la voce che contiene la riga attiva.
 */

/** Indice della fascia dell'imponibile che contiene il valore; -1 se manca. */
export function bandIndex(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return -1;
  for (let i = IMPONIBILE_BANDS.length - 1; i >= 0; i--) if (Number(value) >= IMPONIBILE_BANDS[i]) return i;
  return 0;
}

/** «0», «1–50», …, «oltre 1.000»: le cifre nella lingua data. */
export function bandLabel(index: number, format: (n: number) => string, over: (n: string) => string): string {
  const from = IMPONIBILE_BANDS[index];
  const next = IMPONIBILE_BANDS[index + 1];
  if (next === undefined) return over(format(from - 1));
  return next - 1 === from ? format(from) : `${format(from)}–${format(next - 1)}`;
}

/** Oltre questo numero le bocche si raggruppano: le famiglie così grandi sono rare. */
export const MAX_BOCCHE_BAR = 12;

/** Etichetta della barra delle bocche (stessa per il grafico e per la riga attiva). */
export const boccheKey = (n: number) => Math.min(n, MAX_BOCCHE_BAR);

export function boccheCounts(membri: CatastoStats["membri"]): { bocche: number; fuochi: number }[] {
  const counts = new Map<number, number>();
  for (const { membri: n, fuochi } of membri) counts.set(boccheKey(n), (counts.get(boccheKey(n)) ?? 0) + fuochi);
  return [...counts].sort((a, b) => a[0] - b[0]).map(([bocche, fuochi]) => ({ bocche, fuochi }));
}

/** Mediana di una distribuzione di frequenze (valore → quante volte); null se vuota. */
export function weightedMedian(counts: readonly { value: number; n: number }[]): number | null {
  const sorted = [...counts].filter((c) => c.n > 0).sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, c) => s + c.n, 0);
  if (total === 0) return null;
  // Posizioni 1-based dei due elementi centrali (coincidono se il totale è dispari).
  const lo = Math.floor((total + 1) / 2);
  const hi = Math.floor(total / 2) + 1;
  let seen = 0;
  let a: number | null = null;
  for (const c of sorted) {
    seen += c.n;
    if (a === null && seen >= lo) a = c.value;
    if (seen >= hi) return ((a ?? c.value) + c.value) / 2;
  }
  return a;
}
