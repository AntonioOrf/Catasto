import { useState, useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchFuochi, fetchParentiData } from "../api/catastoService";
import { userMessage } from "../api/client";
import type { SearchParams } from "../features/catasto/lib/simple-filters";
import { useLanguage, useT } from "../i18n/useT";
import { useCatastoDataMessages as messages } from "./useCatastoData.messages";

export const TABLE_PAGE_SIZE = 50;

export function useCatastoData(search: SearchParams) {
  // La pagina è legata alla ricerca che l'ha prodotta: con una ricerca nuova
  // si riparte da 1 nello stesso render, senza un fetch intermedio della
  // vecchia pagina con i nuovi filtri.
  const [pageState, setPageState] = useState({ search, page: 1 });
  const page = pageState.search === search ? pageState.page : 1;
  const setPage = useCallback((next: number) => setPageState({ search, page: next }), [search]);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { lang } = useLanguage();
  const t = useT(messages);

  const {
    data: queryResult,
    isLoading: loading,
    isFetching: fetching,
    isPlaceholderData: stale,
    error: queryError,
    isError,
    refetch,
  } = useQuery({
    // La lingua è nella chiave: le etichette di lookup arrivano tradotte dal
    // backend, e tornare a una lingua già vista non rifà la richiesta.
    queryKey: ["catastoData", lang, search, page],
    queryFn: ({ signal }) => fetchFuochi(search, "table", page, TABLE_PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  });

  const { data: parentiData = [], isLoading: loadingParenti } = useQuery({
    queryKey: ["parenti", lang, expandedId],
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

  // Con keepPreviousData `loading` vale solo per il primo caricamento (nessun
  // dato da mostrare); `fetching` copre ogni richiesta in corso e `stale` dice
  // che le righe a schermo sono ancora quelle della pagina o ricerca precedente.
  return {
    data: queryResult?.data ?? [],
    loading,
    fetching,
    stale,
    error: isError ? userMessage(queryError, t("loadFailed"), lang) : null,
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
