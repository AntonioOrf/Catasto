import { describe, expect, it } from "vitest";
import type { Parenti } from "@catasto/shared";
import { diffFromFirst, etaList, statoCivileSummary } from "./compare-format";

const parente = (eta: number | null, stato_civile: string | null) =>
  ({ eta, stato_civile, parentela_desc: "", sesso: "", particolarita: "" }) as unknown as Parenti;

describe("confronto: formati", () => {
  it("differenza solo se entrambi i valori ci sono; 0 è un valore", () => {
    expect(diffFromFirst(1500, 1000)).toBe(500);
    expect(diffFromFirst(0, 1000)).toBe(-1000);
    expect(diffFromFirst(null, 1000)).toBeNull();
    expect(diffFromFirst(500, undefined)).toBeNull();
  });

  it("età dalla più alta, neonati compresi, assenti in fondo", () => {
    expect(etaList([parente(12, null), parente(0, null), parente(null, null), parente(45, null)])).toBe("45, 12, 0, ?");
  });

  it("stato civile riassunto per frequenza", () => {
    expect(statoCivileSummary([parente(1, "Sposato"), parente(1, null), parente(1, "Sposato")], "Non indicato")).toBe(
      "Sposato 2 · Non indicato 1",
    );
  });
});
