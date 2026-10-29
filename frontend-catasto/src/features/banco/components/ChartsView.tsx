import { useState } from "react";
import type { CatastoStats } from "@catasto/shared";
import { useLanguage, useT } from "../../../i18n";
import AgePyramid from "../../catasto/components/stats/AgePyramid";
import { statsMessages } from "../../catasto/components/stats/StatsPanel.messages";
import { bancoMessages } from "../banco.messages";
import { MAX_BOCCHE_BAR } from "../charts";
import { boccheItems, distributionItems, imponibileItems, sharesByKey, withCatastoItems, type ChartItem } from "../charts-view";
import { chartsViewMessages } from "../charts-view.messages";
import DistChart, { type ChartKind } from "./DistChart";

const KINDS_STORAGE_KEY = "catasto.banco.grafici.v1";
type ChartId = "imponibile" | "bocche" | "mestieri" | "quartieri" | "statoCivile";
const DEFAULT_KINDS: Record<ChartId, ChartKind> = { imponibile: "bar", bocche: "bar", mestieri: "pie", quartieri: "pie", statoCivile: "pie" };

function loadKinds(): Record<ChartId, ChartKind> {
  try {
    const saved = JSON.parse(localStorage.getItem(KINDS_STORAGE_KEY) ?? "{}");
    const kinds = { ...DEFAULT_KINDS };
    for (const key of Object.keys(kinds) as ChartId[]) if (saved[key] === "bar" || saved[key] === "pie") kinds[key] = saved[key];
    return kinds;
  } catch {
    return { ...DEFAULT_KINDS };
  }
}

/** Di quali fuochi sono i grafici: la destinazione, o tutto il catasto se è vuota. */
export type ChartsSubject = { kind: "raccolta"; nome: string; n: number } | { kind: "selezione"; n: number } | { kind: "tutto" };

interface ChartsViewProps {
  subject: ChartsSubject;
  stats?: CatastoStats;
  loading: boolean;
  error: string | null;
  unavailable: boolean;
  /** Statistiche di tutto il catasto, per il confronto (se acceso e se i grafici non sono già di tutto il catasto). */
  catasto?: CatastoStats;
  compare: boolean;
  onCompare: (on: boolean) => void;
}

/**
 * Vista «Grafici» del Banco: cifre di sintesi e grafici sui fuochi della
 * destinazione (selezione o raccolta), o su tutto il catasto se è vuota; a
 * barre o a torta, con il confronto facoltativo con tutto il catasto. Tutto
 * viene dalle statistiche (`/stats`).
 */
