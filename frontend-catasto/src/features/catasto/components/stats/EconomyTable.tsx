import { STATS_METRICS, type CatastoStats, type MetricSummary } from "@catasto/shared";
import { useLanguage, useT } from "../../../../i18n";
import { statsMessages } from "./StatsPanel.messages";
import GlossaryTerm from "../../../glossary/GlossaryTerm";

const COLUMNS = ["present", "missing", "sum", "mean", "median", "q1", "q3", "min", "max"] as const;
const FIELD: Record<(typeof COLUMNS)[number], keyof MetricSummary> = {
  present: "presenti",
  missing: "assenti",
  sum: "somma",
  mean: "media",
  median: "mediana",
  q1: "q1",
  q3: "q3",
  min: "min",
  max: "max",
};

/** Tabella delle misure economiche: è già la forma accessibile, non serve un grafico. */
export default function EconomyTable({ economia }: { economia: CatastoStats["economia"] }) {
  const t = useT(statsMessages);
  const { locale } = useLanguage();
  const fmt = (value: number | null, counts: boolean) =>
    value === null ? null : value.toLocaleString(locale, { maximumFractionDigits: counts ? 0 : 2 });

  return (
    <div className="bg-bg-main border border-border-base rounded-ui p-3 md:p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm text-left">
          <caption className="text-left mb-2">
            <span className="block text-sm font-bold text-primary">{t("economyTitle")}</span>
            <span className="block text-xs text-text-accent">{t("economyCaption")}</span>
          </caption>
          <thead>
            <tr className="border-b border-border-base text-text-accent">
              <th scope="col" className="py-1.5 pr-3">{t("measure")}</th>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="py-1.5 px-2 text-right whitespace-nowrap">{t(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATS_METRICS.map((metric) => (
              <tr key={metric} className="border-b border-border-base/40">
                <th scope="row" className="py-1.5 pr-3 font-semibold text-text-main whitespace-nowrap">
                  {t(metric)} <GlossaryTerm id={metric} />
                </th>
                {COLUMNS.map((c) => {
                  const text = fmt(economia[metric][FIELD[c]], c === "present" || c === "missing");
                  return (
                    <td key={c} className="py-1.5 px-2 text-right tabular-nums text-text-main">
                      {text ?? (
                        <>
                          <span aria-hidden="true">{t("na")}</span>
                          <span className="sr-only">{t("naLabel")}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="mt-3 text-xs text-text-main">
        <summary className="cursor-pointer text-accent-strong font-semibold min-h-8 inline-flex items-center">{t("explainTitle")}</summary>
        <ul className="mt-2 space-y-1.5 list-disc pl-5">
          <li>{t("explainMean")}</li>
          <li>{t("explainMedian")}</li>
          <li>{t("explainQuartiles")}</li>
          <li>{t("explainMissing")}</li>
        </ul>
      </details>
    </div>
  );
}
