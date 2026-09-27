import { FuocoModel, type FuocoQuery } from "../models/fuoco.model.js";
import { CommonModel } from "../models/common.model.js";
import { buildQuery, buildOrderBy } from "../utils/query-builder.js";
import { buildQueryFromAst } from "../utils/query-ast-builder.js";
import { HttpError, type Pagination } from "../utils/validation.js";
import { TraduzioniModel, type Lingua, type TabellaLookup } from "../models/traduzioni.model.js";
import type {
  Fuoco,
  ApiResponse,
  IiifPage,
  SidebarItem,
  Parenti,
  QueryGroup,
} from "@catasto/shared";

export type FuochiView = "table" | "sidebar";

/** Campi di lookup della vista tabella e tabella del dump da cui vengono. */
const FUOCO_LOOKUP_FIELDS: Partial<Record<keyof Fuoco, TabellaLookup>> = {
  mestiere: "mestieri",
  bestiame: "bestiame",
  immigrazione: "immigrazione",
  rapporto_mestiere: "rapporto_mestiere",
  casa: "casa",
  particolarita_fuoco: "particolarita_fuoco",
};

const PARENTI_LOOKUP_FIELDS: Partial<Record<keyof Parenti, TabellaLookup>> = {
  parentela_desc: "rapporti_parentela",
  sesso: "sesso_parenti",
  stato_civile: "statocivile_parenti",
  particolarita: "particolarita_parenti",
};

interface CompiledFilters {
  conditions: string;
  params: unknown[];
  usedTables: Set<string>;
}

// Manifests describe already-digitized historical volumes and never change,
// so caching them avoids re-hitting the upstream government service on
// every page load of the viewer.
const MANIFEST_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// L'id arriva dal client: senza un tetto la cache crescerebbe con ogni id
// richiesto. La Map conserva l'ordine di inserimento, quindi la prima chiave
// e' la meno recente.
const MANIFEST_CACHE_MAX_ENTRIES = 500;
const MANIFEST_TIMEOUT_MS = 20_000;
/** Un manifest reale pesa qualche centinaio di KB: oltre questa soglia non lo leggiamo. */
const MANIFEST_MAX_BYTES = 10 * 1024 * 1024;
const manifestCache = new Map<string, { data: IiifPage[]; expiresAt: number }>();
// Richieste in volo per id: dieci utenti che aprono lo stesso volume nello
// stesso momento producono una sola chiamata all'Archivio.
const manifestInFlight = new Map<string, Promise<IiifPage[]>>();

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Del manifest IIIF il visore usa solo etichetta e immagine di ogni carta.
 * Proiettarlo qui riduce di un ordine di grandezza la risposta e la memoria
 * della cache, e scarta URL non https che il browser non dovrebbe caricare.
 */
export function toPages(manifest: any): IiifPage[] {
  const canvases = manifest?.sequences?.[0]?.canvases;
  if (!Array.isArray(canvases)) return [];
  return canvases.flatMap((canvas: any) => {
    const image = canvas?.images?.[0]?.resource?.["@id"];
    if (!isHttpsUrl(image)) return [];
    const label = typeof canvas?.label === "string" ? canvas.label.slice(0, 200) : "";
    return [{ label, image }];
  });
}

async function fetchManifestPages(id: string): Promise<IiifPage[]> {
  const targetUrl = `https://archiviodigitale-icar.cultura.gov.it/metadata/${encodeURIComponent(id)}/manifest.json?type=archive`;

  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/json",
      // Il servizio dell'Archivio risponde in modo affidabile solo a user agent da browser.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
  });

  if (response.status === 404) {
    throw new HttpError(404, "Volume non trovato nell'Archivio digitale");
  }
  if (!response.ok) {
    throw new HttpError(502, `Archivio digitale non disponibile (errore ${response.status})`);
  }
  if (Number(response.headers.get("content-length") ?? 0) > MANIFEST_MAX_BYTES) {
    throw new HttpError(502, "Manifest dell'Archivio troppo grande");
  }

  return toPages(await response.json());
}

