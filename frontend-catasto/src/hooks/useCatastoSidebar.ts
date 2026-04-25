import { useState, useEffect } from "react";
import { fetchSidebarData } from "../api/catastoService";

export function useCatastoSidebar(filters: any) {
  const [sidebarData, setSidebarData] = useState<any[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarPage, setSidebarPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Trigger load when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarPage(1);
      setSidebarData([]);
      setHasMore(true);
      loadSidebar(1, true);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
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

  const loadSidebar = async (pageToLoad: number, isNewSearch = false) => {
    if (!isNewSearch && !hasMore) return;
    setSidebarLoading(true);
    try {
      const limit = 1000;
      const result = await fetchSidebarData(filters, pageToLoad, limit);
      const newItems = Array.isArray(result) ? result : (result.data || []);

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

  const syncSidebarToPage = (targetGridPage: number, pageSize = 50) => {
    const targetRowIndex = targetGridPage * pageSize;
    const limitSidebar = 1000;
    const requiredSidebarPages = Math.ceil(targetRowIndex / limitSidebar);

    if (sidebarPage >= requiredSidebarPages && sidebarData.length > 0) return;

    setSidebarLoading(true);
    const superLimit = targetRowIndex + limitSidebar;

    fetchSidebarData(filters, 1, superLimit)
      .then((result) => {
        const newItems = Array.isArray(result) ? result : (result.data || []);
        setSidebarData(newItems);
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
