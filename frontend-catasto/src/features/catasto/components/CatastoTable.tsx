import React, { useState } from "react";
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CatastoRow from "./CatastoRow";
import Pagination from "./Pagination";
import ArchivioViewerModal from "./ArchivioViewerModal";
import { useFilters } from "../../../context/FilterContext";

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
}: CatastoTableProps) {
  const { sortBy, sortOrder, handleSort }: any = useFilters();
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    codiceArchivio: null,
    foglio: null,
    volume: null,
    nome: null
  });

  const handleViewArchivio = React.useCallback((row: any) => {
    setViewerData({
      isOpen: true,
      codiceArchivio: row.codice_archivio,
      foglio: row.foglio,
      volume: row.volume,
      nome: row.nome
    });
  }, []);

  const closeViewer = React.useCallback(() => {
    setViewerData(prev => ({ ...prev, isOpen: false }));
  }, []);

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
    "bg-bg-sidebar px-3 py-3 md:px-6 md:py-4 text-left text-xs font-bold text-text-accent uppercase tracking-wider font-sans cursor-pointer hover:bg-primary/10 group transition-colors";

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-base pb-2 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2 font-serif">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6" /> Registri Fuochi
        </h2>
        <span className="bg-primary text-white px-2 py-1 md:px-3 text-xs md:text-sm font-bold rounded-full">
          {totalRecords} Risultati
        </span>
      </div>

      <div className="bg-bg-main shadow-lg border border-border-base rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-bg-sidebar">
              <tr>
                <th onClick={() => handleSort("nome")} className={thClasses}>
                  <div className="flex items-center gap-1">
                    Capofamiglia{renderSortIcon("nome")}
                  </div>
                </th>
                <th onClick={() => handleSort("localita")} className={thClasses}>
                  <div className="flex items-center gap-1">
                    Località{renderSortIcon("localita")}
                  </div>
                </th>
                <th onClick={() => handleSort("fortune")} className={thClasses}>
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

            <tbody className="bg-bg-main divide-y divide-border-base">
              {error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-900 font-serif bg-red-100 border-l-4 border-red-500">
                    <p className="font-bold text-lg mb-2">Errore Server</p>
                    <p>{error}</p>
                  </td>
                </tr>
              ) : loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4" colSpan={5}>
                      <div className="h-8 bg-gray-200 rounded opacity-50 flex items-center px-4">
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
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-accent italic">
                    Nessun dato trovato con i filtri correnti.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        codiceArchivio={viewerData.codiceArchivio}
        foglio={viewerData.foglio}
        volume={viewerData.volume}
        nome={viewerData.nome}
      />
    </div>
  );
}
