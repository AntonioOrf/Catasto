import { useState } from "react";
import Spinner from "../../../../components/common/Spinner";
import { useCatastoStats } from "../../../../hooks/useCatastoStats";
import type { SearchParams } from "../../lib/simple-filters";
import { useLanguage, useT } from "../../../../i18n";
import { distributionItems, type ChartItem } from "./chart-items";
import DistChart, { type ChartKind } from "./DistChart";
import { memberBars } from "./stats-bars";
import AgePyramid from "./AgePyramid";
import EconomyTable from "./EconomyTable";
import { statsMessages } from "./StatsPanel.messages";

/** Barre o torta per ogni grafico, ricordate sul dispositivo. */
const KINDS_STORAGE_KEY = "catasto.statistiche.grafici.v1";
type ChartId = "mestieri" | "quartieri" | "serie" | "membri" | "statoCivile";

function loadKinds(): Partial<Record<ChartId, ChartKind>> {
  try {
    const saved = JSON.parse(localStorage.getItem(KINDS_STORAGE_KEY) ?? "{}");
    return typeof saved === "object" && saved !== null ? saved : {};
  } catch {
    return {};
  }
}

/**
 * Pannello "Statistiche": aggregati calcolati dal backend sulla stessa
 * ricerca della tabella (filtri semplici o AST). Ogni distribuzione si legge
 * a barre o a torta.
 */
export default function StatsPanel({ search }: { search: SearchParams }) {
  const t = useT(statsMessages);
  const { locale } = useLanguage();
  const { stats, loading, fetching, stale, error, unavailable, retry } = useCatastoStats(search, true);
  const [kinds, setKinds] = useState(loadKinds);
  const setKind = (id: ChartId, kind: ChartKind) => {
    const next = { ...kinds, [id]: kind };
    setKinds(next);
    try {
      localStorage.setItem(KINDS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // non salvata: vale finché la pagina è aperta
    }
  };

  if (unavailable) {
    return (
      <div role="status" className="px-6 py-10 text-center bg-bg-sidebar border border-border-base rounded-ui">
        <p className="font-bold mb-1">{t("unavailableTitle")}</p>
        <p className="text-sm text-text-accent">{t("unavailableBody")}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="px-6 py-10 text-center bg-red-500/10 border border-red-500/40 rounded-ui">
        <p className="font-bold mb-1">{t("error")}</p>
        <p className="text-sm text-text-accent mb-4">{error}</p>
        <button type="button" onClick={retry} className="inline-flex items-center min-h-11 px-4 rounded-ui bg-primary text-on-primary text-sm font-bold">
          {t("retry")}
        </button>
      </div>
    );
  }
  if (loading || !stats) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner label={t("loading")} />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString(locale);
  const labels = { other: t("other"), notStated: t("notStated") };
  const chart = (id: ChartId, title: string, items: ChartItem[], total: string) => (
    <DistChart key={id} title={title} subtitle={total} items={items} kind={kinds[id] === "pie" ? "pie" : "bar"} onKind={(k) => setKind(id, k)} />
  );
  const fuochi = t("totalFuochi", { n: fmt(stats.fuochi) });
  const parenti = t("totalParenti", { n: fmt(stats.parenti) });
  const media = stats.fuochi > 0 ? (stats.parenti / stats.fuochi).toLocaleString(locale, { maximumFractionDigits: 2 }) : "—";
  const tiles = [
    [t("households"), fmt(stats.fuochi)],
    [t("relatives"), fmt(stats.parenti)],
    [t("avgMembers"), media],
  ];

  return (
    <section
      aria-labelledby="stats-heading"
      aria-busy={fetching}
      className={`space-y-4 pb-12 transition-opacity motion-reduce:transition-none ${stale ? "opacity-50" : ""}`}
    >
      <div>
        <h2 id="stats-heading" className="text-lg md:text-xl font-bold text-primary font-serif">{t("heading")}</h2>
        <p className="text-sm text-text-accent">{t("intro")}</p>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="bg-bg-main border border-border-base rounded-ui p-3">
            <dt className="text-xs small-caps text-text-accent">{label}</dt>
            <dd className="text-2xl font-bold text-text-main tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {stats.fuochi === 0 ? (
        <p className="text-text-accent italic">{t("empty")}</p>
      ) : (
        <>
          <EconomyTable economia={stats.economia} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {chart("mestieri", t("occupations"), distributionItems(stats.mestieri, labels), fuochi)}
            {chart("quartieri", t("quarters"), distributionItems(stats.quartieri, labels), fuochi)}
            {chart("serie", t("series"), distributionItems(stats.serie, labels), fuochi)}
            {chart("membri", t("members"), memberBars(stats.membri, t), fuochi)}
            <AgePyramid eta={stats.eta} />
            {chart("statoCivile", t("maritalStatus"), distributionItems(stats.statoCivile, labels), parenti)}
          </div>
        </>
      )}
    </section>
  );
}
