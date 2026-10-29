import { describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const { quantile, andWhere, num } = await import("../models/stats.model.js");
const { toDistribution, toMetricSummary } = await import("./stats.service.js");

const positions = (values: number[]) => new Map(values.map((v, i) => [i + 1, v]));

describe("quantile (tipo 7, interpolazione lineare)", () => {
  it("coincide con R/numpy su numero pari e dispari di valori", () => {
    const dispari = positions([0, 0, 120, 300, 450, 760, 1000, 5000, 9000]);
    expect(quantile(dispari, 9, 0.5)).toBe(450);
    expect(quantile(dispari, 9, 0.25)).toBe(120);
    const pari = positions([1, 2, 3, 4]);
    expect(quantile(pari, 4, 0.5)).toBe(2.5);
    expect(quantile(pari, 4, 0.25)).toBe(1.75);
    expect(quantile(pari, 4, 0.75)).toBe(3.25);
  });

  it("un solo valore è tutti i quantili; nessun valore è null", () => {
    expect(quantile(positions([7]), 1, 0.25)).toBe(7);
    expect(quantile(new Map(), 0, 0.5)).toBeNull();
  });
});

describe("andWhere", () => {
  it("non altera la precedenza di un OR al primo livello", () => {
    expect(andWhere("WHERE a = ? OR b = ?", "x IS NOT NULL")).toBe("WHERE (a = ? OR b = ?) AND x IS NOT NULL");
  });
});

describe("num", () => {
  it("converte i DECIMAL di mysql2 e lascia null gli assenti", () => {
    expect(num("1000.50")).toBe(1000.5);
    expect(num(null)).toBeNull();
    expect(num("boh")).toBeNull();
  });
});

describe("toDistribution", () => {
  it("prime voci, altro e assenti separati; traduzioni uguali sommate", () => {
    const rows = [
      { label: "Lanaiolo", n: 5 },
      { label: null, n: 4 },
      { label: "Lanaiuolo", n: 2 },
      { label: "Notaio", n: 3 },
      { label: "Speziale", n: 1 },
      { label: "", n: 1 },
    ];
    const traduci = (l: string) => (l.startsWith("Lanai") ? "Wool manufacturer" : l);
    expect(toDistribution(rows, 2, traduci)).toEqual({
      voci: [
        { label: "Wool manufacturer", n: 7 },
        { label: "Notaio", n: 3 },
      ],
      altro: 1,
      assenti: 5,
    });
  });
});

describe("toMetricSummary", () => {
  it("con nessun valore presente le misure sono null, non 0", () => {
    const summary = { fuochi: 3, fortune_presenti: 0, fortune_somma: null, fortune_media: null, fortune_min: null, fortune_max: null };
    expect(toMetricSummary(summary, "fortune", { values: new Map(), count: 0 })).toEqual({
      presenti: 0,
      assenti: 3,
      somma: null,
      media: null,
      mediana: null,
      q1: null,
      q3: null,
      min: null,
      max: null,
    });
  });
});
