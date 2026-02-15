import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  loading,
  handlePageChange,
}) {
  if (totalPages <= 0) return null;

  return (
    // CONTAINER: Usa bg-bg-sidebar per differenziarsi dalla tabella (bg-bg-main)
    <div className="bg-bg-sidebar px-4 py-3 md:px-6 md:py-4 border-t border-border-base flex items-center justify-between rounded-b-sm">
      {/* TASTO PRECEDENTE */}
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1 || loading}
        className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-bold transition-colors 
          ${
            page === 1
              ? // Stato Disabilitato: Testo grigio (accent) con opacità, niente sfondo
                "text-text-accent opacity-40 cursor-not-allowed bg-transparent"
              : // Stato Attivo: Colore brand (selected), sfondo main, bordo base
                "text-item-selected hover:bg-item-hover bg-bg-main border border-border-base"
          }`}
      >
        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />{" "}
        <span className="hidden sm:inline">Precedente</span>
      </button>

      {/* CENTRO: SELECT PAGINE */}
      <div className="flex items-center gap-2">
        <span className="text-xs md:text-sm font-serif text-text-accent">
          Pagina
        </span>

        <select
          value={page}
          onChange={(e) => handlePageChange(Number(e.target.value))}
          // SELECT: Fondamentale usare bg-bg-main per evitare lo sfondo bianco in dark mode
          className="border border-border-base rounded px-1 md:px-2 py-1 bg-bg-main text-text-main font-bold text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-item-selected cursor-pointer"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <option
                key={pageNum}
                value={pageNum}
                className="bg-bg-main text-text-main"
              >
                {pageNum}
              </option>
            )
          )}
        </select>

        <span className="text-xs md:text-sm font-serif text-text-accent">
          di <b className="text-text-main">{totalPages}</b>
        </span>
      </div>

      {/* TASTO SUCCESSIVO */}
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages || loading}
        className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-bold transition-colors 
          ${
            page === totalPages
              ? "text-text-accent opacity-40 cursor-not-allowed bg-transparent"
              : "text-item-selected hover:bg-item-hover bg-bg-main border border-border-base"
          }`}
      >
        <span className="hidden sm:inline">Successivo</span>{" "}
        <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
      </button>
    </div>
  );
}
