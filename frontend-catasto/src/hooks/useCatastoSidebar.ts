import { useState, useEffect, useCallback, useRef } from "react";
import type { SidebarItem } from "@catasto/shared";
import { fetchFuochi } from "../api/catastoService";
import type { SearchParams } from "../features/catasto/lib/simple-filters";

/** Righe per richiesta. Le pagine restano allineate: la pagina n parte da (n-1)*size. */
const SIDEBAR_PAGE_SIZE = 1000;
/**
 * Richieste massime per seguire un salto di pagina della tabella: oltre,
 * l'indice non insegue (una pagina lontana costerebbe decine di richieste).
 */
const MAX_SYNC_PAGES = 10;

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

export function useCatastoSidebar(search: SearchParams) {
  const [sidebarData, setSidebarData] = useState<SidebarItem[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Stato letto dai callback senza doverli ricreare a ogni pagina caricata.
  const loadedPages = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  /** Carica le pagine [from, to] e le accoda; `replace` riparte da zero. */
  const loadPages = useCallback(
    async (from: number, to: number, replace: boolean) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setSidebarLoading(true);

      try {
        const pageNumbers = Array.from({ length: to - from + 1 }, (_, i) => from + i);
        const results = await Promise.all(
          pageNumbers.map((page) =>
            fetchFuochi(search, "sidebar", page, SIDEBAR_PAGE_SIZE, controller.signal),
          ),
        );
        const items = results.flat();

        loadedPages.current = to;
        setSidebarData((prev) => (replace ? items : [...prev, ...items]));
        setHasMore(results[results.length - 1].length === SIDEBAR_PAGE_SIZE);
      } catch (err) {
        if (!isAbort(err)) console.error(err);
      } finally {
        if (controllerRef.current === controller) setSidebarLoading(false);
      }
    },
    [search],
  );

  // Ricerca nuova: l'indice riparte dalla prima pagina.
  useEffect(() => {
    loadedPages.current = 0;
    setSidebarData([]);
    setHasMore(true);
    loadPages(1, 1, true);
    return () => controllerRef.current?.abort();
  }, [loadPages]);

  const loadMoreSidebar = useCallback(() => {
    if (sidebarLoading || !hasMore) return;
    const next = loadedPages.current + 1;
    loadPages(next, next, false);
  }, [sidebarLoading, hasMore, loadPages]);

  /** Porta l'indice almeno fino alle righe della pagina `gridPage` della tabella. */
  const syncSidebarToPage = useCallback(
    (gridPage: number, gridPageSize: number) => {
      const required = Math.ceil((gridPage * gridPageSize) / SIDEBAR_PAGE_SIZE);
      const from = loadedPages.current + 1;
      if (!hasMore || required < from || required - from + 1 > MAX_SYNC_PAGES) return;
      loadPages(from, required, false);
    },
    [hasMore, loadPages],
  );

  return {
    sidebarData,
    sidebarLoading,
    loadMoreSidebar,
    hasMore,
    syncSidebarToPage,
  };
}
