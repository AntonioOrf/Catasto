import { describe, expect, it } from "vitest";
import type { CatastoStats } from "@catasto/shared";
import { distributionItems, imponibileItems, pieSlices, sharesByKey } from "./charts-view";

const fmt = (n: number) => n.toLocaleString("it-IT", { useGrouping: "always" } as Intl.NumberFormatOptions);
const over = (n: string) => `oltre ${n}`;

describe("grafici del Banco", () => {
  it("le fasce dell'imponibile restringono come le conta il backend; gli assenti con is_empty", () => {
    const stats = { fasceImponibile: { fasce: [{ da: 0, n: 3 }, { da: 1, n: 2 }, { da: 1001, n: 1 }], assenti: 4 } } as unknown as CatastoStats;
    const items = imponibileItems(stats, fmt, over, "Non indicato");
    expect(items[1]).toMatchObject({
      label: "1–50",
      restrict: [
        { field: "imponibile", operator: "gte", value: 1 },
        { field: "imponibile", operator: "lt", value: 51 },
      ],
    });
    expect(items[2].restrict).toEqual([{ kind: "condition", field: "imponibile", operator: "gte", value: 1001 }]);
    expect(items.at(-1)).toMatchObject({ missing: true, restrict: [{ field: "imponibile", operator: "is_empty" }] });
  });

  it("una voce restringe solo se c'è l'opzione con la stessa etichetta; «Altro» mai", () => {
    const items = distributionItems(
      { voci: [{ label: "Lanaiolo", n: 5 }, { label: "Sconosciuto", n: 2 }], altro: 3, assenti: 1 },
      { other: "Altro", notStated: "Non indicato" },
      { key: "mestiere", options: [{ id: 7, label: "Lanaiolo" }] },
    );
    expect(items.map((i) => [i.label, i.restrict?.[0]?.value ?? i.restrict?.[0]?.operator ?? null])).toEqual([
      ["Lanaiolo", 7],
      ["Sconosciuto", null],
      ["Altro", null],
      ["Non indicato", "is_empty"],
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
});
