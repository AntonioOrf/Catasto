import { useState, useEffect } from "react";
import { fetchSidebarData } from "../api/catastoService";

/**
 * Custom hook to fetch and manage data for the Sidebar visualization (e.g., charts or aggregate stats).
 * automatically refetches data when filters change with a debounce delay.
 *
 * @param {Object} filters - The current active filters.
 * @returns {Object} An object containing:
 *  - sidebarData: Array of aggregated data for visualization.
 *  - sidebarLoading: Boolean indicating if the sidebar data is currently loading.
 */
export function useCatastoSidebar(filters) {
  const [sidebarData, setSidebarData] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarPage, setSidebarPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Trigger load when filters change (reset to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarPage(1);
      setSidebarData([]);
      setHasMore(true);
      loadSidebar(1, true);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [filters]);

  const loadSidebar = async (pageToLoad, isNewSearch = false) => {
    if (!isNewSearch && !hasMore) return;
    setSidebarLoading(true);
    try {
      const limit = 1000;
      const result = await fetchSidebarData(filters, pageToLoad, limit);
      const newItems = result.data || [];

      if (isNewSearch) {
        setSidebarData(newItems);
      } else {
        setSidebarData((prev) => [...prev, ...newItems]);
      }

      setHasMore(newItems.length === limit);
    } catch (err) {
      console.error(err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadMoreSidebar = () => {
    if (!sidebarLoading && hasMore) {
      const nextPage = sidebarPage + 1;
      setSidebarPage(nextPage);
      loadSidebar(nextPage, false);
    }
  };

  // Called when the main table jumps pages via pagination
  const syncSidebarToPage = (targetGridPage, pageSize = 50) => {
    // Calcola approssimativamente quanti record della sidebar servono per arrivare a quella pagina
    const targetRowIndex = targetGridPage * pageSize;
    const limitSidebar = 1000;

    // Quante pagine da 1000 servono per coprire il targetRowIndex?
    const requiredSidebarPages = Math.ceil(targetRowIndex / limitSidebar);

    // Se la sidebar ha già caricato abbastanza pagine, non facciamo nulla.
    if (sidebarPage >= requiredSidebarPages && sidebarData.length > 0) return;

    // Altrimenti, per scopi di infinite scrolling, forziamo il caricamento
    // di un chunk molto grande (o di N pagine in sequenza rapida)
    // Per semplicità dell'MVP, resettiamo e chiediamo al backend un limit superiore.
    setSidebarLoading(true);
    const superLimit = targetRowIndex + limitSidebar;

    fetchSidebarData(filters, 1, superLimit)
      .then((result) => {
        const newItems = result.data || [];
        setSidebarData(newItems);
        // Impostiamo la pagina interna della sidebar come se avesse caricato tutti questi blocchi
        setSidebarPage(Math.ceil(superLimit / limitSidebar));
        setHasMore(newItems.length === superLimit);
        setSidebarLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSidebarLoading(false);
      });
  };

  return {
    sidebarData,
    sidebarLoading,
    loadMoreSidebar,
    hasMore,
    syncSidebarToPage,
  };
}
