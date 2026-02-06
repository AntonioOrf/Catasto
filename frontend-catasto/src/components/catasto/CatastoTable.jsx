import React from "react";
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CatastoRow from "./CatastoRow";
import Pagination from "./Pagination";

export default function CatastoTable({
  data,
  totalRecords,
  loading,
  error,
  sortBy,
  sortOrder,
  handleSort,
  tableRowsRef,
  handleRowClick,
  expandedId,
  loadingParenti,
  parentiData,
  page,
  totalPages,
  handlePageChange,
}) {
  // Gestione icone ordinamento con colori dinamici
  const renderSortIcon = (columnKey) => {
    // Se non è attivo, mostra freccia neutra (text-text-accent con opacità)
    if (sortBy !== columnKey)
      return (
        <ArrowUpDown className="h-4 w-4 text-text-accent opacity-30 ml-1" />
      );

    // Se attivo, mostra freccia colorata (text-item-selected)
    return sortOrder === "ASC" ? (
      <ArrowUp className="h-4 w-4 text-item-selected ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-item-selected ml-1" />
    );
  };

  // Classi comuni per le intestazioni (TH)
  const thClasses =
    "bg-color-border-base px-3 py-3 md:px-6 md:py-4 text-left text-xs font-bold text-text-accent uppercase tracking-wider font-sans cursor-pointer hover:bg-item-hover/50 group transition-colors";

  return (
    <div className="space-y-4 pb-12">
      {/* Intestazione Sezione */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-base pb-2 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-item-selected flex items-center gap-2 font-serif">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6" /> Registri Fuochi
        </h2>
        <span className="bg-item-selected text-text-inverted px-2 py-1 md:px-3 text-xs md:text-sm font-bold rounded-full">
          {totalRecords} Risultati
        </span>
      </div>

      {error ? (
        <div className="bg-red-900/20 border-l-4 border-red-800 p-4 text-red-900 dark:text-red-200 font-serif">
          <p className="font-bold">Errore Server</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-bg-main shadow-lg border border-border-base rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-base">
              {/* THEAD: Usa bg-bg-sidebar per staccare dal corpo tabella */}
              <thead className="bg-bg-sidebar">
                <tr>
                  <th onClick={() => handleSort("nome")} className={thClasses}>
                    <div className="flex items-center gap-1">
                      Capofamiglia{renderSortIcon("nome")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("localita")}
                    className={thClasses}
                  >
                    <div className="flex items-center gap-1">
                      Località{renderSortIcon("localita")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fortune")}
                    className={thClasses}
                  >
                    <div className="flex items-center gap-1">
                      Dati Sintetici{renderSortIcon("fortune")}
                    </div>
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-text-accent uppercase tracking-wider font-sans">
                    Riferimenti
                  </th>
                  <th className="px-3 py-3 md:px-6 md:py-4 w-8 md:w-10"></th>
                </tr>
              </thead>

              {/* TBODY: Usa bg-bg-main */}
              <tbody className="bg-bg-main divide-y divide-border-base">
                {loading ? (
                  // SKELETON LOADER ADATTIVO
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4" colSpan="5">
                        <div className="h-8 bg-bg-sidebar rounded opacity-50"></div>
                      </td>
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((row) => (
                    <CatastoRow
                      key={row.id}
                      ref={(el) => (tableRowsRef.current[row.id] = el)}
                      row={row}
                      expanded={expandedId === row.id}
                      onRowClick={handleRowClick}
                      loadingParenti={loadingParenti}
                      parentiData={parentiData}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-text-accent italic"
                    >
                      Nessun dato trovato con i filtri correnti.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINAZIONE */}
          <Pagination
            page={page}
            totalPages={totalPages}
            loading={loading}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