export default function ChartsView({ subject, stats, loading, error, unavailable, catasto, compare, onCompare }: ChartsViewProps) {
  const t = useT(chartsViewMessages);
  const tb = useT(bancoMessages);
  const ts = useT(statsMessages);
  const { locale } = useLanguage();
  const [kinds, setKinds] = useState(loadKinds);

  const setKind = (next: Record<ChartId, ChartKind>) => {
    setKinds(next);
    try {
      localStorage.setItem(KINDS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // non salvata: vale finché la pagina è aperta
    }
  };
  const allSame = Object.values(kinds).every((k) => k === kinds.imponibile) ? kinds.imponibile : "mix";

  if (unavailable) return <p className="text-sm text-text-accent italic">{tb("statsUnavailable")}</p>;
  if (error) return <p role="alert" className="text-sm text-text-accent">{tb("statsError")}: {error}</p>;
  if (!stats) return <p className="text-sm text-text-accent italic">{loading ? tb("loading") : ""}</p>;

  const fmt = (n: number, digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits, useGrouping: "always" } as Intl.NumberFormatOptions).format(n);
  const pct = (share: number) => share.toLocaleString(locale, { style: "percent", maximumFractionDigits: 1 });
  const labels = { other: ts("other"), notStated: ts("notStated") };
  const boccheLabel = (n: number) =>
    n >= MAX_BOCCHE_BAR ? tb("boccheOver", { n: MAX_BOCCHE_BAR }) : n === 0 ? tb("noBocche") : n === 1 ? tb("bocca") : tb("bocche", { n });

  const build = (s: CatastoStats): Record<ChartId, ChartItem[]> => ({
    imponibile: imponibileItems(s, (n) => fmt(n), (n) => tb("over", { n }), labels.notStated),
    bocche: boccheItems(s, boccheLabel),
    mestieri: distributionItems(s.mestieri, labels),
    quartieri: distributionItems(s.quartieri, labels),
    statoCivile: distributionItems(s.statoCivile, labels),
  });
  const data = build(stats);
  // Grafici già di tutto il catasto: niente da confrontare.
  const comparing = compare && subject.kind !== "tutto";
  const all = comparing && catasto ? build(catasto) : null;
  const shares = (id: ChartId) => (all ? sharesByKey(all[id]) : undefined);

  // --- cifre di sintesi ---
  const kpi = (s: CatastoStats) => ({
    bocche: s.fuochi > 0 ? s.parenti / s.fuochi : null,
    mediana: s.economia.imponibile.mediana,
    senza: s.fuochi > 0 ? s.economia.imponibile.assenti / s.fuochi : null,
  });
  const q = kpi(stats);
  const c = catasto ? kpi(catasto) : null;
  const showC = comparing && c && catasto;
  const kpis = [
    { v: fmt(stats.fuochi), l: t("kpiFuochi"), c: showC ? t("kpiOf", { n: fmt(catasto.fuochi) }) : null },
    { v: fmt(stats.parenti), l: t("kpiParenti"), c: showC ? t("kpiOf", { n: fmt(catasto.parenti) }) : null },
    { v: q.bocche === null ? "—" : fmt(q.bocche, 1), l: t("kpiBocche"), c: showC && c.bocche !== null ? t("kpiCatasto", { v: fmt(c.bocche, 1) }) : null },
    { v: q.mediana === null ? "—" : t("fl", { n: fmt(q.mediana) }), l: t("kpiMediana"), c: showC && c.mediana !== null ? t("kpiCatasto", { v: t("fl", { n: fmt(c.mediana) }) }) : null },
    { v: q.senza === null ? "—" : pct(q.senza), l: t("kpiSenza"), c: showC && c.senza !== null ? t("kpiCatasto", { v: pct(c.senza) }) : null },
  ];

  const chart = (id: ChartId, title: string, subtitle: string) => (
    <DistChart
      key={id}
      title={title}
      subtitle={subtitle}
      items={all ? withCatastoItems(data[id], all[id]) : data[id]}
      kind={kinds[id]}
      onKind={(k) => setKind({ ...kinds, [id]: k })}
      catasto={shares(id)}
    />
  );
  const fuochiTot = t("totalFuochi", { n: fmt(stats.fuochi) });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text-accent">
        <p className="text-base text-text-main">
          {subject.kind === "tutto" ? (
            t("subjectAll")
          ) : (
            <>
              {t("subjectOf")}{" "}
              <strong className="font-semibold">
                {subject.kind === "raccolta" ? t("subjectCollection", { nome: subject.nome }) : t("subjectSelection")}
              </strong>{" "}
              <span className="text-text-accent tabular-nums">({subject.n === 1 ? t("oneFuoco") : t("totalFuochi", { n: fmt(subject.n) })})</span>
            </>
          )}
        </p>
        {subject.kind !== "tutto" && (
          <label className="inline-flex items-center gap-2 min-h-9 cursor-pointer">
            <input type="checkbox" checked={compare} onChange={(e) => onCompare(e.target.checked)} />
            {t("compareAll")}
          </label>
        )}
        <label className="inline-flex items-center gap-2">
          {t("shape")}
          <select
            value={allSame}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "bar" || v === "pie") setKind({ imponibile: v, bocche: v, mestieri: v, quartieri: v, statoCivile: v });
            }}
            className="min-h-9 border border-border-base rounded-ui px-1 bg-bg-main text-text-main"
          >
            <option value="bar">{t("shapeBar")}</option>
            <option value="pie">{t("shapePie")}</option>
            <option value="mix" disabled>
              {t("shapeMix")}
            </option>
          </select>
        </label>
        {comparing && !catasto && <span className="italic">{t("loadingAll")}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-border-base rounded-ui bg-bg-card overflow-hidden">
        {kpis.map((k) => (
          <p key={k.l} className="px-3 py-2 border-l border-t border-border-base/40 -ml-px -mt-px min-w-0">
            <span className="block text-2xl font-bold tabular-nums leading-tight">{k.v}</span>
            <span className="block text-sm text-text-accent">{k.l}</span>
            {k.c && <span className="block text-xs text-text-accent tabular-nums">{k.c}</span>}
          </p>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-accent" aria-label={t("legendQuery")}>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 bg-chart-1 rounded-ui" aria-hidden="true" /> {t("legendQuery")}
        </li>
        {all && catasto && (
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-0.5 bg-text-main" aria-hidden="true" /> {t("legendAll", { n: fmt(catasto.fuochi) })}
          </li>
        )}
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 border border-chart-1/60 bg-[repeating-linear-gradient(45deg,var(--chart-1)_0_2px,transparent_2px_5px)]" aria-hidden="true" />{" "}
          {t("legendMissing")}
        </li>
      </ul>

      <div className="grid gap-3 lg:grid-cols-2">
        {chart("imponibile", t("chartImponibile"), `${t("unitFiorini")} · ${fuochiTot}`)}
        {chart("bocche", t("chartBocche"), `${t("unitParenti")} · ${fuochiTot}`)}
        {chart("mestieri", t("chartMestieri"), fuochiTot)}
        {chart("quartieri", t("chartQuartieri"), fuochiTot)}
        <AgePyramid eta={stats.eta} />
        {chart("statoCivile", t("chartStatoCivile"), t("totalParenti", { n: fmt(stats.parenti) }))}
      </div>
    </div>
  );
}
