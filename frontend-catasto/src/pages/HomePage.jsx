import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { fetchFilterOptions } from "../api/catastoService";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import FilterPanel from "../components/catasto/FilterPanel";
import CatastoTable from "../components/catasto/CatastoTable";
import Footer from "../components/layout/Footer";

import { useFilters } from "../context/FilterContext";
import { useCatastoData } from "../hooks/useCatastoData";
import { useCatastoSidebar } from "../hooks/useCatastoSidebar";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const tableRowsRef = useRef({});
  const mainContentRef = useRef(null);
  const [targetScrolledId, setTargetScrolledId] = useState(null);

  // Filter Options State
  const [filterOptions, setFilterOptions] = useState({
    bestiame: [],
    rapporto: [],
    immigrazione: [],
  });

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const options = await fetchFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    loadFilters();
  }, []);

  // Custom Hooks
  const filters = useFilters();
  // Memoize filter object to prevent infinite loops in hooks
  const filterValues = useMemo(
    () => ({
      searchPersona: filters.searchPersona,
      searchLocalita: filters.searchLocalita,
      filterMestiere: filters.filterMestiere,
      filterBestiame: filters.filterBestiame,
      filterImmigrazione: filters.filterImmigrazione,
      filterRapporto: filters.filterRapporto,
      filterVolume: filters.filterVolume,
      filterFortuneMin: filters.filterFortuneMin,
      filterFortuneMax: filters.filterFortuneMax,
      filterCreditoMin: filters.filterCreditoMin,
      filterCreditoMax: filters.filterCreditoMax,
      filterCreditoMMin: filters.filterCreditoMMin,
      filterCreditoMMax: filters.filterCreditoMMax,
      filterImponibileMin: filters.filterImponibileMin,
      filterImponibileMax: filters.filterImponibileMax,
      filterDeduzioniMin: filters.filterDeduzioniMin,
      filterDeduzioniMax: filters.filterDeduzioniMax,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [
      filters.searchPersona,
      filters.searchLocalita,
      filters.filterMestiere,
      filters.filterBestiame,
      filters.filterImmigrazione,
      filters.filterRapporto,
      filters.filterVolume,
      filters.filterFortuneMin,
      filters.filterFortuneMax,
      filters.filterCreditoMin,
      filters.filterCreditoMax,
      filters.filterCreditoMMin,
      filters.filterCreditoMMax,
      filters.filterImponibileMin,
      filters.filterImponibileMax,
      filters.filterDeduzioniMin,
      filters.filterDeduzioniMax,
      filters.sortBy,
      filters.sortOrder,
    ],
  );

  const {
    data,
    loading,
    error,
    page,
    setPage,
    totalPages,
    totalRecords,
    expandedId,
    parentiData,
    loadingParenti,
    handleRowClick,
    fetchData,
  } = useCatastoData(filterValues);

  // Sidebar Hook
  const { sidebarData, sidebarLoading, loadMoreSidebar, hasMore, syncSidebarToPage } = useCatastoSidebar(filterValues);

  // Scroll to row logic
  useEffect(() => {
    if (targetScrolledId && !loading && data.length > 0) {
      const rowElement = tableRowsRef.current[targetScrolledId];
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
        handleRowClick(targetScrolledId);
      }
      setTargetScrolledId(null);
    }
  }, [data, loading, targetScrolledId]); // eslint-disable-line

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
        syncSidebarToPage(newPage); // Sincronizza la Sidebar con il salto di pagina
        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
      }
    },
    [totalPages, setPage, syncSidebarToPage],
  );

  const handleSidebarClick = useCallback(
    (idFuoco) => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }

      const index = sidebarData.findIndex((item) => item.id === idFuoco);
      if (index !== -1) {
        const ROWS_PER_PAGE = 50;
        const targetPage = Math.floor(index / ROWS_PER_PAGE) + 1;
        if (targetPage === page) {
          const rowElement = tableRowsRef.current[idFuoco];
          if (rowElement)
            rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
          handleRowClick(idFuoco);
        } else {
          setTargetScrolledId(idFuoco);
          handlePageChange(targetPage);
        }
      }
    },
    [sidebarData, page, handlePageChange, handleRowClick],
  );

  return (
    <div className="h-screen flex flex-col bg-bg-main text-text-main font-serif overflow-hidden">
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

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

        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto relative w-full flex flex-col"
        >
          <div className="p-3 sm:p-4 md:p-8 flex-1">
            <FilterPanel
              loading={loading}
              fetchData={fetchData}
              filterOptions={filterOptions}
            />

            <CatastoTable
              data={data}
              totalRecords={totalRecords}
              loading={loading}
              error={error}
              tableRowsRef={tableRowsRef}
              handleRowClick={handleRowClick}
              expandedId={expandedId}
              loadingParenti={loadingParenti}
              parentiData={parentiData}
              page={page}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
            />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
