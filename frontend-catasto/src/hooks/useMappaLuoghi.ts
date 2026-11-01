import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMappaLuoghi } from "../api/catastoService";
import { ApiError, userMessage } from "../api/client";
import { useLanguage } from "../i18n";
import type { RicercaMappa } from "../features/mappa/lib/ricerca";

/**
 * Luoghi della mappa per la ricerca data (filtri semplici o AST); i dati
 * restano visibili mentre arrivano i nuovi. Il luogo selezionato non conta.
 */
export function useMappaLuoghi({ filtri, ast }: Pick<RicercaMappa, "filtri" | "ast">, fallback: string) {
  const { lang } = useLanguage();
  const query = useQuery({
    queryKey: ["mappaLuoghi", filtri, ast],
    queryFn: ({ signal }) => fetchMappaLuoghi({ filtri, ast }, signal),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
  return {
    dati: query.data,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.isError ? userMessage(query.error, fallback, lang) : null,
    // 404: il backend in uso non ha ancora l'endpoint della mappa.
    unavailable: query.error instanceof ApiError && query.error.status === 404,
    retry: () => void query.refetch(),
  };
}
