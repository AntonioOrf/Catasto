import { API_URL, buildParams } from "./client";
import type { QueryGroup } from "@catasto/shared";

const parseError = async (response: Response, fallback: string): Promise<never> => {
  let message = fallback;
  try {
    const body = await response.json();
    message = body.error || message;
  } catch {
    // il body non è JSON: teniamo il messaggio generico
  }
  throw new Error(message);
};

/**
 * Ricerca avanzata: l'AST viaggia nel body, non in query string. Stessa forma
 * di risposta della ricerca semplice, così i consumatori non si accorgono di
 * quale dei due percorsi è stato usato.
 */
export const fetchCatastoQuery = async (
  ast: QueryGroup,
  page: number,
  limit: number,
  sortBy: string,
  order: string,
  view: "table" | "sidebar" = "table",
  signal?: AbortSignal,
) => {
  const response = await fetch(`${API_URL}/api/catasto/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ast, view, page, limit, sort_by: sortBy, order }),
    signal,
  });

  if (!response.ok) {
    await parseError(response, `Errore ricerca avanzata (${response.status})`);
  }
  return await response.json();
};

/**
 * Punto di ingresso unico per la tabella: sceglie l'endpoint in base alla
 * modalità attiva. Il branch sta qui e non negli hook, che restano ignari.
 */
export const fetchCatastoAuto = async (
  filters: any,
  page: number,
  limit: number,
  signal?: AbortSignal,
) =>
  filters.advancedMode && filters.ast
    ? fetchCatastoQuery(filters.ast, page, limit, filters.sortBy, filters.sortOrder, "table", signal)
    : fetchCatastoData(filters, page, limit, signal);

export const fetchSidebarAuto = async (
  filters: any,
  page: number,
  limit: number,
  signal?: AbortSignal,
) =>
  filters.advancedMode && filters.ast
    ? fetchCatastoQuery(filters.ast, page, limit, filters.sortBy, filters.sortOrder, "sidebar", signal)
    : fetchSidebarData(filters, page, limit, signal);

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
