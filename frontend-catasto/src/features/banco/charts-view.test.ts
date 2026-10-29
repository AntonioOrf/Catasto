import { describe, expect, it } from "vitest";
import type { CatastoStats } from "@catasto/shared";
import { distributionItems, imponibileItems, pieSlices, sharesByKey, withCatastoItems } from "./charts-view";

const fmt = (n: number) => n.toLocaleString("it-IT", { useGrouping: "always" } as Intl.NumberFormatOptions);
const over = (n: string) => `oltre ${n}`;

describe("grafici del Banco", () => {
  it("fasce dell'imponibile dal valore, non dalla posizione; gli assenti a parte", () => {
    const stats = { fasceImponibile: { fasce: [{ da: 0, n: 3 }, { da: 1, n: 2 }, { da: 1001, n: 1 }], assenti: 4 } } as unknown as CatastoStats;
    expect(imponibileItems(stats, fmt, over, "Non indicato").map((i) => [i.key, i.label, i.missing ?? false])).toEqual([
      ["b0", "0", false],
      ["b1", "1–50", false],
      ["b1001", "oltre 1.000", false],
      ["na", "Non indicato", true],
    ]);
  });

  it("distribuzione: voci, «Altro» e «Non indicato» distinti; quote per chiave", () => {
    const items = distributionItems({ voci: [{ label: "Lanaiolo", n: 5 }, { label: "Speziale", n: 2 }], altro: 3, assenti: 1 }, { other: "Altro", notStated: "Non indicato" });
    expect(items.map((i) => [i.label, Boolean(i.other), Boolean(i.missing)])).toEqual([
      ["Lanaiolo", false, false],
      ["Speziale", false, false],
      ["Altro", true, false],
      ["Non indicato", false, true],
    ]);
    expect(sharesByKey(items).get("v:Lanaiolo")).toBeCloseTo(5 / 11);
  });

  it("torta: al massimo sette fette, le piccole e «Altro» in «Altre voci», i non indicati per ultimi", () => {
    const items = distributionItems(
      { voci: Array.from({ length: 9 }, (_, i) => ({ label: `V${i}`, n: 20 - i })), altro: 4, assenti: 6 },
      { other: "Altro", notStated: "Non indicato" },
    );
    const slices = pieSlices(items, "Altre voci");
    expect(slices.map((s) => s.label)).toEqual(["V0", "V1", "V2", "V3", "V4", "V5", "Altre voci", "Non indicato"]);
    expect(slices[6]).toMatchObject({ n: 14 + 13 + 12 + 4, rest: ["V6", "V7", "V8", "Altro"] });
    // Poche voci: niente unione, «Altro» resta col suo nome.
    expect(pieSlices(items.slice(0, 2).concat(items.filter((i) => i.other)), "Altre voci").map((s) => s.label)).toEqual(["V0", "V1", "Altro"]);
  });

  it("confronto: le voci del catasto che mancano tra i fuochi mostrati compaiono a zero", () => {
    const mine = [{ key: "m1", label: "1 bocca", n: 1 }, { key: "m9", label: "9 bocche", n: 1 }];
    const all = [{ key: "m0", label: "nessuna", n: 3 }, { key: "m1", label: "1 bocca", n: 5 }];
    expect(withCatastoItems(mine, all).map((i) => [i.key, i.n])).toEqual([
      ["m0", 0],
      ["m1", 1],
      ["m9", 1],
    ]);
  });
});
