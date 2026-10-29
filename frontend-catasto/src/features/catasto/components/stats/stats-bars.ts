import type { CatastoStats, Distribution } from "@catasto/shared";
import type { Vars } from "../../../../i18n";
import type { BarDatum } from "./BarChart";
import type { statsMessages } from "./StatsPanel.messages";

type T = (key: keyof (typeof statsMessages)["it"], vars?: Vars) => string;

/** Oltre questo numero di membri le barre si raggruppano: le code lunghe sono rare. */
const MAX_MEMBERS_BAR = 12;

/** Voci di una distribuzione, con "Altro" e "Non indicato" in coda e distinti. */
export function distributionBars(d: Distribution, t: T): BarDatum[] {
  return [
    ...d.voci.map((v) => ({ label: v.label, n: v.n })),
    ...(d.altro > 0 ? [{ label: t("other"), n: d.altro, muted: true }] : []),
    ...(d.assenti > 0 ? [{ label: t("notStated"), n: d.assenti, muted: true }] : []),
  ];
}

export function memberBars(membri: CatastoStats["membri"], t: T): BarDatum[] {
  const bars: BarDatum[] = [];
  let over = 0;
  for (const { membri: n, fuochi } of membri) {
    if (n >= MAX_MEMBERS_BAR) over += fuochi;
    else bars.push({ label: n === 1 ? t("memberLabel") : t("membersLabel", { n }), n: fuochi });
  }
  if (over > 0) bars.push({ label: t("membersOver", { n: MAX_MEMBERS_BAR }), n: over });
  return bars;
}

