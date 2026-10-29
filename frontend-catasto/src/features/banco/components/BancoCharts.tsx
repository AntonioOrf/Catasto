import { IMPONIBILE_BANDS, type CatastoStats, type Fuoco } from "@catasto/shared";
import BarChart, { type BarDatum } from "../../catasto/components/stats/BarChart";
import { distributionBars } from "../../catasto/components/stats/stats-bars";
import { statsMessages } from "../../catasto/components/stats/StatsPanel.messages";
import { useLanguage, useT } from "../../../i18n";
import { bancoMessages } from "../banco.messages";
import { MAX_BOCCHE_BAR, bandIndex, bandLabel, boccheCounts, boccheKey } from "../charts";

interface BancoChartsProps {
  stats?: CatastoStats;
  loading: boolean;
  error: string | null;
  unavailable: boolean;
  /** Riga attiva della tabella: la sua voce si evidenzia in ogni grafico. */
  active: Fuoco | null;
}

/** Imponibile per fasce, bocche per fuoco e mestieri più frequenti, su tutta la query. */
export default function BancoCharts({ stats, loading, error, unavailable, active }: BancoChartsProps) {
  const t = useT(bancoMessages);
  const ts = useT(statsMessages);
  const { locale } = useLanguage();

  if (unavailable) return <p className="text-sm text-text-accent italic">{t("statsUnavailable")}</p>;
  if (error) return <p role="alert" className="text-sm text-text-accent">{t("statsError")}: {error}</p>;
  if (!stats) return <p className="text-sm text-text-accent italic">{loading ? t("loading") : ""}</p>;

  const format = (n: number) => new Intl.NumberFormat(locale, { useGrouping: "always" } as Intl.NumberFormatOptions).format(n);
  const over = (n: string) => t("over", { n });
  const notStated = ts("notStated");

  // Le fasce possono mancare con un backend non ancora aggiornato.
  const fasce = stats.fasceImponibile;
  const imponibile: BarDatum[] | null = fasce
    ? [
        ...fasce.fasce.map((f, i) => ({ label: bandLabel(i, format, over), n: f.n })),
        ...(fasce.assenti > 0 ? [{ label: notStated, n: fasce.assenti, muted: true }] : []),
      ]
    : null;
  const activeBand = active ? bandIndex(active.imponibile) : null;
  const imponibileHighlight =
    activeBand === null ? null : activeBand === -1 ? notStated : activeBand < IMPONIBILE_BANDS.length ? bandLabel(activeBand, format, over) : null;

  const boccheLabel = (n: number) =>
    n >= MAX_BOCCHE_BAR ? t("boccheOver", { n: MAX_BOCCHE_BAR }) : n === 0 ? t("noBocche") : n === 1 ? t("bocca") : t("bocche", { n });
  const bocche = boccheCounts(stats.membri).map((b) => ({ label: boccheLabel(b.bocche), n: b.fuochi }));
  const boccheHighlight = active?.bocche !== undefined ? boccheLabel(boccheKey(active.bocche)) : null;

  const mestieri = distributionBars(stats.mestieri, ts);
  // Un mestiere fuori dai più frequenti sta nella barra «Altro».
  const mestiereHighlight = !active
    ? null
    : !active.mestiere?.trim()
      ? notStated
      : stats.mestieri.voci.some((v) => v.label === active.mestiere)
        ? active.mestiere
        : ts("other");

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
      {imponibile && <BarChart title={t("chartImponibile")} data={imponibile} highlight={imponibileHighlight} />}
      <BarChart title={t("chartBocche")} data={bocche} highlight={boccheHighlight} />
      <BarChart title={t("chartMestieri")} data={mestieri} highlight={mestiereHighlight} />
    </div>
  );
}
