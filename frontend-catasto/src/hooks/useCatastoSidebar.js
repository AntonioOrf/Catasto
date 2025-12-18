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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSidebar();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [filters]);

  const loadSidebar = async () => {
    setSidebarLoading(true);
    try {
      const result = await fetchSidebarData(filters);
      setSidebarData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setSidebarLoading(false);
    }
  };

  return { sidebarData, sidebarLoading };
}
