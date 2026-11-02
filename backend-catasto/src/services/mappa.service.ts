import type { LuogoMappa, MappaLuoghi, QueryGroup } from "@catasto/shared";
import { MappaModel, type AggregatoLuogo, type GeoLuogo } from "../models/mappa.model.js";
import type { StatsFilters } from "../models/stats.model.js";
import { buildQuery } from "../utils/query-builder.js";
import { buildQueryFromAst } from "../utils/query-ast-builder.js";

/** Coordinate e nomi cambiano solo con un import: cache lunga. */
const GEO_TTL_MS = 10 * 60_000;
/** Aggregati per ricerca: cache breve, come le statistiche. */
const AGGREGATI_TTL_MS = 60_000;
const AGGREGATI_MAX = 200;

let geoCache: { promise: Promise<{ luoghi: GeoLuogo[]; disponibile: boolean }>; expiresAt: number } | null = null;
const cache = new Map<string, { promise: Promise<MappaLuoghi>; expiresAt: number }>();

/** Errore di tabella mancante (migrazioni 006–007 non applicate): la mappa resta vuota, non va in 500. */
const tabellaMancante = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === "ER_NO_SUCH_TABLE";

function geo(): Promise<{ luoghi: GeoLuogo[]; disponibile: boolean }> {
  if (geoCache && geoCache.expiresAt > Date.now()) return geoCache.promise;
  const promise = MappaModel.luoghi()
    .then((luoghi) => ({ luoghi, disponibile: true }))
    .catch((error) => {
      if (tabellaMancante(error)) return { luoghi: [], disponibile: false };
      throw error;
    });
  promise.catch(() => {
    if (geoCache?.promise === promise) geoCache = null;
  });
  geoCache = { promise, expiresAt: Date.now() + GEO_TTL_MS };
  return promise;
}

/** Nome del luogo nel catasto: il popolo, altrimenti il piviere (gonfalone, podesteria), il quartiere o la serie. */
export function nomeLuogo(g: Pick<GeoLuogo, "popolo" | "piviere" | "quartiere" | "serie">): string {
  return (g.popolo || g.piviere || g.quartiere || g.serie || "").trim();
}

/** Unisce aggregati e coordinate: i luoghi senza coordinate finiscono nel conteggio dei non localizzati. */
export function componiMappa(aggregati: AggregatoLuogo[], luoghi: GeoLuogo[], disponibile: boolean): MappaLuoghi {
  const perId = new Map(luoghi.map((l) => [l.id, l]));
  const risultato: LuogoMappa[] = [];
  let fuochi = 0;
  const nonLocalizzati = { fuochi: 0, luoghi: 0 };
  for (const a of aggregati) {
    fuochi += a.fuochi;
    const g = perId.get(a.id);
    if (!g || g.lat === null || g.lng === null || g.certezza === "non_trovata") {
      nonLocalizzati.fuochi += a.fuochi;
      nonLocalizzati.luoghi += 1;
      continue;
    }
    risultato.push({
      id: a.id,
      lat: g.lat,
      lng: g.lng,
      certezza: g.certezza as LuogoMappa["certezza"],
      nome: nomeLuogo(g),
      piviere: g.piviere,
      serie: g.serie,
      nome_moderno: g.nome_moderno,
      fuochi: a.fuochi,
      imponibile_medio: a.imponibile_medio,
      quota_mestiere: a.fuochi > 0 ? a.con_mestiere / a.fuochi : 0,
      quota_migrazione: a.fuochi > 0 ? a.con_migrazione / a.fuochi : 0,
      ampiezza_media: a.ampiezza_media,
    });
  }
  risultato.sort((x, y) => y.fuochi - x.fuochi || x.id - y.id);
  return { luoghi: risultato, fuochi, non_localizzati: nonLocalizzati, disponibile };
}

export class MappaService {
  private static run(filters: StatsFilters): Promise<MappaLuoghi> {
    const key = JSON.stringify([filters.conditions, filters.params, [...filters.usedTables].sort()]);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;

    const promise = Promise.all([MappaModel.aggregati(filters), geo()]).then(([aggregati, g]) =>
      componiMappa(aggregati, g.luoghi, g.disponibile),
    );
    promise.catch(() => {
      if (cache.get(key)?.promise === promise) cache.delete(key);
    });
    cache.delete(key);
    if (cache.size >= AGGREGATI_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { promise, expiresAt: Date.now() + AGGREGATI_TTL_MS });
    return promise;
  }

  static searchLuoghi(filters: Record<string, unknown>) {
    return this.run(buildQuery(filters));
  }

  static queryLuoghi(ast: QueryGroup) {
    return this.run(buildQueryFromAst(ast));
  }

  /** Per i test. */
  static clearCache(): void {
    cache.clear();
    geoCache = null;
  }
}
