import { useId } from "react";
import { useLanguage, useT } from "../../../i18n";
import { chartsViewMessages } from "../charts-view.messages";
import { PIE_MAX, pieSlices, type ChartItem } from "../charts-view";

export type ChartKind = "bar" | "pie";

interface DistChartProps {
  title: string;
  /** Unità e totale, sotto il titolo («fiorini · 1.214 fuochi»). */
  subtitle: string;
  items: ChartItem[];
  kind: ChartKind;
  onKind: (kind: ChartKind) => void;
  /** Quota della stessa voce su tutto il catasto; assente = nessun confronto. */
  catasto?: Map<string, number>;
  /** Restringe la query alla voce; assente = voci non cliccabili. */
  onRestrict?: (item: ChartItem) => void;
}

const SLICE_COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6", "--chart-7", "--chart-8"];
const HATCH_CSS = "repeating-linear-gradient(45deg,var(--chart-1) 0 2px,transparent 2px 5px)";

/** Corona circolare da a0 ad a1 (radianti, da mezzogiorno in senso orario). */
function arc(r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${(100 + r * Math.sin(a)).toFixed(2)},${(100 - r * Math.cos(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

/**
 * Un grafico della vista «Grafici»: barre orizzontali o torta ad anello, la
 * stessa informazione in tabella. Con il confronto ogni barra ha una tacca
 * alla quota di tutto il catasto e la legenda della torta la scrive. I non
 * indicati sono tratteggiati e restano a parte; un clic su una voce (barra,
 * fetta o voce di legenda) restringe la query, quando si può.
 */
export default function DistChart({ title, subtitle, items, kind, onKind, catasto, onRestrict }: DistChartProps) {
  const t = useT(chartsViewMessages);
  const { locale } = useLanguage();
  const id = useId();
  // useId contiene «:»: per un riferimento url(#…) serve un id semplice.
  const hatchId = `${id.replace(/[^\w-]/g, "")}-hatch`;
  const total = items.reduce((s, i) => s + i.n, 0);
  const fmt = (n: number) => new Intl.NumberFormat(locale, { useGrouping: "always" } as Intl.NumberFormatOptions).format(n);
  const pct = (share: number) => share.toLocaleString(locale, { style: "percent", maximumFractionDigits: 1 });
  const share = (n: number) => (total > 0 ? n / total : 0);
  const canRestrict = (item: ChartItem) => Boolean(onRestrict && item.restrict && !item.other);

  const label = (item: ChartItem) => {
    const cat = catasto?.get(item.key);
    return `${item.label}: ${fmt(item.n)} (${pct(share(item.n))})${cat !== undefined ? `, ${t("catastoShare", { p: pct(cat) })}` : ""}`;
  };

  const kindButton = (k: ChartKind, text: string) => (
    <button
      type="button"
      aria-pressed={kind === k}
      onClick={() => onKind(k)}
      className={`min-h-7 px-2 ${kind === k ? "bg-primary text-on-primary" : "text-text-accent hover:text-primary"}`}
    >
      {text}
    </button>
  );

  // --- barre ---
  const max = Math.max(1, ...items.map((i) => Math.max(i.n, (catasto?.get(i.key) ?? 0) * total)));
  const bars = (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const cat = catasto?.get(item.key);
        const clickable = canRestrict(item);
        const body = (
          <>
            <span className={`truncate text-right ${item.missing || item.other ? "italic text-text-accent" : ""}`}>{item.label}</span>
            <span className="relative h-3.5" aria-hidden="true">
              <span
                className={`absolute inset-y-0 left-0 rounded-r-ui ${item.missing || item.other ? "border border-chart-1/60" : "bg-chart-1"}`}
                style={{ width: `${(item.n / max) * 100}%`, ...(item.missing || item.other ? { backgroundImage: HATCH_CSS } : {}) }}
              />
              {cat !== undefined && <span className="absolute -inset-y-1 w-0.5 bg-text-main" style={{ left: `calc(${((cat * total) / max) * 100}% - 1px)` }} />}
            </span>
            <span className="tabular-nums whitespace-nowrap text-text-accent">
              <span className="font-semibold text-text-main">{fmt(item.n)}</span> ({pct(share(item.n))})
            </span>
          </>
        );
        const grid = "grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_7rem] gap-2 items-center w-full text-xs py-0.5 px-1 rounded-ui";
        return (
          <li key={item.key}>
            {clickable ? (
              <button type="button" onClick={() => onRestrict?.(item)} title={t("restrictTitle", { voce: item.label })} aria-label={`${label(item)}. ${t("restrictTitle", { voce: item.label })}`} className={`${grid} text-left hover:bg-item-hover`}>
                {body}
              </button>
            ) : (
              <div className={grid} title={label(item)}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // --- torta ---
  const slices = pieSlices(items, t("otherVoices"));
  const fill = (s: ChartItem, i: number) => (s.missing ? `url(#${hatchId})` : `var(${SLICE_COLORS[s.other ? SLICE_COLORS.length - 1 : i % (SLICE_COLORS.length - 1)]})`);
  const swatch = (s: ChartItem, i: number) => (s.missing ? { backgroundImage: HATCH_CSS } : { background: `var(${SLICE_COLORS[s.other ? SLICE_COLORS.length - 1 : i % (SLICE_COLORS.length - 1)]})` });
  let angle = 0;
  const pie = (
    <div className="grid gap-3 sm:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)] items-center">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${title}: ${slices.map((s) => `${s.label} ${pct(share(s.n))}`).join(", ")}`} className="w-full max-w-48 mx-auto">
        <defs>
          <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" style={{ fill: "var(--color-bg-card)" }} />
            <rect width="2" height="5" style={{ fill: "var(--chart-1)" }} />
          </pattern>
        </defs>
        {slices.map((s, i) => {
          const a0 = angle;
          angle += share(s.n) * 2 * Math.PI;
          const a1 = Math.min(angle, a0 + 2 * Math.PI - 1e-4);
          return (
            <path
              key={s.key}
              d={arc(52, 96, a0, a1)}
              style={{ fill: fill(s, i), stroke: "var(--color-bg-card)", strokeWidth: 1.5 }}
              className={canRestrict(s) ? "cursor-pointer hover:opacity-80" : ""}
              onClick={canRestrict(s) ? () => onRestrict?.(s) : undefined}
            >
              <title>{s.rest ? `${label(s)} — ${s.rest.join(", ")}` : label(s)}</title>
            </path>
          );
        })}
        <text x="100" y="98" textAnchor="middle" style={{ fill: "var(--color-text-main)", fontSize: 22, fontWeight: 700 }}>
          {fmt(total)}
        </text>
      </svg>
      <ul className="space-y-0.5 min-w-0 max-w-sm">
        {slices.map((s, i) => {
          const cat = catasto?.get(s.key);
          const body = (
            <>
              <span className="h-3 w-3 rounded-ui border border-chart-1/40" style={swatch(s, i)} aria-hidden="true" />
              <span className={`truncate ${s.missing || s.other ? "italic text-text-accent" : ""}`}>{s.label}</span>
              <span className="tabular-nums font-semibold">{pct(share(s.n))}</span>
              <span className="tabular-nums text-text-accent text-right min-w-16">{cat !== undefined ? t("catastoShare", { p: pct(cat) }) : fmt(s.n)}</span>
            </>
          );
          const grid = "grid grid-cols-[0.75rem_minmax(0,1fr)_auto_auto] gap-2 items-center w-full text-xs py-0.5 px-1 rounded-ui";
          return (
            <li key={s.key} title={s.rest?.join(", ")}>
              {canRestrict(s) ? (
                <button type="button" onClick={() => onRestrict?.(s)} aria-label={`${label(s)}. ${t("restrictTitle", { voce: s.label })}`} className={`${grid} text-left hover:bg-item-hover`}>
                  {body}
                </button>
              ) : (
                <div className={grid}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
  const merged = items.filter((i) => !i.missing).length > PIE_MAX;

  return (
    <figure aria-labelledby={`${id}-t`} className="bg-bg-card border border-border-base rounded-ui p-3 space-y-2 min-w-0">
      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span id={`${id}-t`} className="font-bold text-accent-strong">
          {title}
        </span>
        <span className="text-xs text-text-accent">{subtitle}</span>
        <span role="group" aria-label={t("shapeGroup")} className="ml-auto inline-flex border border-border-base/60 rounded-ui text-xs">
          {kindButton("bar", t("bars"))}
          {kindButton("pie", t("pie"))}
        </span>
      </figcaption>
      {kind === "pie" ? pie : bars}
      {kind === "pie" && merged && <p className="text-xs text-text-accent">{t("pieNote", { n: PIE_MAX })}</p>}
      <details className="text-xs">
        <summary className="cursor-pointer text-accent-strong font-semibold min-h-8 inline-flex items-center">{t("showTable")}</summary>
        <table className="mt-1 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-border-base">
              <th scope="col" className="py-1 pr-2">{t("voce")}</th>
              <th scope="col" className="py-1 pr-2 text-right">{t("numero")}</th>
              <th scope="col" className="py-1 pr-2 text-right">{t("quota")}</th>
              {catasto && <th scope="col" className="py-1 text-right">{t("quotaCatasto")}</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-b border-border-base/40">
                <th scope="row" className="py-1 pr-2 font-normal">{item.label}</th>
                <td className="py-1 pr-2 text-right tabular-nums">{fmt(item.n)}</td>
                <td className="py-1 pr-2 text-right tabular-nums">{pct(share(item.n))}</td>
                {catasto && <td className="py-1 text-right tabular-nums">{catasto.has(item.key) ? pct(catasto.get(item.key)!) : "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
