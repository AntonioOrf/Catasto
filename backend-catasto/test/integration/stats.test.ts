import "./env.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { IMPONIBILE_BANDS, STATS_METRICS, type ApiResponse, type Fuoco, type QueryGroup } from "@catasto/shared";
import pool from "../../src/config/db.js";
import { CatastoService } from "../../src/services/catasto.service.js";
import { StatsService } from "../../src/services/stats.service.js";
import { startApp } from "./app.js";

afterAll(() => pool.end());
beforeEach(() => StatsService.clearCache());

/** Quantile "tipo 7" calcolato in JS sui valori grezzi, per confronto. */
const quantile = (sorted: number[], p: number) => {
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  return sorted[lo] + (h - lo) * ((sorted[Math.ceil(h)] ?? sorted[lo]) - sorted[lo]);
};

const allRows = async (filters: Record<string, unknown>) =>
  ((await CatastoService.searchFuochi(filters, { page: 1, limit: 2000, sort_by: "nome", order: "ASC" }, "table")) as ApiResponse<Fuoco[]>);

describe("statistiche su MySQL", () => {
  it("i totali coincidono con la tabella e i valori assenti restano fuori dalle medie", async () => {
    const stats = await StatsService.searchStats({});
    const table = await allRows({});
    expect(stats.fuochi).toBe(table.pagination?.total);

    const fortune = stats.economia.fortune;
    expect(fortune).toEqual({
      presenti: 9,
      assenti: 1,
      somma: 16630,
      media: expect.closeTo(16630 / 9, 4),
      mediana: 450,
      q1: 120,
      q3: 1000,
      min: 0,
      max: 9000,
    });
  });

  it("quantili uguali al calcolo in JS per ogni misura e per una ricerca filtrata", async () => {
    for (const filters of [{}, { fortune_min: 100 }, { q_localita: "Giovanni" }]) {
      const stats = await StatsService.searchStats(filters);
      const { data } = await allRows(filters);
      for (const metric of STATS_METRICS) {
        const values = data
          .map((f) => f[metric])
          .filter((v) => v !== null && v !== undefined)
          .map(Number)
          .sort((a, b) => a - b);
        const summary = stats.economia[metric];
        expect(summary.presenti).toBe(values.length);
        expect(summary.assenti).toBe(data.length - values.length);
        if (values.length === 0) {
          expect(summary.mediana).toBeNull();
          continue;
        }
        expect(summary.mediana).toBeCloseTo(quantile(values, 0.5), 6);
        expect(summary.q1).toBeCloseTo(quantile(values, 0.25), 6);
        expect(summary.q3).toBeCloseTo(quantile(values, 0.75), 6);
      }
    }
  });

  it("distribuzioni per mestiere, quartiere e serie", async () => {
    const stats = await StatsService.searchStats({});
    expect(stats.mestieri.voci).toEqual([
      { label: "Lanaiolo", n: 3 },
      { label: "Notaio", n: 2 },
      { label: "Speziale", n: 2 },
    ]);
    expect(stats.mestieri.assenti).toBe(3);
    // San Giovanni (I) e (II) sono una sola voce, come nei filtri.
    expect(stats.quartieri.voci).toEqual([
      { label: "San Giovanni", n: 5 },
      { label: "Santo Spirito", n: 2 },
    ]);
    expect(stats.quartieri.assenti).toBe(3);
    expect(stats.serie.voci.reduce((s, v) => s + v.n, 0) + stats.serie.assenti).toBe(10);
  });

  it("composizione: membri per fuoco, età per sesso, stato civile", async () => {
    const stats = await StatsService.searchStats({});
    expect(stats.parenti).toBe(20);
    expect(stats.membri).toEqual([
      { membri: 0, fuochi: 1 },
      { membri: 1, fuochi: 4 },
      { membri: 2, fuochi: 2 },
      { membri: 3, fuochi: 1 },
      { membri: 4, fuochi: 1 },
      { membri: 5, fuochi: 1 },
    ]);
    expect(stats.eta.assenti).toBe(1);
    // Il neonato (età 0) è nella prima fascia; 82 anni nella fascia 80.
    expect(stats.eta.fasce).toContainEqual({ da: 0, sesso: "Femmina", n: 2 });
    expect(stats.eta.fasce).toContainEqual({ da: 80, sesso: "Maschio", n: 1 });
    expect(stats.eta.fasce.reduce((s, f) => s + f.n, 0) + stats.eta.assenti).toBe(20);
    expect(stats.statoCivile.voci[0]).toEqual({ label: "Sposato", n: 9 });
  });

  it("fasce dell'imponibile uguali al conteggio sui valori grezzi", async () => {
    const stats = await StatsService.searchStats({});
    const { data } = await allRows({});
    const bands = stats.fasceImponibile.fasce.map((f) => f.da);
    expect(bands).toEqual([...IMPONIBILE_BANDS]);
    const fasciaDi = (v: number) => [...bands].reverse().find((da) => v >= da) ?? bands[0];
    for (const { da, n } of stats.fasceImponibile.fasce) {
      expect(n).toBe(data.filter((f) => f.imponibile !== null && fasciaDi(Number(f.imponibile)) === da).length);
    }
    expect(stats.fasceImponibile.assenti).toBe(data.filter((f) => f.imponibile === null).length);
  });

  it("la ricerca avanzata usa lo stesso compilatore", async () => {
    const ast: QueryGroup = {
      kind: "group",
      op: "AND",
      children: [{ kind: "condition", field: "eta_parente", operator: "gt", value: 60 }],
    };
    const stats = await StatsService.queryStats(ast);
    const table = (await CatastoService.queryFuochi(ast, { page: 1, limit: 50, sort_by: "nome", order: "ASC" }, "table")) as ApiResponse<Fuoco[]>;
    expect(stats.fuochi).toBe(table.pagination?.total);
    expect(stats.fuochi).toBe(2);
  });

  it("una ricerca senza risultati dà misure nulle, non zeri", async () => {
    const stats = await StatsService.searchStats({ q_persona: "Nessuno Inesistente" });
    expect(stats.fuochi).toBe(0);
    expect(stats.economia.fortune).toMatchObject({ presenti: 0, assenti: 0, media: null, mediana: null, somma: null });
    expect(stats.membri).toEqual([]);
  });
});

describe("endpoint delle statistiche", () => {
  it("GET e POST rispondono in JSON, in inglese con lang=en", async () => {
    const app = await startApp();
    try {
      const get = await fetch(`${app.base}/stats?quartiere=1,2&lang=en&page=3`);
      expect(get.status).toBe(200);
      const body = await get.json();
      expect(body.fuochi).toBe(5);
      expect(body.eta.fasce.some((f: { sesso: string }) => f.sesso === "Male")).toBe(true);

      const post = await fetch(`${app.base}/query/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ast: { kind: "group", op: "AND", children: [] } }),
      });
      expect((await post.json()).fuochi).toBe(10);

      const bad = await fetch(`${app.base}/query/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ast: { kind: "group", op: "AND", children: [{ kind: "condition", field: "boh", operator: "eq", value: 1 }] } }),
      });
      expect(bad.status).toBe(400);
    } finally {
      await app.close();
    }
  });
});
