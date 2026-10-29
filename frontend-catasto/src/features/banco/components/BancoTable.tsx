import { ArrowDown, ArrowUp } from "lucide-react";
import type { CatastoStats, Fuoco } from "@catasto/shared";
import { CompareCheckbox } from "../../catasto/components/CatastoRow";
import { SELECTION_MAX_FUOCHI } from "@catasto/shared";
import type { AddTarget } from "../add-target";
import { useLanguage, useT } from "../../../i18n";
import { bancoMessages } from "../banco.messages";
import { weightedMedian } from "../charts";
import type { ColumnDef } from "../columns";

interface BancoTableProps {
  columns: ColumnDef[];
  rows: Fuoco[];
  label: (key: string) => string;
  stats?: CatastoStats;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  onSort: (sortKey: string) => void;
  activeId: number | null;
  onActive: (id: number) => void;
  onOpenCarta: (row: Fuoco) => void;
  loading: boolean;
  stale: boolean;
  fetching: boolean;
  error: string | null;
  onRetry: () => void;
  /** Destinazione della casella a sinistra: la selezione o una raccolta. */
  target: AddTarget;
}

const MISSING = "—";

/**
 * Casella della riga quando la destinazione è una raccolta: spuntata se il
 * fuoco è dentro; si toglie da qui come si aggiunge.
 */
