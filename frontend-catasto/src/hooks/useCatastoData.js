import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCatastoData, fetchParentiData } from "../api/catastoService";

/**
 * Custom hook to manage the main data fetching logic for the Catasto table.
 * Handles pagination, error states, loading states, and fetching detailed "parenti" (relatives) data on row expansion.
 *
 * @param {Object} filters - The current active filters (search terms, ranges, etc.).
 * @returns {Object} An object containing:
 *  - data: Array of result records.
 *  - loading: Boolean indicating if main data is loading.
 *  - error: Error message string or null.
 *  - page: Current page number.
 *  - setPage: Function to update the current page.
 *  - totalPages: Total number of pages available.
 *  - totalRecords: Total number of records found.
 *  - expandedId: ID of the currently expanded row (for details) or null.
 *  - parentiData: Array of relatives data for the expanded row.
 *  - loadingParenti: Boolean indicating if relatives data is loading.
 *  - handleRowClick: Function to handle row expansion toggling.
 *  - fetchData: Function to manually trigger a data fetch.
 */
export function useCatastoData(filters) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  // 1. Fetch main table data with caching
  const {
    data: queryResult,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catastoData", filters, page],
    queryFn: () => fetchCatastoData(filters, page, 50),
    keepPreviousData: true, // keeps old data on screen while fetching new page
  });

  const data = queryResult?.data || [];
  const totalPages = queryResult?.pagination?.totalPages || 1;
  const totalRecords = queryResult?.pagination?.total || 0;
  const error = isError ? "Impossibile connettersi al Server." : null;

  // 2. Fetch Parenti data with caching (enabled only when a row is clicked)
  const { data: parentiResult, isLoading: loadingParenti } = useQuery({
    queryKey: ["parenti", expandedId],
    queryFn: () => fetchParentiData(expandedId),
    enabled: !!expandedId, // only run when expandedId is set
    staleTime: 10 * 60 * 1000, // cache for 10 mins
  });

  const parentiData = parentiResult || [];

  // Reset page to 1 when filters change natively
  useEffect(() => {
    setPage(1);
  }, [
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
  ]);

  const fetchData = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRowClick = useCallback(
    (idFuoco) => {
      if (expandedId === idFuoco) {
        setExpandedId(null);
      } else {
        setExpandedId(idFuoco);
      }
    },
    [expandedId],
  );

  return {
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
  };
}
