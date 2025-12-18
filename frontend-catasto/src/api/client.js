export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Constructs a URLSearchParams object from the provided filter criteria.
 * This utility function maps front-end filter state to back-end query parameters.
 *
 * @param {Object} filters - The filter state object containing search terms and filter values.
 * @param {string} [filters.searchPersona] - Search term for person name.
 * @param {string} [filters.searchLocalita] - Search term for location.
 * @param {string} [filters.filterMestiere] - Filter by job/craft.
 * @param {string} [filters.filterBestiame] - Filter by livestock ownership.
 * @param {string} [filters.filterImmigrazione] - Filter by immigration status.
 * @param {string} [filters.filterRapporto] - Filter by relationship status.
 * @param {number|string} [filters.filterFortuneMin] - Minimum fortune value.
 * @param {number|string} [filters.filterFortuneMax] - Maximum fortune value.
 * @param {number|string} [filters.filterCreditoMin] - Minimum credit value.
 * @param {number|string} [filters.filterCreditoMax] - Maximum credit value.
 * @param {number|string} [filters.filterCreditoMMin] - Minimum money credit value.
 * @param {number|string} [filters.filterCreditoMMax] - Maximum money credit value.
 * @param {number|string} [filters.filterImponibileMin] - Minimum taxable amount.
 * @param {number|string} [filters.filterImponibileMax] - Maximum taxable amount.
 * @param {number|string} [filters.filterDeduzioniMin] - Minimum deductions amount.
 * @param {number|string} [filters.filterDeduzioniMax] - Maximum deductions amount.
 * @param {string} [filters.sortBy] - Column key to sort by.
 * @param {string} [filters.sortOrder] - Sort order ('ASC' or 'DESC').
 * @returns {URLSearchParams} A URLSearchParams object ready to be appended to an API URL.
 */
export const buildParams = (filters) => {
  const params = new URLSearchParams();

  if (filters.searchPersona) params.append("q_persona", filters.searchPersona);
  if (filters.searchLocalita)
    params.append("q_localita", filters.searchLocalita);

  if (filters.filterMestiere) params.append("mestiere", filters.filterMestiere);
  if (filters.filterBestiame) params.append("bestiame", filters.filterBestiame);
  if (filters.filterImmigrazione)
    params.append("immigrazione", filters.filterImmigrazione);
  if (filters.filterRapporto) params.append("rapporto", filters.filterRapporto);

  if (filters.filterFortuneMin)
    params.append("fortune_min", filters.filterFortuneMin);
  if (filters.filterFortuneMax)
    params.append("fortune_max", filters.filterFortuneMax);
  if (filters.filterCreditoMin)
    params.append("credito_min", filters.filterCreditoMin);
  if (filters.filterCreditoMax)
    params.append("credito_max", filters.filterCreditoMax);
  if (filters.filterCreditoMMin)
    params.append("creditoM_min", filters.filterCreditoMMin);
  if (filters.filterCreditoMMax)
    params.append("creditoM_max", filters.filterCreditoMMax);
  if (filters.filterImponibileMin)
    params.append("imponibile_min", filters.filterImponibileMin);
  if (filters.filterImponibileMax)
    params.append("imponibile_max", filters.filterImponibileMax);
  if (filters.filterDeduzioniMin)
    params.append("deduzioni_min", filters.filterDeduzioniMin);
  if (filters.filterDeduzioniMax)
    params.append("deduzioni_max", filters.filterDeduzioniMax);

  if (filters.sortBy) params.append("sort_by", filters.sortBy);
  if (filters.sortOrder) params.append("order", filters.sortOrder);

  return params;
};
