import type { Distribution } from "@catasto/shared";

/**
 * Voci dei grafici a barre o a torta (`DistChart`), usate dalle statistiche
 * della Consultazione e dalla vista Grafici del Banco. Ogni voce ha una
 * chiave stabile, per confrontarla con la stessa voce su tutto il catasto.
 */
export interface ChartItem {
  key: string;
  label: string;
  n: number;
  /** «Non indicato» nella fonte: tratteggiato e sempre a parte. */
  missing?: boolean;
  /** Voce che raccoglie le altre («Altro»): in torta va in «Altre voci». */
  other?: boolean;
  /** Voci finite in «Altre voci» (solo nella torta). */
  rest?: string[];
}

/** Una distribuzione per categoria (mestieri, quartieri, stato civile), con «Altro» e «Non indicato» in coda. */
export function distributionItems(d: Distribution, labels: { other: string; notStated: string }): ChartItem[] {
  return [
    ...d.voci.map((v) => ({ key: `v:${v.label}`, label: v.label, n: v.n })),
    ...(d.altro > 0 ? [{ key: "altro", label: labels.other, n: d.altro, other: true }] : []),
    ...(d.assenti > 0 ? [{ key: "na", label: labels.notStated, n: d.assenti, missing: true }] : []),
  ];
}

/** Quota di ogni voce sul suo totale, per chiave: il confronto con tutto il catasto. */
export function sharesByKey(items: readonly ChartItem[]): Map<string, number> {
  const total = items.reduce((s, i) => s + i.n, 0);
  return new Map(items.map((i) => [i.key, total > 0 ? i.n / total : 0]));
}

/**
 * Voci per il confronto: quelle di tutto il catasto nel loro ordine, a zero
 * se mancano fra i fuochi mostrati, poi quelle che ha solo la selezione.
 * Così ogni tacca ha la sua riga.
 */
export function withCatastoItems(items: readonly ChartItem[], catasto: readonly ChartItem[]): ChartItem[] {
  const own = new Map(items.map((i) => [i.key, i]));
  const inCatasto = new Set(catasto.map((c) => c.key));
  return [...catasto.map((c) => own.get(c.key) ?? { ...c, n: 0 }), ...items.filter((i) => !inCatasto.has(i.key))];
}

/** Fette leggibili in una torta: oltre questo numero le più piccole si uniscono. */
export const PIE_MAX = 7;

/**
 * Fette della torta: voci vere in ordine di grandezza, le più piccole e
 * «Altro» insieme in «Altre voci», i non indicati per ultimi.
 */
export function pieSlices(items: readonly ChartItem[], otherLabel: string, max = PIE_MAX): ChartItem[] {
  const real = items.filter((i) => !i.missing && !i.other && i.n > 0).sort((a, b) => b.n - a.n);
  const others = items.filter((i) => i.other && i.n > 0);
  const missing = items.filter((i) => i.missing && i.n > 0);
  const keep = real.length + (others.length > 0 ? 1 : 0) > max ? real.slice(0, max - 1) : real;
  const rest = [...real.slice(keep.length), ...others];
  const restSlice: ChartItem[] =
    rest.length === 0
      ? []
      : rest.length === 1 && rest[0].other
        ? [rest[0]]
        : [{ key: "rest", label: otherLabel, n: rest.reduce((s, i) => s + i.n, 0), other: true, rest: rest.map((i) => i.label) }];
  return [...keep, ...restSlice, ...missing];
}
