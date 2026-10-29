import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { downloadExport, type ExportFormat } from "../../../api/catastoService";
import { userMessage } from "../../../api/client";
import type { SearchParams } from "../lib/simple-filters";
import { saveBlob } from "../lib/download";
import { useLanguage, useT } from "../../../i18n";
import { exportMenuMessages } from "./ExportMenu.messages";

interface ExportMenuProps {
  /** La ricerca mostrata in tabella: l'export contiene esattamente quelle righe. */
  search: SearchParams;
  totalRecords: number;
}

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "done"; files: string } | { kind: "error"; message: string };

/**
 * Pulsante "Esporta" sopra la tabella, con un pannello a scomparsa per
 * formato, separatore e parenti. Funziona con la ricerca semplice e con
 * quella avanzata. Il tetto di righe lo decide il backend: oltre, la risposta
 * è un 400 il cui messaggio compare qui.
 */
export default function ExportMenu({ search, totalRecords }: ExportMenuProps) {
  const t = useT(exportMenuMessages);
  const { lang, locale } = useLanguage();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  // Excel in italiano apre bene solo il punto e virgola; R e Python preferiscono la virgola.
  const [sep, setSep] = useState<"comma" | "semicolon">(lang === "it" ? "semicolon" : "comma");
  const [parenti, setParenti] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Esc e clic fuori chiudono il pannello, come un menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  const handleDownload = async () => {
    setStatus({ kind: "busy" });
    try {
      // CSV con i parenti = due file: prima i fuochi, poi i parenti.
      const requests = format === "csv" && parenti ? [false, true] : [parenti];
      const files: string[] = [];
      for (const onlyParenti of requests) {
        const { blob, filename } = await downloadExport(search, { format, parenti: onlyParenti, sep });
        saveBlob(blob, filename);
        files.push(filename);
      }
      setStatus({ kind: "done", files: files.join(", ") });
    } catch (error) {
      setStatus({ kind: "error", message: userMessage(error, t("title"), lang) });
    }
  };

  const busy = status.kind === "busy";
  const radioClasses = "mt-1 h-4 w-4 accent-[var(--primary)]";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 min-h-11 px-3 md:px-4 rounded border border-border-base bg-bg-main text-accent-strong text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-item-hover transition-colors"
      >
        <Download className="h-4 w-4" aria-hidden="true" /> {t("button")}
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        role="group"
        aria-labelledby={`${panelId}-title`}
        className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-lg md:rounded md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:w-80 md:max-h-none md:overflow-visible z-40 md:mt-2 bg-bg-sidebar border border-border-base shadow-lg p-4 space-y-3 text-sm text-text-main font-serif"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 id={`${panelId}-title`} className="font-bold text-primary">
            {t("title")}
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="-mt-2 -mr-2 inline-flex items-center justify-center min-h-11 min-w-11 rounded hover:bg-item-hover"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-text-accent">{t("scope", { n: totalRecords.toLocaleString(locale) })}</p>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wider text-accent-strong mb-1">{t("format")}</legend>
          {(["csv", "xlsx"] as const).map((value) => (
            <label key={value} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name={`${panelId}-format`}
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
                className={radioClasses}
              />
              <span>
                <span className="font-bold">{t(value)}</span>
                <span className="block text-xs text-text-accent">{t(value === "csv" ? "csvHint" : "xlsxHint")}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {format === "csv" && (
          <div>
            <label htmlFor={`${panelId}-sep`} className="block text-xs font-semibold uppercase tracking-wider text-accent-strong mb-1">
              {t("separator")}
            </label>
            <select
              id={`${panelId}-sep`}
              value={sep}
              onChange={(e) => setSep(e.target.value as "comma" | "semicolon")}
              className="w-full min-h-11 border border-border-base rounded px-2 bg-bg-main text-text-main"
            >
              <option value="semicolon">{t("semicolon")}</option>
              <option value="comma">{t("comma")}</option>
            </select>
          </div>
        )}

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={parenti} onChange={(e) => setParenti(e.target.checked)} className={radioClasses} />
          <span>
            <span className="font-bold">{t("parenti")}</span>
            <span className="block text-xs text-text-accent">{t(format === "csv" ? "parentiCsv" : "parentiXlsx")}</span>
          </span>
        </label>

        <button
          type="button"
          onClick={handleDownload}
          disabled={busy || totalRecords === 0}
          className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> {t("download")}
        </button>

        {/* Sempre montata: gli screen reader annunciano solo i cambi di una regione già presente. */}
        <p role="status" aria-live="polite" className="text-xs empty:hidden">
          {totalRecords === 0 ? t("empty") : busy ? t("preparing") : status.kind === "done" ? t("done", { files: status.files }) : ""}
        </p>
        {status.kind === "error" && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/40 rounded p-2">
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
