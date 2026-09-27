import { useState, useRef, useEffect, useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FilterOptions } from "@catasto/shared";
import { fetchFilterOptions } from "../api/catastoService";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import FilterPanel from "../features/catasto/components/FilterPanel";
import CatastoTable from "../features/catasto/components/CatastoTable";
import Footer from "../components/layout/Footer";

import { useFilters } from "../context/FilterContext";
import { TABLE_PAGE_SIZE, useCatastoData } from "../hooks/useCatastoData";
import { useCatastoSidebar } from "../hooks/useCatastoSidebar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { DESKTOP_QUERY, useIsDesktop } from "../hooks/useMediaQuery";
import { useLanguage } from "../i18n";

/** Attesa dopo l'ultimo tasto: scrivere "Rossi" non deve lanciare cinque ricerche. */
const SEARCH_DEBOUNCE_MS = 350;

const EMPTY_FILTER_OPTIONS: FilterOptions = {
  bestiame: [],
  rapporto: [],
  immigrazione: [],
  mestieri: [],
  serie: [],
  quartieri: [],
  pivieri: [],
  popoli: [],
  particolaritaParente: [],
  casa: [],
};

export default function HomePage() {
  const isDesktop = useIsDesktop();
  // Aperta di default solo dove c'è spazio per affiancarla alla tabella.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  const tableRowsRef = useRef<Record<number, HTMLElement | null>>({});
  const mainContentRef = useRef<HTMLElement>(null);
  const [targetScrolledId, setTargetScrolledId] = useState<number | null>(null);

  const { filters, searchParams } = useFilters();
  const search = useDebouncedValue(searchParams, SEARCH_DEBOUNCE_MS);

  const { lang } = useLanguage();

  // Le opzioni geografiche dipendono dal livello superiore selezionato, le
  // etichette di lookup dalla lingua: entrambe nella chiave, così tornare a
  // una lingua già vista è immediato e nel frattempo restano le opzioni di prima.
  const geo = { serie: filters.filterSerie, quartiere: filters.filterQuartiere, piviere: filters.filterPiviere };
  const { data: filterOptions = EMPTY_FILTER_OPTIONS } = useQuery({
    queryKey: ["filterOptions", lang, geo],
    queryFn: ({ signal }) => fetchFilterOptions(geo, signal),
    placeholderData: keepPreviousData,
    // Cambiano solo con un reimport del dump o un import di traduzioni.
    staleTime: 30 * 60 * 1000,
  });

  const {
    data,
    loading,
    fetching,
    stale,
    error,
    page,
    setPage,
    totalPages,
    totalRecords,
    expandedId,
    parentiData,
    loadingParenti,
    handleRowClick,
    retry,
  } = useCatastoData(search);

  const { sidebarData, sidebarLoading, loadMoreSidebar, hasMore, syncSidebarToPage } =
    useCatastoSidebar(search);

  const scrollToRow = useCallback((id: number) => {
    tableRowsRef.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Dopo un cambio di pagina chiesto dall'indice: la riga esiste solo quando
  // i dati della nuova pagina sono arrivati. Finché a schermo restano quelli
  // della pagina precedente (stale) si aspetta; con un errore si rinuncia.
  useEffect(() => {
    if (targetScrolledId === null) return;
    if (error) {
      setTargetScrolledId(null);
      return;
    }
    if (loading || stale) return;
    if (tableRowsRef.current[targetScrolledId]) {
      scrollToRow(targetScrolledId);
      handleRowClick(targetScrolledId);
    }
    setTargetScrolledId(null);
  }, [data, loading, stale, error, targetScrolledId, scrollToRow, handleRowClick]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
      syncSidebarToPage(newPage, TABLE_PAGE_SIZE);
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    [totalPages, setPage, syncSidebarToPage],
  );

  const handleSidebarClick = useCallback(
    (idFuoco: number) => {
      if (!isDesktop) setIsSidebarOpen(false);

      const index = sidebarData.findIndex((item) => item.id === idFuoco);
      if (index === -1) return;

      const targetPage = Math.floor(index / TABLE_PAGE_SIZE) + 1;
      if (targetPage === page) {
        scrollToRow(idFuoco);
        handleRowClick(idFuoco);
      } else {
        setTargetScrolledId(idFuoco);
        handlePageChange(targetPage);
      }
    },
    [isDesktop, sidebarData, page, scrollToRow, handlePageChange, handleRowClick],
  );

  return (
    <div className="h-screen flex flex-col bg-bg-main text-text-main font-serif overflow-hidden">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarLoading={sidebarLoading}
          sidebarData={sidebarData}
          expandedId={expandedId}
          targetScrolledId={targetScrolledId}
          handleSidebarClick={handleSidebarClick}
          loadMoreSidebar={loadMoreSidebar}
          hasMore={hasMore}
        />

        <main ref={mainContentRef} className="flex-1 overflow-y-auto relative w-full flex flex-col">
          <div className="p-3 sm:p-4 md:p-8 flex-1">
            <FilterPanel loading={fetching} onRefresh={retry} filterOptions={filterOptions} />

            <CatastoTable
              isDesktop={isDesktop}
              data={data}
              totalRecords={totalRecords}
              loading={loading}
              fetching={fetching}
              stale={stale}
              error={error}
              tableRowsRef={tableRowsRef}
              handleRowClick={handleRowClick}
              expandedId={expandedId}
              loadingParenti={loadingParenti}
              parentiData={parentiData}
              page={page}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
              onRetry={retry}
            />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
