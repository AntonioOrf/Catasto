import { describe, expect, it } from "vitest";
import type { FilterOptions } from "@catasto/shared";
import { buildExamples } from "./example-queries";

const empty: FilterOptions = {
  bestiame: [], rapporto: [], immigrazione: [], mestieri: [], serie: [], quartieri: [], pivieri: [], popoli: [], particolaritaParente: [], casa: [],
};

describe("esempi della home", () => {
  it("risolve le opzioni per etichetta, compresi gli id raggruppati", () => {
    const examples = buildExamples({
      ...empty,
      quartieri: [{ id: "1,2", label: "San Giovanni" }, { id: 3, label: "Santo Spirito" }],
      immigrazione: [{ id: 4, label: "Dal contado" }],
    });
    expect(examples.map((e) => e.id)).toEqual(["ricchiSanGiovanni", "immigratiContado", "imponibileAlto", "parentiAnziani"]);
    expect(examples[0].ast.children[0]).toMatchObject({ field: "quartiere", operator: "eq", value: "1,2" });
    expect(examples[0].sort).toEqual({ sortBy: "fortune", sortOrder: "DESC" });
  });

  it("un esempio senza la sua opzione non compare", () => {
    expect(buildExamples(empty).map((e) => e.id)).toEqual(["imponibileAlto", "parentiAnziani"]);
  });
});
