import { useEffect, useState } from "react";
import { useLanguage, useT } from "../../../i18n";
import { paginationMessages } from "./Pagination.messages";
import { pageWindow } from "../lib/page-window";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Richiesta in corso: comandi disabilitati per non accodare cambi di pagina. */
  loading: boolean;
  handlePageChange: (newPage: number) => void;
}

const navButtonClasses = (disabled: boolean) =>
  `flex items-center gap-1 md:gap-2 px-3 min-h-11 rounded-ui text-sm transition-colors border ${
    disabled
      ? "text-text-accent opacity-40 cursor-not-allowed border-transparent"
      : "text-accent-strong hover:bg-item-hover bg-bg-main border-border-base"
  }`;


export default function Pagination({
  page,
  totalPages,
  loading,
  handlePageChange,
}: PaginationProps) {
  const t = useT(paginationMessages);
  const { locale } = useLanguage();
  // Bozza locale: la pagina cambia solo su Invio o all'uscita dal campo, non
  // a ogni cifra digitata (scrivere "120" non deve caricare 1, 12 e 120).
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);

  if (totalPages <= 0) return null;

  const commit = () => {
    const target = Number(draft);
    if (!Number.isInteger(target) || target < 1 || target > totalPages) {
      setDraft(String(page));
      return;
    }
    if (target !== page) handlePageChange(target);
  };

  const isFirst = page === 1;
  const isLast = page === totalPages;

  return (
    <nav
      aria-label={t("nav")}
      className="bg-bg-sidebar px-4 py-3 md:px-6 border-t border-border-base flex flex-wrap items-center justify-between gap-3 rounded-b-ui"
    >
      <button
        type="button"
        onClick={() => handlePageChange(page - 1)}
        disabled={isFirst || loading}
        aria-label={t("prevAria")}
        className={navButtonClasses(isFirst || loading)}
      >
        <span aria-hidden="true">‹</span>
        <span className="hidden sm:inline">{t("prev")}</span>
      </button>

      {/* Riquadri delle pagine vicine; quella attiva in blu pieno. */}
      <ol className="hidden md:flex items-center gap-1.5">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-text-accent">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => p !== page && handlePageChange(p)}
                disabled={loading}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("goTo", { n: p.toLocaleString(locale) })}
                className={`min-h-11 min-w-11 px-2 rounded-ui border text-sm tabular-nums transition-colors disabled:cursor-not-allowed ${
                  p === page
                    ? "bg-primary text-on-primary border-primary font-semibold"
                    : "bg-bg-main text-accent-strong border-border-base hover:bg-item-hover"
                }`}
              >
                {p.toLocaleString(locale)}
              </button>
            </li>
          ),
        )}
      </ol>

      {/* Un campo e non una select: con 60.000 fuochi le pagine sono oltre
          mille, e una select con mille opzioni non si usa né si naviga. */}
      <div className="flex items-center gap-2 text-sm text-text-accent">
        <label htmlFor="pagination-page">{t("page")}</label>
        <input
          id="pagination-page"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={draft}
          disabled={loading}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(String(page));
          }}
          className="w-16 md:w-20 min-h-11 border border-border-base rounded-ui px-2 bg-bg-main text-text-main text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span>
          {t("of")} <b className="text-text-main tabular-nums">{totalPages.toLocaleString(locale)}</b>
        </span>
      </div>

      <button
        type="button"
        onClick={() => handlePageChange(page + 1)}
        disabled={isLast || loading}
        aria-label={t("nextAria")}
        className={navButtonClasses(isLast || loading)}
      >
        <span className="hidden sm:inline">{t("next")}</span>
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