export class CatastoService {
  /**
   * Pipeline comune a ricerca semplice e avanzata: cambia solo il compilatore
   * delle condizioni. `view` evita di duplicare l'endpoint per la sidebar, che
   * filtra sugli stessi criteri ma proietta meno colonne e non conta i totali.
   */
  private static async runQuery(
    filters: CompiledFilters,
    { page, limit, sort_by, order }: Pagination,
    view: FuochiView,
    lang: Lingua,
  ): Promise<ApiResponse<Fuoco[]> | SidebarItem[]> {
    const { clause, usedTables: orderTables } = buildOrderBy(sort_by, order);
    const query: FuocoQuery = {
      conditions: filters.conditions,
      params: filters.params,
      usedTables: new Set([...filters.usedTables, ...orderTables]),
      orderByClause: clause,
      limit,
      offset: (page - 1) * limit,
    };

    // Le traduzioni si caricano in parallelo alla query (e di norma sono in cache).
    if (view === "sidebar") {
      const [items, traduttore] = await Promise.all([FuocoModel.getSidebar(query), TraduzioniModel.forLang(lang)]);
      return traduttore.translateRows(items, { mestiere: "mestieri" });
    }

    const [total, rows, traduttore] = await Promise.all([
      FuocoModel.count(filters.conditions, filters.params, filters.usedTables),
      FuocoModel.findAll(query),
      TraduzioniModel.forLang(lang),
    ]);
    const data = traduttore.translateRows(rows, FUOCO_LOOKUP_FIELDS);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static searchFuochi(
    filters: Record<string, unknown>,
    pagination: Pagination,
    view: FuochiView,
    lang: Lingua = "it",
  ) {
    return this.runQuery(buildQuery(filters), pagination, view, lang);
  }

  static queryFuochi(ast: QueryGroup, pagination: Pagination, view: FuochiView, lang: Lingua = "it") {
    return this.runQuery(buildQueryFromAst(ast), pagination, view, lang);
  }

  static async getParenti(fuocoId: number, lang: Lingua = "it"): Promise<Parenti[]> {
    const [rows, traduttore] = await Promise.all([CommonModel.getParenti(fuocoId), TraduzioniModel.forLang(lang)]);
    return traduttore.translateRows(rows, PARENTI_LOOKUP_FIELDS);
  }

  /** Righe grezze di `mestieri`: con la traduzione cambia `Mestiere` e l'ordine. */
  static async getMestieri(lang: Lingua = "it"): Promise<Record<string, unknown>[]> {
    const [rows, traduttore] = await Promise.all([CommonModel.getMestieriList(), TraduzioniModel.forLang(lang)]);
    if (traduttore.vuoto) return rows;
    const collator = new Intl.Collator(lang, { sensitivity: "base" });
    return traduttore
      .translateRows(rows, { Mestiere: "mestieri" })
      .sort((a, b) => collator.compare(String(a.Mestiere ?? ""), String(b.Mestiere ?? "")));
  }

  static async getManifest(id: number): Promise<IiifPage[]> {
    const key = String(id);
    const cached = manifestCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pending = manifestInFlight.get(key);
    if (pending) return pending;

    const request = fetchManifestPages(key)
      .then((data) => {
        manifestCache.delete(key);
        if (manifestCache.size >= MANIFEST_CACHE_MAX_ENTRIES) {
          const oldest = manifestCache.keys().next().value;
          if (oldest !== undefined) manifestCache.delete(oldest);
        }
        manifestCache.set(key, { data, expiresAt: Date.now() + MANIFEST_CACHE_TTL_MS });
        return data;
      })
      .finally(() => manifestInFlight.delete(key));

    manifestInFlight.set(key, request);
    return request;
  }
}
