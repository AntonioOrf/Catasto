import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchStats } from "../api/catastoService";
import { ApiError, userMessage } from "../api/client";
import type { SearchParams } from "../features/catasto/lib/simple-filters";
import { useLanguage, useT } from "../i18n";
import { useCatastoStatsMessages as messages } from "./useCatastoStats.messages";

/**
 * Statistiche della ricerca mostrata in tabella. Si caricano solo con il
 * pannello aperto (`enabled`); l'ordinamento non cambia gli aggregati, quindi
 * non è nella chiave.
 */
export function useCatastoStats(search: SearchParams, enabled: boolean) {
  const { lang } = useLanguage();
  const t = useT(messages);
  const { sortBy: _sortBy, sortOrder: _sortOrder, ...key } = search;

  const query = useQuery({
    queryKey: ["catastoStats", lang, key],
    queryFn: ({ signal }) => fetchStats(search, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    stats: query.data,
    loading: query.isLoading,
    fetching: query.isFetching,
    stale: query.isPlaceholderData,
    error: query.isError ? userMessage(query.error, t("failed"), lang) : null,
    // 404: il backend in uso non ha ancora l'endpoint (es. anteprima del
    // frontend collegata al backend di produzione non aggiornato).
    unavailable: query.error instanceof ApiError && query.error.status === 404,
    retry: () => void query.refetch(),
  };
}
