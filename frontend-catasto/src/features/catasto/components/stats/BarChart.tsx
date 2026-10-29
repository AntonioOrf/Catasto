import { useId } from "react";
import { useLanguage, useT } from "../../../../i18n";
import { statsMessages } from "./StatsPanel.messages";

export interface BarDatum {
  label: string;
  n: number;
  /** Voci di servizio ("Altro", "Non indicato"): barra a tratteggio, non una categoria vera. */
  muted?: boolean;
}

interface BarChartProps {
  title: string;
  data: BarDatum[];
  note?: string;
}

/**
 * Barre orizzontali in HTML: una sola serie, quindi nessuna legenda; ogni
 * barra ha accanto etichetta, valore e quota, così nessuna informazione sta
 * nel solo colore. Sotto, la stessa informazione come tabella.
 */
export default function BarChart({ title, data, note }: BarChartProps) {
  const t = useT(statsMessages);
  const { locale } = useLanguage();
  const id = useId();
  const total = data.reduce((s, d) => s + d.n, 0);
  const max = Math.max(1, ...data.map((d) => d.n));
  const fmt = (n: number) => n.toLocaleString(locale);
  const pct = (n: number) =>
    total > 0 ? (n / total).toLocaleString(locale, { style: "percent", maximumFractionDigits: 1 }) : "";

  return (
    <figure aria-labelledby={`${id}-title`} className="bg-bg-main border border-border-base rounded-ui p-3 md:p-4 space-y-3">
      <figcaption id={`${id}-title`} className="text-sm font-bold text-primary">
        {title}
      </figcaption>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-2 items-center text-xs" title={`${d.label}: ${fmt(d.n)} (${pct(d.n)})`}>
            <span className={`truncate text-right ${d.muted ? "italic text-text-accent" : "text-text-main"}`}>{d.label}</span>
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={`h-3 rounded-r-ui shrink-0 ${d.muted ? "bg-[repeating-linear-gradient(45deg,var(--chart-1)_0_2px,transparent_2px_5px)] border border-chart-1/60" : "bg-chart-1"}`}
                style={{ width: `${Math.max((d.n / max) * 75, d.n > 0 ? 0.5 : 0)}%` }}
              />
              <span className="tabular-nums text-text-main whitespace-nowrap">
                {fmt(d.n)} <span className="text-text-accent">({pct(d.n)})</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="text-xs text-text-accent">{note}</p>}
      <details className="text-xs">
        <summary className="cursor-pointer text-accent-strong font-semibold min-h-8 inline-flex items-center">{t("showTable")}</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-border-base">
              <th scope="col" className="py-1 pr-2">{t("category")}</th>
              <th scope="col" className="py-1 pr-2 text-right">{t("count")}</th>
              <th scope="col" className="py-1 text-right">{t("share")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border-base/40">
                <th scope="row" className="py-1 pr-2 font-normal">{d.label}</th>
                <td className="py-1 pr-2 text-right tabular-nums">{fmt(d.n)}</td>
                <td className="py-1 text-right tabular-nums">{pct(d.n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
