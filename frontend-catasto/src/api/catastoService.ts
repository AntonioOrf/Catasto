import { API_URL, buildParams } from "./client";

export const fetchCatastoData = async (filters: any, page: number, limit: number, signal?: AbortSignal) => {
  const params = buildParams(filters);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await fetch(`${API_URL}/api/catasto?${params.toString()}`, { signal });
  if (!response.ok) {
    let errorMsg = `Errore server (${response.status} ${response.statusText})`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // response body isn't JSON, keep the generic errorMsg
    }
    throw new Error(errorMsg);
  }
  return await response.json();
};

export const fetchSidebarData = async (filters: any, page = 1, limit = 1000, signal?: AbortSignal) => {
  const params = buildParams(filters);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  const response = await fetch(
    `${API_URL}/api/catasto/sidebar?${params.toString()}`,
    { signal }
  );
  if (!response.ok) throw new Error("Errore sidebar");
  return await response.json();
};

export const fetchParentiData = async (idFuoco: number | null, signal?: AbortSignal) => {
  if (!idFuoco) return [];
  const response = await fetch(`${API_URL}/api/parenti/${idFuoco}`, { signal });
  if (!response.ok) throw new Error("Errore parenti");
  return await response.json();
};

export const fetchFilterOptions = async (
  geoFilters?: { serie?: string; quartiere?: string; piviere?: string },
  signal?: AbortSignal
) => {
  const params = new URLSearchParams();
  if (geoFilters?.serie) params.append("serie", geoFilters.serie);
  if (geoFilters?.quartiere) params.append("quartiere", geoFilters.quartiere);
  if (geoFilters?.piviere) params.append("piviere", geoFilters.piviere);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}/api/filters${queryString}`, { signal });
  if (!response.ok) throw new Error("Errore caricamento filtri");
  return await response.json();
};
