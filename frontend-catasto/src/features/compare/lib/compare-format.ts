import type { Parenti } from "@catasto/shared";

/**
 * Differenza rispetto al primo fuoco del confronto. Null se manca uno dei due
 * valori: con un dato assente la differenza non esiste (non è "tutto il valore").
 */
export function diffFromFirst(value: number | null | undefined, first: number | null | undefined): number | null {
  if (value === null || value === undefined || first === null || first === undefined) return null;
  return Number(value) - Number(first);
}

/** Età dei parenti, dalla più alta; le assenti in fondo come "?". */
export function etaList(parenti: Parenti[]): string {
  const known = parenti.filter((p) => p.eta !== null && p.eta !== undefined).map((p) => Number(p.eta)).sort((a, b) => b - a);
  const unknown = parenti.length - known.length;
  return [...known.map(String), ...Array<string>(unknown).fill("?")].join(", ");
}

/** Conteggio per stato civile: "Sposato 2 · Celibe 1"; gli assenti con l'etichetta data. */
export function statoCivileSummary(parenti: Parenti[], missingLabel: string): string {
  const counts = new Map<string, number>();
  for (const p of parenti) {
    const label = p.stato_civile?.trim() || missingLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([label, n]) => `${label} ${n}`).join(" · ");
}
