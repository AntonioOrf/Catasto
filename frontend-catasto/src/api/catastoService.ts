import { apiRequest } from "./client";
import type {
  ApiResponse,
  FilterOptions,
  Fuoco,
  IiifPage,
  Parenti,
  SidebarItem,
} from "@catasto/shared";
import { buildParams, type SearchParams } from "../features/catasto/lib/simple-filters";

type View = "table" | "sidebar";
type ViewResult<V extends View> = V extends "table" ? ApiResponse<Fuoco[]> : SidebarItem[];

/**
 * Ricerca avanzata: l'AST viaggia nel body, non in query string. Stessa forma
 * di risposta della ricerca semplice, così i consumatori non si accorgono di
 * quale dei due percorsi è stato usato.
 */
const fetchAdvanced = <V extends View>(
  search: SearchParams,
  view: V,
  page: number,
  limit: number,
  signal?: AbortSignal,
) =>
  apiRequest<ViewResult<V>>("/api/catasto/query", "La ricerca avanzata non è riuscita", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ast: search.ast,
      view,
      page,
      limit,
      sort_by: search.sortBy,
      order: search.sortOrder,
    }),
    signal,
  });

const fetchSimple = <V extends View>(
  search: SearchParams,
  view: V,
  page: number,
  limit: number,
  signal?: AbortSignal,
) => {
  const params = buildParams(search);
  params.append("page", String(page));
  params.append("limit", String(limit));
  const path = view === "sidebar" ? "/api/catasto/sidebar" : "/api/catasto";
  const fallback =
    view === "sidebar" ? "Impossibile caricare l'indice" : "Il server non ha risposto correttamente";
  return apiRequest<ViewResult<V>>(`${path}?${params}`, fallback, { signal });
};

/**
 * Punto di ingresso unico per tabella e indice: sceglie l'endpoint in base
 * alla modalità attiva. Il branch sta qui e non negli hook, che restano ignari.
 */
export const fetchFuochi = <V extends View>(
  search: SearchParams,
  view: V,
  page: number,
  limit: number,
  signal?: AbortSignal,
) =>
  search.advancedMode
    ? fetchAdvanced(search, view, page, limit, signal)
    : fetchSimple(search, view, page, limit, signal);

export const fetchParentiData = (idFuoco: number, signal?: AbortSignal) =>
  apiRequest<Parenti[]>(`/api/parenti/${idFuoco}`, "Impossibile caricare la composizione familiare", {
    signal,
  });

export const fetchFilterOptions = (
  geo: { serie?: string; quartiere?: string; piviere?: string },
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(geo)) {
    if (value) params.append(key, value);
  }
  const query = params.toString() ? `?${params}` : "";
  return apiRequest<FilterOptions>(`/api/filters${query}`, "Impossibile caricare le opzioni dei filtri", {
    signal,
  });
};

export const fetchManifestPages = (archiveId: string, signal?: AbortSignal) =>
  apiRequest<IiifPage[]>(
    `/api/catasto/manifest/${encodeURIComponent(archiveId)}`,
    "Impossibile scaricare le informazioni del volume dall'Archivio di Stato",
    { signal },
  );
