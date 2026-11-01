import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMappaLuoghi } from "../api/catastoService";
import { ApiError, userMessage } from "../api/client";
import { useLanguage } from "../i18n";

/** Luoghi della mappa per i filtri dati; i dati restano visibili mentre arrivano i nuovi. */
export function useMappaLuoghi(filtri: Record<string, string>, fallback: string) {
  const { lang } = useLanguage();
  const query = useQuery({
    queryKey: ["mappaLuoghi", filtri],
    queryFn: ({ signal }) => fetchMappaLuoghi(filtri, signal),
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
