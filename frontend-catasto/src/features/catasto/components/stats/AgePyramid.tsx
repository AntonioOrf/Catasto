import { useId } from "react";
import type { CatastoStats } from "@catasto/shared";
import { useLanguage, useT } from "../../../../i18n";
import { statsMessages } from "./StatsPanel.messages";

const LAST_BAND = 90;

/**
 * Piramide delle età: una fascia per riga, i due sessi più frequenti ai due
 * lati. Due serie, quindi legenda e intestazioni dirette sopra ciascun lato:
 * il colore non è mai l'unico indizio. Altri valori del sesso (o assenti) e
 * le età mancanti sono riportati a parte, e tutto è anche in tabella.
 */
export default function AgePyramid({ eta }: { eta: CatastoStats["eta"] }) {
  const t = useT(statsMessages);
  const { locale } = useLanguage();
  const id = useId();
  const fmt = (n: number) => n.toLocaleString(locale);

  const bySex = new Map<string, number>();
  for (const f of eta.fasce) if (f.sesso) bySex.set(f.sesso, (bySex.get(f.sesso) ?? 0) + f.n);
  const [left, right] = [...bySex].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  const sides = [left, right].filter(Boolean) as string[];
  const otherSex = eta.fasce.filter((f) => !f.sesso || !sides.includes(f.sesso)).reduce((s, f) => s + f.n, 0);

  const bands = Array.from({ length: LAST_BAND / 5 + 1 }, (_, i) => LAST_BAND - i * 5);
  const value = (da: number, sesso?: string) =>
    sesso ? (eta.fasce.find((f) => f.da === da && f.sesso === sesso)?.n ?? 0) : 0;
  const max = Math.max(1, ...eta.fasce.map((f) => f.n));
  const bandLabel = (da: number) => (da === LAST_BAND ? `${LAST_BAND}+` : `${da}–${da + 4}`);
  const width = (n: number) => `${(n / max) * 100}%`;
  const colors = ["bg-chart-1", "bg-chart-2"];

  return (
    <figure aria-labelledby={`${id}-title`} className="bg-bg-main border border-border-base rounded p-3 md:p-4 space-y-3">
      <figcaption id={`${id}-title`} className="text-sm font-bold text-primary">
        {t("pyramid")}
      </figcaption>
      <ul className="flex flex-wrap gap-4 text-xs text-text-main" aria-label={t("pyramid")}>
        {sides.map((s, i) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${colors[i]}`} aria-hidden="true" /> {s}
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="text-[11px]">
        <div className="grid grid-cols-[1fr_3.25rem_1fr] gap-1 mb-1 font-semibold text-text-accent">
          <span className="text-right">{left}</span>
          <span className="text-center">{t("pyramidAge")}</span>
          <span>{right}</span>
        </div>
        {bands.map((da) => {
          const l = value(da, left);
          const r = value(da, right);
          return (
            <div key={da} className="grid grid-cols-[1fr_3.25rem_1fr] gap-1 items-center h-4" title={`${bandLabel(da)}: ${left} ${fmt(l)}${right ? `, ${right} ${fmt(r)}` : ""}`}>
              <span className="flex justify-end items-center gap-1 min-w-0">
                <span className="tabular-nums text-text-accent">{l > 0 ? fmt(l) : ""}</span>
                <span className={`h-3 rounded-l-[4px] ${colors[0]}`} style={{ width: width(l) }} />
              </span>
              <span className="text-center tabular-nums text-text-main">{bandLabel(da)}</span>
              <span className="flex items-center gap-1 min-w-0">
                <span className={`h-3 rounded-r-[4px] ${colors[1]}`} style={{ width: width(r) }} />
                <span className="tabular-nums text-text-accent">{r > 0 ? fmt(r) : ""}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-accent">
        {t("pyramidNote")} {t("ageMissing", { n: fmt(eta.assenti) })}
        {otherSex > 0 && ` · ${t("otherSex", { n: fmt(otherSex) })}`}
      </p>
      <details className="text-xs">
        <summary className="cursor-pointer text-accent-strong font-semibold min-h-8 inline-flex items-center">{t("showTable")}</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{t("pyramid")}</caption>
          <thead>
            <tr className="border-b border-border-base">
              <th scope="col" className="py-1 pr-2">{t("pyramidAge")}</th>
              {sides.map((s) => (
                <th key={s} scope="col" className="py-1 pr-2 text-right">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...bands].reverse().map((da) => (
              <tr key={da} className="border-b border-border-base/40">
                <th scope="row" className="py-1 pr-2 font-normal">{bandLabel(da)}</th>
                {sides.map((s) => (
                  <td key={s} className="py-1 pr-2 text-right tabular-nums">{fmt(value(da, s))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
