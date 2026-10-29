import {
  STATS_METRICS,
  type CatastoStats,
  type Distribution,
  type MetricSummary,
  type QueryGroup,
  type StatsMetric,
} from "@catasto/shared";
import { StatsModel, QUANTILES, num, quantile, type StatsFilters } from "../models/stats.model.js";
import { TraduzioniModel, type Lingua, type TabellaLookup, type Traduttore } from "../models/traduzioni.model.js";
import { buildQuery } from "../utils/query-builder.js";
import { buildQueryFromAst } from "../utils/query-ast-builder.js";

/** Voci mostrate per mestiere: le altre finiscono in "altro". */
export const TOP_MESTIERI = 10;

/**
 * Cache breve dei risultati: chiave = SQL compilato + parametri + lingua,
 * cioè la query normalizzata (due ricerche equivalenti compilano uguale).
 * Le statistiche costano una decina di query: chi cambia scheda o torna su
 * una ricerca appena vista non le rilancia.
 */
const STATS_CACHE_TTL_MS = 60_000;
const STATS_CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, { promise: Promise<CatastoStats>; expiresAt: number }>();

/** Prime `top` voci; il resto sommato in `altro`, le etichette assenti in `assenti`. */
export function toDistribution(
  rows: { label: string | null; n: number }[],
  top = Infinity,
  traduci: (label: string) => string = (l) => l,
): Distribution {
  const presenti = rows.filter((r) => r.label !== null && r.label.trim() !== "");
  const assenti = rows.filter((r) => r.label === null || r.label.trim() === "").reduce((s, r) => s + r.n, 0);
  // Due etichette italiane diverse possono avere la stessa traduzione: si sommano.
  const merged = new Map<string, number>();
  for (const r of presenti) {
    const label = traduci(r.label as string);
    merged.set(label, (merged.get(label) ?? 0) + r.n);
  }
  const voci = [...merged].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  return {
    voci: voci.slice(0, top),
    altro: voci.slice(top).reduce((s, v) => s + v.n, 0),
    assenti,
  };
}

export function toMetricSummary(
  summary: Record<string, unknown>,
  metric: StatsMetric,
  q: { values: ReadonlyMap<number, number>; count: number },
): MetricSummary {
  const fuochi = Number(summary.fuochi);
  const presenti = Number(summary[`${metric}_presenti`] ?? 0);
  const [q1, mediana, q3] = QUANTILES.map((p) => quantile(q.values, q.count, p));
  return {
    presenti,
    assenti: fuochi - presenti,
    somma: presenti > 0 ? num(summary[`${metric}_somma`]) : null,
    media: presenti > 0 ? num(summary[`${metric}_media`]) : null,
    mediana,
    q1,
    q3,
    min: presenti > 0 ? num(summary[`${metric}_min`]) : null,
    max: presenti > 0 ? num(summary[`${metric}_max`]) : null,
  };
}

async function computeStats(filters: StatsFilters, traduttore: Traduttore): Promise<CatastoStats> {
  const t = (tabella: TabellaLookup) => (label: string) => traduttore.t(tabella, label) as string;

  const [summary, quantili, mestieri, quartieri, serie, membri, eta, statoCivile] = await Promise.all([
    StatsModel.summary(filters),
    Promise.all(STATS_METRICS.map((m) => StatsModel.quantileRows(filters, m))),
    StatsModel.mestieri(filters),
    StatsModel.quartieri(filters),
    StatsModel.serie(filters),
    StatsModel.membri(filters),
    StatsModel.eta(filters),
    StatsModel.statoCivile(filters),
  ]);

  const economia = Object.fromEntries(
    STATS_METRICS.map((metric, i) => [metric, toMetricSummary(summary, metric, quantili[i])]),
  ) as Record<StatsMetric, MetricSummary>;

  const fasce = eta
    .filter((r) => r.da !== null)
    .map((r) => ({ da: r.da as number, sesso: r.sesso === null ? null : t("sesso_parenti")(r.sesso), n: r.n }));

  return {
    fuochi: Number(summary.fuochi),
    parenti: eta.reduce((s, r) => s + r.n, 0),
    economia,
    mestieri: toDistribution(mestieri, TOP_MESTIERI, t("mestieri")),
    quartieri: toDistribution(quartieri),
    serie: toDistribution(serie),
    membri,
    eta: { fasce, assenti: eta.filter((r) => r.da === null).reduce((s, r) => s + r.n, 0) },
    statoCivile: toDistribution(statoCivile, Infinity, t("statocivile_parenti")),
  };
}

export class StatsService {
  private static run(filters: StatsFilters, lang: Lingua): Promise<CatastoStats> {
    const key = JSON.stringify([lang, filters.conditions, filters.params, [...filters.usedTables].sort()]);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;

    const promise = TraduzioniModel.forLang(lang).then((traduttore) => computeStats(filters, traduttore));
    promise.catch(() => {
      if (cache.get(key)?.promise === promise) cache.delete(key);
    });
    cache.delete(key);
    if (cache.size >= STATS_CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { promise, expiresAt: Date.now() + STATS_CACHE_TTL_MS });
    return promise;
  }

  static searchStats(filters: Record<string, unknown>, lang: Lingua = "it") {
    return this.run(buildQuery(filters), lang);
  }

  static queryStats(ast: QueryGroup, lang: Lingua = "it") {
    return this.run(buildQueryFromAst(ast), lang);
  }

  /** Per i test. */
  static clearCache(): void {
    cache.clear();
  }
}