function CollectionCheckbox({ row, target }: { row: Fuoco; target: AddTarget }) {
  const t = useT(bancoMessages);
  const checked = target.has(row.id);
  const disabled = !checked && target.full;
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      title={disabled ? t("collectionFull", { max: SELECTION_MAX_FUOCHI }) : undefined}
      className={`inline-flex items-center justify-center min-h-8 min-w-8 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => (checked ? target.remove([row.id]) : target.add([row.id]))}
        aria-label={t("inCollectionAria", { nome: row.nome, raccolta: target.nome ?? "" })}
        className="h-[15px] w-[15px] m-0"
      />
    </label>
  );
}

/**
 * Tabella densa del Banco: righe di 32 px, cifre tabellari allineate a
 * destra, righe alterne appena tinte; in fondo media e mediana di tutti i
 * risultati della query (dalle statistiche, non dalla pagina).
 */
export default function BancoTable(props: BancoTableProps) {
  const { columns, rows, label, stats, sortBy, sortOrder, onSort, activeId, onActive, onOpenCarta, loading, stale, fetching, error, onRetry, target } = props;
  const t = useT(bancoMessages);
  const { locale } = useLanguage();

  const number = (value: number | null | undefined, digits = 0) =>
    value === null || value === undefined || Number.isNaN(Number(value))
      ? null
      : // Separatore delle migliaia anche a quattro cifre: in colonna «7.919» si allinea con «19.190».
        new Intl.NumberFormat(locale, { maximumFractionDigits: digits, useGrouping: "always" } as Intl.NumberFormatOptions).format(Number(value));

  const cell = (col: ColumnDef, row: Fuoco) => {
    if (col.key === "localita") return [row.quartiere, row.popolo].filter((p) => p && p.trim()).join(" » ") || null;
    if (col.key === "campione") {
      const volume = row.volume || "?";
      const foglio = row.foglio || "?";
      const text = t("refShort", { volume, foglio });
      if (!row.codice_archivio) return text;
      return (
        <button
          type="button"
          onClick={() => onOpenCarta(row)}
          aria-label={t("openCarta", { volume, foglio })}
          className="text-primary underline underline-offset-[3px] decoration-primary/50 hover:decoration-primary whitespace-nowrap"
        >
          {text}
        </button>
      );
    }
    const value = col.prop ? row[col.prop] : undefined;
    if (col.kind === "number") return number(value as number | null, col.key === "eta_media" ? 1 : 2);
    return typeof value === "string" && value.trim() ? value : null;
  };

  // Media e mediana di tutta la query per le colonne che hanno una misura.
  const summary = (col: ColumnDef, kind: "media" | "mediana"): string | null => {
    if (!stats || !col.metric) return null;
    if (col.metric === "bocche") {
      if (kind === "media") return stats.fuochi > 0 ? number(stats.parenti / stats.fuochi, 1) : null;
      return number(weightedMedian(stats.membri.map((m) => ({ value: m.membri, n: m.fuochi }))), 1);
    }
    const m = stats.economia[col.metric];
    return number(kind === "media" ? m.media : m.mediana, kind === "media" ? 1 : 0);
  };

  const align = (col: ColumnDef) => (col.kind === "number" ? "text-right tabular-nums" : "text-left");
  const colSpan = columns.length + 1;

  return (
    <div className="overflow-x-auto border border-border-base rounded-ui">
      <table className="min-w-full text-sm" aria-busy={fetching}>
        <caption className="sr-only">{t("tableCaption")}</caption>
        <thead>
          <tr className="border-b border-border-base bg-bg-sidebar">
            <th scope="col" className="w-8 pl-2">
              <span className="sr-only">{t("select")}</span>
            </th>
            {columns.map((col) => {
              const active = col.sortKey && sortBy === col.sortKey;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sortOrder === "ASC" ? "ascending" : "descending") : col.sortKey ? "none" : undefined}
                  className={`px-2 py-1 font-semibold text-accent-strong whitespace-nowrap ${align(col)}`}
                >
                  {col.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.sortKey!)}
                      className={`inline-flex items-center gap-1 min-h-8 hover:underline underline-offset-4 ${col.kind === "number" ? "flex-row-reverse" : ""}`}
                    >
                      {label(col.key)}
                      {active &&
                        (sortOrder === "ASC" ? (
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden="true" />
                        ))}
                    </button>
                  ) : (
                    label(col.key)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`transition-opacity motion-reduce:transition-none ${stale ? "opacity-50" : ""}`}>
          {error ? (
            <tr>
              <td colSpan={colSpan} className="p-4">
                <div role="alert" className="text-center">
                  <p className="font-semibold">{t("loadError")}</p>
                  <p className="text-text-accent mb-2">{error}</p>
                  <button type="button" onClick={onRetry} className="min-h-9 px-3 rounded-ui border border-primary text-primary font-semibold">
                    {t("retry")}
                  </button>
                </div>
              </td>
            </tr>
          ) : loading ? (
            <tr>
              <td colSpan={colSpan} className="p-4 text-text-accent italic">
                {t("loading")}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-4 text-text-accent">
                {t("empty")}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = target.has(row.id);
              const isActive = activeId === row.id;
              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => onActive(row.id)}
                  onFocus={() => onActive(row.id)}
                  onClick={() => onActive(row.id)}
                  className={`h-8 border-b border-border-base/30 ${
                    selected ? "bg-primary/10" : isActive ? "bg-primary/5" : "odd:bg-bg-main even:bg-bg-sidebar/60"
                  }`}
                >
                  <td className={`w-8 pl-1.5 border-l-[3px] ${selected ? "border-l-primary" : "border-l-transparent"}`}>
                    {target.nome === null ? <CompareCheckbox row={row} /> : <CollectionCheckbox row={row} target={target} />}
                  </td>
                  {columns.map((col) => {
                    const value = cell(col, row);
                    return (
                      <td key={col.key} className={`px-2 py-0 whitespace-nowrap ${align(col)} ${col.key === "nome" ? "font-semibold text-text-main" : ""}`}>
                        {value === null || value === "" ? <span className="text-text-accent">{MISSING}</span> : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
        {stats && rows.length > 0 && !error && (
          <tfoot className="border-t-2 border-border-base text-text-accent">
            {(["media", "mediana"] as const).map((kind) => {
              const rowLabel = kind === "media" ? t("mean") : t("medianOf", { n: stats.fuochi.toLocaleString(locale) });
              // L'etichetta va nella prima colonna se non ha una misura da mostrare.
              const labelInFirst = !columns[0]?.metric;
              return (
                <tr key={kind} className="h-8">
                  <th scope="row" colSpan={labelInFirst ? 2 : 1} className="pl-2 pr-2 font-normal italic text-left whitespace-nowrap">
                    {rowLabel}
                  </th>
                  {columns.slice(labelInFirst ? 1 : 0).map((col) => (
                    <td key={col.key} className={`px-2 whitespace-nowrap ${align(col)}`}>
                      {summary(col, kind)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tfoot>
        )}
      </table>
    </div>
  );
}
