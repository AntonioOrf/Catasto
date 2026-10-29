import { apiDownload, apiRequest } from "./client";
import { translate } from "../i18n/messages";
import { clientMessages as messages } from "./client.messages";
import type {
  ApiResponse,
  CatastoStats,
  FilterOptions,
  Fuoco,
  IiifPage,
  Parenti,
  SidebarItem,
} from "@catasto/shared";
import { buildParams, type SearchParams } from "../features/catasto/lib/simple-filters";

/** "banco": la tabella con bocche ed età media, per il Banco di lavoro. */
type View = "table" | "sidebar" | "banco";
type ViewResult<V extends View> = V extends "sidebar" ? SidebarItem[] : ApiResponse<Fuoco[]>;

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
  apiRequest<ViewResult<V>>("/api/catasto/query", translate(messages, "advancedSearchFailed"), {
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
  if (view === "banco") params.append("view", "banco");
  const path = view === "sidebar" ? "/api/catasto/sidebar" : "/api/catasto";
  const fallback =
    translate(messages, view === "sidebar" ? "sidebarFailed" : "tableFailed");
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
  search.advancedMode && !search.ids
    ? fetchAdvanced(search, view, page, limit, signal)
    : fetchSimple(search, view, page, limit, signal);

export const fetchParentiData = (idFuoco: number, signal?: AbortSignal) =>
  apiRequest<Parenti[]>(`/api/parenti/${idFuoco}`, translate(messages, "parentiFailed"), {
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
  return apiRequest<FilterOptions>(`/api/filters${query}`, translate(messages, "filtersFailed"), {
    signal,
  });
};

export const fetchManifestPages = (archiveId: string, signal?: AbortSignal) =>
  apiRequest<IiifPage[]>(
    `/api/catasto/manifest/${encodeURIComponent(archiveId)}`,
    translate(messages, "manifestFailed"),
    { signal },
  );

export type ExportFormat = "csv" | "xlsx";

export interface ExportRequest {
  format: ExportFormat;
  /** CSV: il file dei parenti al posto di quello dei fuochi. XLSX: un foglio in più. */
  parenti: boolean;
  sep: "comma" | "semicolon";
}

/**
 * Export della ricerca corrente, tutte le pagine nello stesso ordine della
 * tabella: GET con i filtri semplici, POST con l'AST della ricerca avanzata.
 */
export const downloadExport = (search: SearchParams, request: ExportRequest) => {
  const fallback = translate(messages, "exportFailed");
  const fallbackName =
    request.format === "xlsx" ? "catasto1427.xlsx" : `catasto1427-${request.parenti ? "parenti" : "fuochi"}.csv`;
  if (search.advancedMode && !search.ids) {
    return apiDownload("/api/catasto/query/export", fallback, fallbackName, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ast: search.ast,
        sort_by: search.sortBy,
        order: search.sortOrder,
        ...request,
      }),
    });
  }
  const params = buildParams(search);
  params.append("format", request.format);
  params.append("parenti", String(request.parenti));
  params.append("sep", request.sep);
  return apiDownload(`/api/catasto/export?${params}`, fallback, fallbackName);
};

/** Statistiche sulla ricerca corrente: stessi filtri o stesso AST della tabella. */
export const fetchStats = (search: SearchParams, signal?: AbortSignal) => {
  const fallback = translate(messages, "statsFailed");
  if (search.advancedMode && !search.ids) {
    return apiRequest<CatastoStats>("/api/catasto/query/stats", fallback, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ast: search.ast }),
      signal,
    });
  }
  const params = buildParams({ ...search, sortBy: undefined, sortOrder: undefined });
  const query = params.toString() ? `?${params}` : "";
  return apiRequest<CatastoStats>(`/api/catasto/stats${query}`, fallback, { signal });
};

/** Fuochi per id (selezione e confronto), nell'ordine dato; gli inesistenti mancano. Al massimo FUOCHI_BY_IDS_MAX. */
export const fetchFuochiByIds = (ids: readonly number[], signal?: AbortSignal) =>
  apiRequest<Fuoco[]>(`/api/catasto/fuochi?ids=${ids.join(",")}`, translate(messages, "compareFailed"), { signal });
