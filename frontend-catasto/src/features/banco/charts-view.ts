import { IMPONIBILE_BANDS, type CatastoStats, type Distribution, type FilterOption, type QueryCondition } from "@catasto/shared";
import { bandLabel, boccheCounts } from "./charts";

/**
 * Dati dei grafici della vista «Grafici» del Banco, dalle statistiche di
 * tutta la query. Ogni voce ha una chiave stabile (per confrontarla con la
 * stessa voce su tutto il catasto) e, se la query si può restringere a quella
 * voce, le condizioni da aggiungere.
 */
export interface ChartItem {
  key: string;
  label: string;
  n: number;
  /** «Non indicato» nella fonte: tratteggiato e sempre a parte. */
  missing?: boolean;
  /** Voce che raccoglie le altre («Altro»): non si restringe e in torta va in «Altre voci». */
  other?: boolean;
  /** Voci finite in «Altre voci» (solo nella torta). */
  rest?: string[];
  restrict?: QueryCondition[];
}

const cond = (field: string, operator: QueryCondition["operator"], value?: QueryCondition["value"]): QueryCondition =>
  value === undefined ? { kind: "condition", field, operator } : { kind: "condition", field, operator, value };

/** Fasce dell'imponibile: ognuna restringe a «≥ inizio e < inizio della successiva», come le conta il backend. */
export function imponibileItems(
  stats: CatastoStats,
  format: (n: number) => string,
  over: (n: string) => string,
  notStated: string,
): ChartItem[] {
  const fasce = stats.fasceImponibile;
  if (!fasce) return [];
  return [
    ...fasce.fasce.map((f) => {
      // Dal valore, non dalla posizione: una fascia mancante non sposta le altre.
      const index = (IMPONIBILE_BANDS as readonly number[]).indexOf(f.da);
      const next = IMPONIBILE_BANDS[index + 1];
      return {
        key: `b${f.da}`,
        label: bandLabel(index, format, over),
        n: f.n,
        restrict: [cond("imponibile", "gte", f.da), ...(next === undefined ? [] : [cond("imponibile", "lt", next)])],
      };
    }),
    ...(fasce.assenti > 0 ? [{ key: "na", label: notStated, n: fasce.assenti, missing: true, restrict: [cond("imponibile", "is_empty")] }] : []),
  ];
}

/** Bocche per fuoco: non sono un campo della query, quindi non restringono. */
export function boccheItems(stats: CatastoStats, label: (n: number) => string): ChartItem[] {
  return boccheCounts(stats.membri).map((b) => ({ key: `m${b.bocche}`, label: label(b.bocche), n: b.fuochi }));
}

/**
 * Una distribuzione per categoria (mestieri, quartieri, stato civile). Una
 * voce restringe la query se il campo c'è e l'etichetta corrisponde a una
 * delle opzioni dei filtri (stessa lingua delle statistiche).
 */
export function distributionItems(
  d: Distribution,
  labels: { other: string; notStated: string },
  field?: { key: string; options: readonly FilterOption[] },
): ChartItem[] {
  const idOf = (label: string) => field?.options.find((o) => o.label === label)?.id;
  return [
    ...d.voci.map((v) => {
      const id = idOf(v.label);
      return { key: `v:${v.label}`, label: v.label, n: v.n, ...(field && id !== undefined ? { restrict: [cond(field.key, "eq", id)] } : {}) };
    }),
    ...(d.altro > 0 ? [{ key: "altro", label: labels.other, n: d.altro, other: true }] : []),
    ...(d.assenti > 0
      ? [{ key: "na", label: labels.notStated, n: d.assenti, missing: true, ...(field ? { restrict: [cond(field.key, "is_empty")] } : {}) }]
      : []),
  ];
}

/** Quota di ogni voce sul suo totale, per chiave: il confronto con tutto il catasto. */
export function sharesByKey(items: readonly ChartItem[]): Map<string, number> {
  const total = items.reduce((s, i) => s + i.n, 0);
  return new Map(items.map((i) => [i.key, total > 0 ? i.n / total : 0]));
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
