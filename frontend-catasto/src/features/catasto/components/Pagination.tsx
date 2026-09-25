import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  loading: boolean;
  handlePageChange: (newPage: number) => void;
}

const navButtonClasses = (disabled: boolean) =>
  `flex items-center gap-1 md:gap-2 px-3 md:px-4 min-h-11 rounded text-xs md:text-sm font-bold transition-colors ${
    disabled
      ? "text-text-accent opacity-40 cursor-not-allowed bg-transparent"
      : "text-accent-strong hover:bg-item-hover bg-bg-main border border-border-base"
  }`;

export default function Pagination({
  page,
  totalPages,
  loading,
  handlePageChange,
}: PaginationProps) {
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
      aria-label="Paginazione dei risultati"
      className="bg-bg-sidebar px-4 py-3 md:px-6 md:py-4 border-t border-border-base flex items-center justify-between rounded-b-sm"
    >
      <button
        type="button"
        onClick={() => handlePageChange(page - 1)}
        disabled={isFirst || loading}
        aria-label="Pagina precedente"
        className={navButtonClasses(isFirst)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Precedente</span>
      </button>

      {/* Un campo e non una select: con 60.000 fuochi le pagine sono oltre
          mille, e una select con mille opzioni non si usa né si naviga. */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-text-accent">
        <label htmlFor="pagination-page">Pagina</label>
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
          className="w-16 md:w-20 min-h-11 border border-border-base rounded px-2 bg-bg-main text-text-main font-bold text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span>
          di <b className="text-text-main tabular-nums">{totalPages.toLocaleString("it-IT")}</b>
        </span>
      </div>

      <button
        type="button"
        onClick={() => handlePageChange(page + 1)}
        disabled={isLast || loading}
        aria-label="Pagina successiva"
        className={navButtonClasses(isLast)}
      >
        <span className="hidden sm:inline">Successivo</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
