import { useState, useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchFuochi, fetchParentiData } from "../api/catastoService";
import { userMessage } from "../api/client";
import type { SearchParams } from "../features/catasto/lib/simple-filters";

export const TABLE_PAGE_SIZE = 50;

export function useCatastoData(search: SearchParams) {
  // La pagina è legata alla ricerca che l'ha prodotta: con una ricerca nuova
  // si riparte da 1 nello stesso render, senza un fetch intermedio della
  // vecchia pagina con i nuovi filtri.
  const [pageState, setPageState] = useState({ search, page: 1 });
  const page = pageState.search === search ? pageState.page : 1;
  const setPage = useCallback((next: number) => setPageState({ search, page: next }), [search]);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const {
    data: queryResult,
    isLoading: loading,
    error: queryError,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catastoData", search, page],
    queryFn: ({ signal }) => fetchFuochi(search, "table", page, TABLE_PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  });

  const { data: parentiData = [], isLoading: loadingParenti } = useQuery({
    queryKey: ["parenti", expandedId],
    queryFn: ({ signal }) => fetchParentiData(expandedId as number, signal),
    enabled: expandedId !== null,
    staleTime: 10 * 60 * 1000,
  });

  const handleRowClick = useCallback(
    (idFuoco: number) => setExpandedId((current) => (current === idFuoco ? null : idFuoco)),
    [],
  );

  const retry = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: queryResult?.data ?? [],
    loading,
    error: isError ? userMessage(queryError, "Impossibile caricare i fuochi") : null,
    page,
    setPage,
    totalPages: queryResult?.pagination?.totalPages || 1,
    totalRecords: queryResult?.pagination?.total ?? 0,
    expandedId,
    parentiData,
    loadingParenti,
    handleRowClick,
    retry,
  };
}
