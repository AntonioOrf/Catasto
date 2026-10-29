import type { CatastoStats } from "@catasto/shared";
import type { Vars } from "../../../../i18n";
import type { ChartItem } from "./chart-items";
import type { statsMessages } from "./StatsPanel.messages";

type T = (key: keyof (typeof statsMessages)["it"], vars?: Vars) => string;

/** Oltre questo numero di membri le barre si raggruppano: le code lunghe sono rare. */
const MAX_MEMBERS_BAR = 12;

export function memberBars(membri: CatastoStats["membri"], t: T): ChartItem[] {
  const bars: ChartItem[] = [];
  let over = 0;
  for (const { membri: n, fuochi } of membri) {
    if (n >= MAX_MEMBERS_BAR) over += fuochi;
    else bars.push({ key: `m${n}`, label: n === 1 ? t("memberLabel") : t("membersLabel", { n }), n: fuochi });
  }
  if (over > 0) bars.push({ key: "over", label: t("membersOver", { n: MAX_MEMBERS_BAR }), n: over });
  return bars;
}
