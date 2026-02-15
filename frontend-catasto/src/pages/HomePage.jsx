import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import FilterPanel from "../components/catasto/FilterPanel";
import CatastoTable from "../components/catasto/CatastoTable";

import { useCatastoFilters } from "../hooks/useCatastoFilters";
import { useCatastoData } from "../hooks/useCatastoData";
import { useCatastoSidebar } from "../hooks/useCatastoSidebar";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const tableRowsRef = useRef({});
  const mainContentRef = useRef(null);
  const [targetScrolledId, setTargetScrolledId] = useState(null);

  // Custom Hooks
  const filters = useCatastoFilters();
  // Memoize filter object to prevent infinite loops in hooks
  const filterValues = useMemo(
    () => ({
      searchPersona: filters.searchPersona,
      searchLocalita: filters.searchLocalita,
      filterMestiere: filters.filterMestiere,
      filterBestiame: filters.filterBestiame,
      filterImmigrazione: filters.filterImmigrazione,
      filterRapporto: filters.filterRapporto,
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
  const { sidebarData, sidebarLoading } = useCatastoSidebar(filterValues);

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
        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
      }
    },
    [totalPages, setPage],
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
        />

        <div
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 relative w-full"
        >
          <FilterPanel
            {...filters} // Pass all filter states and setters
            loading={loading}
            fetchData={fetchData}
          />

          <CatastoTable
            data={data}
            totalRecords={totalRecords}
            loading={loading}
            error={error}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            handleSort={filters.handleSort}
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
      </div>
    </div>
  );
}
