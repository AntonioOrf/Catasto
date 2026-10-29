import { describe, expect, it } from "vitest";
import { bandLabel, boccheCounts, weightedMedian } from "./charts";

const fmt = (n: number) => new Intl.NumberFormat("it-IT", { useGrouping: "always" } as Intl.NumberFormatOptions).format(n);
const over = (n: string) => `oltre ${n}`;

describe("grafici del Banco", () => {
  it("fasce dell'imponibile come nella issue", () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => bandLabel(i, fmt, over))).toEqual(["0", "1–50", "51–200", "201–500", "501–1.000", "oltre 1.000"]);
  });

  it("bocche: le famiglie molto grandi si sommano in una barra", () => {
    expect(boccheCounts([{ membri: 0, fuochi: 2 }, { membri: 3, fuochi: 5 }, { membri: 12, fuochi: 1 }, { membri: 15, fuochi: 2 }])).toEqual([
      { bocche: 0, fuochi: 2 },
      { bocche: 3, fuochi: 5 },
      { bocche: 12, fuochi: 3 },
    ]);
  });

  it("mediana da frequenze, pari e dispari", () => {
    expect(weightedMedian([{ value: 1, n: 1 }, { value: 2, n: 1 }, { value: 9, n: 1 }])).toBe(2);
    expect(weightedMedian([{ value: 1, n: 2 }, { value: 4, n: 2 }])).toBe(2.5);
    expect(weightedMedian([{ value: 5, n: 0 }])).toBeNull();
    expect(weightedMedian([{ value: 3, n: 4 }])).toBe(3);
  });
});
