import { describe, expect, it } from "vitest";
import { emptyGroup, type QueryGroup } from "@catasto/shared";
import { encodeAst } from "../../catasto/lib/query-share";
import { EMPTY_SIMPLE_FILTERS, type SearchParams } from "../../catasto/lib/simple-filters";
import { ricercaDaUrl, urlLuogo, urlMappa } from "./ricerca";

const ast: QueryGroup = {
  kind: "group",
  op: "AND",
  children: [{ kind: "condition", field: "mestiere", operator: "eq", value: "3" }],
};

const search = (extra: Partial<SearchParams> = {}): SearchParams => ({
  ...EMPTY_SIMPLE_FILTERS,
  sortBy: "imponibile",
  sortOrder: "DESC",
  advancedMode: false,
  ast: emptyGroup("AND"),
  ...extra,
});

describe("ricercaDaUrl", () => {
  it("legge i filtri semplici e separa il luogo", () => {
    expect(ricercaDaUrl("?mestiere=3&luogo=12", "")).toEqual({ filtri: { mestiere: "3" }, ast: null, luogo: 12 });
  });

  it("ignora un luogo non valido", () => {
    expect(ricercaDaUrl("?luogo=abc", "").luogo).toBeNull();
    expect(ricercaDaUrl("?luogo=-4", "").luogo).toBeNull();
  });

  it("la ricerca avanzata nel fragment sostituisce i filtri", () => {
    const r = ricercaDaUrl("?mestiere=5", `#q=${encodeAst(ast)}`);
    expect(r.ast).toEqual(ast);
    expect(r.filtri).toEqual({});
  });

  it("un fragment illeggibile o un AST vuoto non diventano una ricerca", () => {
    expect(ricercaDaUrl("", "#q=%%%").ast).toBeNull();
    expect(ricercaDaUrl("?serie=2", `#q=${encodeAst(emptyGroup("AND"))}`)).toMatchObject({ ast: null, filtri: { serie: "2" } });
  });
});

describe("urlMappa", () => {
  it("ricerca semplice: solo i filtri, senza ordinamento né raccolta", () => {
    expect(urlMappa(search({ ids: "1,2" }))).toBe("/mappa");
    const url = urlMappa(search({ filterMestiere: "3", filterCreditoMMin: "10" }));
    expect(url).toBe("/mappa?mestiere=3&creditoM_min=10");
    expect(ricercaDaUrl(url.slice("/mappa".length), "").filtri).toEqual({ mestiere: "3", creditoM_min: "10" });
  });

  it("ricerca avanzata: AST nel fragment, che ricercaDaUrl rilegge", () => {
    const url = urlMappa(search({ advancedMode: true, ast }));
    expect(url.startsWith("/mappa#q=")).toBe(true);
    expect(ricercaDaUrl("", url.slice("/mappa".length)).ast).toEqual(ast);
  });

  it("ricerca avanzata vuota: tutta la mappa", () => {
    expect(urlMappa(search({ advancedMode: true }))).toBe("/mappa");
  });
});

describe("urlLuogo", () => {
  it("apre la scheda del luogo", () => {
    expect(urlLuogo(42)).toBe("/mappa?luogo=42");
    expect(ricercaDaUrl("?luogo=42", "").luogo).toBe(42);
  });
});
