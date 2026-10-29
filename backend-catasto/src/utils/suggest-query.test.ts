import { describe, expect, it } from "vitest";
import { buildSuggestFilters, parseSuggestQuery } from "./suggest-query.js";
import { ValidationError } from "./validation.js";

describe("parseSuggestQuery", () => {
  it("legge il numero del fuoco, con o senza #", () => {
    expect(parseSuggestQuery("#10342")).toEqual({ mode: "id", id: 10342 });
    expect(parseSuggestQuery(" 10342 ")).toEqual({ mode: "id", id: 10342 });
  });

  it("legge la carta del campione in più grafie", () => {
    expect(parseSuggestQuery("vol. 79 c. 12")).toEqual({ mode: "carta", volume: 79, foglio: "12" });
    expect(parseSuggestQuery("Vol 79, c 12R")).toEqual({ mode: "carta", volume: 79, foglio: "12r" });
    expect(parseSuggestQuery("volume 79 carta 12 v")).toEqual({ mode: "carta", volume: 79, foglio: "12v" });
    expect(parseSuggestQuery("vol. 79")).toEqual({ mode: "carta", volume: 79, foglio: null });
  });

  it("divide il testo in parole, senza il «di» e le iniziali isolate", () => {
    expect(parseSuggestQuery("Palla di Nofri")).toEqual({ mode: "testo", terms: ["Palla", "Nofri"] });
    expect(parseSuggestQuery("lanaiolo s. felicita")).toEqual({ mode: "testo", terms: ["lanaiolo", "felicita"] });
    expect(parseSuggestQuery("s.")).toEqual({ mode: "testo", terms: ["s."] });
  });

  it("niente da cercare: null", () => {
    expect(parseSuggestQuery("   ")).toBeNull();
    expect(parseSuggestQuery("di")).toBeNull();
  });

  it("rifiuta parametri non testuali o troppo lunghi", () => {
    expect(() => parseSuggestQuery(["a", "b"])).toThrow(ValidationError);
    expect(() => parseSuggestQuery("x".repeat(201))).toThrow(ValidationError);
  });

  it("tiene al massimo sei parole", () => {
    const q = parseSuggestQuery("aa bb cc dd ee ff gg hh");
    expect(q?.mode === "testo" && q.terms).toHaveLength(6);
  });
});

describe("buildSuggestFilters", () => {
  it("ogni parola deve comparire in uno dei campi, con parametri e non testo nell'SQL", () => {
    const { conditions, params, usedTables } = buildSuggestFilters({ mode: "testo", terms: ["Strozzi", "50%"] });
    expect(conditions).not.toContain("Strozzi");
    expect(conditions.match(/ AND /g)).toHaveLength(1);
    expect(params).toHaveLength(10);
    expect(params[0]).toBe("%Strozzi%");
    expect(params[5]).toBe("%50!%%");
    expect([...usedTables]).toEqual(expect.arrayContaining(["m", "tp", "tq", "tpi"]));
  });

  it("una carta senza recto o verso li trova tutti e due", () => {
    expect(buildSuggestFilters({ mode: "carta", volume: 79, foglio: "12" }).params).toEqual([79, "12", "12r", "12v"]);
    expect(buildSuggestFilters({ mode: "carta", volume: 79, foglio: "12r" }).params).toEqual([79, "12r"]);
    expect(buildSuggestFilters({ mode: "carta", volume: 79, foglio: null }).params).toEqual([79]);
  });

  it("il numero del fuoco va dritto all'id", () => {
    expect(buildSuggestFilters({ mode: "id", id: 7 })).toMatchObject({ conditions: "WHERE f.ID_Fuochi = ?", params: [7] });
  });
});
