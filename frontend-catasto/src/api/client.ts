export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3005");

export const buildParams = (filters: any): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.searchPersona) params.append("q_persona", filters.searchPersona);
  if (filters.searchLocalita)
    params.append("q_localita", filters.searchLocalita);

  if (filters.filterMestiere) params.append("mestiere", filters.filterMestiere);
  if (filters.filterBestiame) params.append("bestiame", filters.filterBestiame);
  if (filters.filterImmigrazione)
    params.append("immigrazione", filters.filterImmigrazione);
  if (filters.filterRapporto) params.append("rapporto", filters.filterRapporto);
  if (filters.filterVolume) params.append("volume", filters.filterVolume);

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
