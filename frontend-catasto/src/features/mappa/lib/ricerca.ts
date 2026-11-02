import { countConditions, type QueryGroup } from "@catasto/shared";
import { decodeAst, encodeAst } from "../../catasto/lib/query-share";
import { buildParams, type SearchParams } from "../../catasto/lib/simple-filters";
import { filtriDaQuery } from "./mappa";

/**
 * La ricerca della mappa viaggia nell'URL, come nella Consultazione:
 * - ricerca semplice nella query string (`/mappa?mestiere=3&serie=4`);
 * - ricerca avanzata nel fragment (`/mappa#q=…`), con la stessa codifica dei
 *   link condivisi, così non finisce nei log del server;
 * - `?luogo=<id_registrazione>` apre la scheda di un luogo e non filtra.
 */

export interface RicercaMappa {
  /** Filtri della ricerca semplice, già nei nomi dei parametri dell'API. */
  filtri: Record<string, string>;
  /** AST della ricerca avanzata: se presente sostituisce i filtri. */
  ast: QueryGroup | null;
  /** Luogo da mostrare all'apertura. */
  luogo: number | null;
}

const LUOGO = "luogo";

export function ricercaDaUrl(search: string, hash: string): RicercaMappa {
  const filtri = filtriDaQuery(search);
  const luogo = Number(new URLSearchParams(search).get(LUOGO));

  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get("q");
  const decoded = encoded ? decodeAst(encoded) : null;
  // Un AST senza condizioni vale "tutto il catasto": come nessun AST.
  const ast = decoded && countConditions(decoded) > 0 ? decoded : null;

  return {
    filtri: ast ? {} : filtri,
    ast,
    luogo: Number.isInteger(luogo) && luogo > 0 ? luogo : null,
  };
}

/** Link alla mappa con i fuochi della ricerca corrente (ordinamento e raccolta esclusi). */
export function urlMappa(search: SearchParams): string {
  if (search.advancedMode) {
    return countConditions(search.ast) > 0 ? `/mappa#q=${encodeAst(search.ast)}` : "/mappa";
  }
  const params = buildParams({ ...search, sortBy: undefined, sortOrder: undefined, ids: undefined });
  const query = params.toString();
  return query ? `/mappa?${query}` : "/mappa";
}

/** Link alla mappa centrata su un luogo, con la sua scheda aperta. */
export const urlLuogo = (idRegistrazione: number): string => `/mappa?${LUOGO}=${idRegistrazione}`;
