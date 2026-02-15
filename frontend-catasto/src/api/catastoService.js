import { API_URL, buildParams } from "./client";

/**
 * Fetches paginated and filtered data from the Catasto API.
 *
 * @param {Object} filters - The filter criteria object (see buildParams in client.js).
 * @param {number} page - The page number to fetch (1-based index).
 * @param {number} limit - The number of records per page.
 * @returns {Promise<Object>} A promise resolving to the data response, containing `data` (records) and `pagination` info.
 * @throws {Error} If the server response is not OK.
 */
export const fetchCatastoData = async (filters, page, limit) => {
  const params = buildParams(filters);
  params.append("page", page);
  params.append("limit", limit);

  const response = await fetch(`${API_URL}/api/catasto?${params.toString()}`);
  if (!response.ok) throw new Error("Errore server");
  return await response.json();
};

/**
 * Fetches aggregated data for sidebar visualizations based on current filters.
 * @param {Object} filters - The current filter configuration.
 * @returns {Promise<Array>} A promise resolving to an array of aggregate data points.
 * @throws {Error} If the sidebar data fetch fails.
 */
export const fetchSidebarData = async (filters) => {
  const params = buildParams(filters);
  const response = await fetch(
    `${API_URL}/api/catasto/sidebar?${params.toString()}`
  );
  if (!response.ok) throw new Error("Errore sidebar");
  return await response.json();
};

/**
 * Fetches family members (relatives) for a specific household/person (Fuoco).
 * @param {string|number} idFuoco - The unique identifier of the household/person.
 * @returns {Promise<Array>} A promise resolving to a list of relatives.
 * @throws {Error} If the fetch fails.
 */
export const fetchParentiData = async (idFuoco) => {
  const response = await fetch(`${API_URL}/api/parenti/${idFuoco}`);
  if (!response.ok) throw new Error("Errore parenti");
  return await response.json();
};
