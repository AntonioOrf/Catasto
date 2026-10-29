import { IMPONIBILE_BANDS, type CatastoStats } from "@catasto/shared";
import type { ChartItem } from "../catasto/components/stats/chart-items";
import { bandLabel, boccheCounts } from "./charts";

// Voci dei grafici propri del Banco; le distribuzioni generiche stanno in chart-items.

/** Fasce dell'imponibile, nell'ordine di IMPONIBILE_BANDS. */
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
      return { key: `b${f.da}`, label: bandLabel(index, format, over), n: f.n };
    }),
    ...(fasce.assenti > 0 ? [{ key: "na", label: notStated, n: fasce.assenti, missing: true }] : []),
  ];
}

/** Bocche per fuoco, con le famiglie molto grandi in una voce sola. */
export function boccheItems(stats: CatastoStats, label: (n: number) => string): ChartItem[] {
  return boccheCounts(stats.membri).map((b) => ({ key: `m${b.bocche}`, label: label(b.bocche), n: b.fuochi }));
}
