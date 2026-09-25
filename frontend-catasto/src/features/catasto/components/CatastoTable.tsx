import React, { useState } from "react";
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CatastoRow, { CatastoMobileCard } from "./CatastoRow";
import Pagination from "./Pagination";
import ArchivioViewerModal from "./ArchivioViewerModal";
import SegnalazioneModal from "../../segnalazioni/components/SegnalazioneModal";
import { useFilters } from "../../../context/FilterContext";
import type { TipoSegnalazione } from "@catasto/shared";

interface CatastoTableProps {
  data: any[];
  totalRecords: number;
  loading: boolean;
  error: any;
  tableRowsRef: React.MutableRefObject<Record<string, any>>;
  handleRowClick: (id: number) => void;
  expandedId: number | null;
  loadingParenti: boolean;
  parentiData: any[];
  page: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  /** Ripete l'ultima richiesta dopo un errore. */
  onRetry?: () => void;
}

export default function CatastoTable({
  data,
  totalRecords,
  loading,
  error,
  tableRowsRef,
  handleRowClick,
  expandedId,
  loadingParenti,
  parentiData,
  page,
  totalPages,
  handlePageChange,
  onRetry,
}: CatastoTableProps) {
  const { sortBy, sortOrder, handleSort, resetFilters }: any = useFilters();
  const [viewerData, setViewerData] = useState<any>({
    isOpen: false,
    codiceArchivio: null,
    foglio: null,
    volume: null,
    nome: null,
    row: null
  });

  const handleViewArchivio = React.useCallback((row: any) => {
    setViewerData({
      isOpen: true,
      codiceArchivio: row.codice_archivio,
      foglio: row.foglio,
      volume: row.volume,
      nome: row.nome,
      // La riga intera serve alla segnalazione aperta dal visore: da lì
      // l'utente ha davanti la carta originale, è il momento migliore per
      // trascrivere la segnatura.
      row
    });
  }, []);

  const closeViewer = React.useCallback(() => {
    setViewerData((prev: any) => ({ ...prev, isOpen: false }));
  }, []);

  // La modale di segnalazione vive qui e non nella riga: una sola istanza per
  // tabella invece di una per ognuna delle 50 righe della pagina.
  const [segnalazione, setSegnalazione] = useState<{
    isOpen: boolean;
    row: any;
    tipo: TipoSegnalazione;
  }>({ isOpen: false, row: null, tipo: "dato_errato" });

  const handleSegnala = React.useCallback(
    (row: any, tipo: TipoSegnalazione = "dato_errato") =>
      setSegnalazione({ isOpen: true, row, tipo }),
    [],
  );

  const closeSegnalazione = React.useCallback(
    () => setSegnalazione((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  // Gestione icone ordinamento con colori dinamici
  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey)
      return (
        <ArrowUpDown className="h-4 w-4 text-text-accent opacity-30 ml-1" />
      );

    return sortOrder === "ASC" ? (
      <ArrowUp className="h-4 w-4 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary ml-1" />
    );
  };

  const thClasses =
    "bg-bg-sidebar px-3 py-1 md:px-6 md:py-2 text-left text-xs font-bold text-text-accent uppercase tracking-wider font-sans";

  // Il pulsante dentro l'intestazione rende l'ordinamento raggiungibile da
  // tastiera; aria-sort annuncia colonna e verso correnti.
  const sortableHeader = (column: string, label: string) => (
    <th
      key={column}
      className={thClasses}
      aria-sort={sortBy === column ? (sortOrder === "ASC" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 min-h-11 w-full uppercase tracking-wider font-bold hover:text-primary transition-colors"
      >
        {label}
        {renderSortIcon(column)}
      </button>
    </th>
  );

  const errorState = (compact = false) => (
    <div role="alert" className={`${compact ? "px-4 py-8" : "px-6 py-12"} text-center text-text-main bg-red-500/10 border border-red-500/40 rounded`}>
      <p className="font-bold text-lg mb-1">Impossibile caricare i fuochi</p>
      <p className="text-sm text-text-accent mb-4">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center min-h-11 px-4 rounded bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Riprova
        </button>
      )}
    </div>
  );

  const emptyState = () => (
    <div className="px-6 py-12 text-center">
      <p className="text-text-main font-bold mb-1">Nessun fuoco corrisponde ai filtri</p>
      <p className="text-sm text-text-accent mb-4">Allarga la ricerca togliendo qualche condizione, oppure ricomincia da capo.</p>
      {resetFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center min-h-11 px-4 rounded border border-border-base bg-bg-main text-accent-strong text-sm font-bold hover:bg-item-hover transition-colors"
        >
          Azzera i filtri
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-base pb-2 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2 font-serif">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6" /> Registri Fuochi
        </h2>
        {/* Annunciato ai lettori di schermo: è l'unico riscontro che una
            ricerca è andata a buon fine senza guardare la tabella. */}
        <span
          role="status"
          aria-live="polite"
          className="bg-primary text-on-primary px-2 py-1 md:px-3 text-xs md:text-sm font-bold rounded-full tabular-nums"
        >
          {Number(totalRecords || 0).toLocaleString("it-IT")} {totalRecords === 1 ? "risultato" : "risultati"}
        </span>
      </div>

      <div className="bg-bg-main shadow-lg border border-border-base rounded-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-bg-sidebar">
              <tr>
                {sortableHeader("nome", "Capofamiglia")}
                {sortableHeader("localita", "Località")}
                {sortableHeader("fortune", "Dati Sintetici")}
                <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-text-accent uppercase tracking-wider font-sans">
                  Riferimenti
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 w-8 md:w-10">
                  <span className="sr-only">Espandi</span>
                </th>
              </tr>
            </thead>

            <tbody className="bg-bg-main divide-y divide-border-base">
              {error ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    {errorState()}
                  </td>
                </tr>
              ) : loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4" colSpan={5}>
                      <div className="h-8 bg-border-base rounded opacity-50 flex items-center px-4">
                        {i === 0 && <span className="text-text-accent font-serif text-sm">Caricamento dati in corso...</span>}
                      </div>
                    </td>
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((row) => (
                  <CatastoRow
                    key={row.id}
                    ref={(el: any) => (tableRowsRef.current[row.id] = el)}
                    row={row}
                    expanded={expandedId === row.id}
                    onRowClick={handleRowClick}
                    loadingParenti={loadingParenti}
                    parentiData={parentiData}
                    onViewArchivio={handleViewArchivio}
                    onSegnala={handleSegnala}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    {emptyState()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden divide-y divide-border-base">
          {error ? (
            <div className="p-2">
              {errorState(true)}
            </div>
          ) : loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 space-y-3 bg-bg-main border-b border-border-base">
                <div className="h-5 bg-border-base rounded w-1/3 opacity-50"></div>
                <div className="h-4 bg-border-base rounded w-1/2 opacity-50"></div>
                <div className="h-4 bg-border-base rounded w-1/4 opacity-50"></div>
              </div>
            ))
          ) : data.length > 0 ? (
            <div className="p-2 space-y-3 bg-bg-main">
              {data.map((row) => (
                <CatastoMobileCard
                  key={row.id}
                  ref={(el: any) => (tableRowsRef.current[row.id] = el)}
                  row={row}
                  expanded={expandedId === row.id}
                  onRowClick={handleRowClick}
                  loadingParenti={loadingParenti}
                  parentiData={parentiData}
                  onViewArchivio={handleViewArchivio}
                  onSegnala={handleSegnala}
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-main">
              {emptyState()}
            </div>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          loading={loading}
          handlePageChange={handlePageChange}
        />
      </div>

      <ArchivioViewerModal 
        isOpen={viewerData.isOpen} 
        onClose={closeViewer}
        codiceArchivio={viewerData.codiceArchivio || ""}
        foglio={viewerData.foglio || ""}
        volume={viewerData.volume || ""}
        nome={viewerData.nome || ""}
        onSegnalaSegnatura={
          viewerData.row ? () => handleSegnala(viewerData.row, "segnatura") : undefined
        }
      />

      <SegnalazioneModal
        isOpen={segnalazione.isOpen}
        onClose={closeSegnalazione}
        row={segnalazione.row}
        defaultTipo={segnalazione.tipo}
      />
    </div>
  );
}
