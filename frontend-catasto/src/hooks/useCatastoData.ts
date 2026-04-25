import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCatastoData, fetchParentiData } from "../api/catastoService";

export function useCatastoData(filters: any) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 1. Fetch main table data
  const {
    data: queryResult,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catastoData", filters, page],
    queryFn: () => fetchCatastoData(filters, page, 50),
    // @ts-ignore - keeping previous behavior
    placeholderData: (previousData: any) => previousData,
  });

  const data = queryResult?.data || [];
  const totalPages = queryResult?.pagination?.totalPages || 1;
  const totalRecords = queryResult?.pagination?.total || 0;
  const error = isError ? "Impossibile connettersi al Server." : null;

  // 2. Fetch Parenti data
  const { data: parentiResult, isLoading: loadingParenti } = useQuery({
    queryKey: ["parenti", expandedId],
    queryFn: () => fetchParentiData(expandedId),
    enabled: !!expandedId,
    staleTime: 10 * 60 * 1000,
  });

  const parentiData = parentiResult || [];

  // Reset page to 1 when filters change
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
    (idFuoco: number) => {
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
