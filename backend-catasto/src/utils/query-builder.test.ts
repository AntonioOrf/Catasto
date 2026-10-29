import { describe, expect, it } from "vitest";
import { buildOrderBy, buildQuery, namePattern, nameTerms } from "./query-builder.js";
import { ValidationError } from "./validation.js";

describe("buildQuery", () => {
  it("returns the base condition with no params when no filters are given", () => {
    const { conditions, params } = buildQuery({});
    expect(conditions).toBe("WHERE 1=1");
    expect(params).toEqual([]);
  });

  it("parameterizes text filters instead of interpolating them into the SQL", () => {
    const { conditions, params } = buildQuery({ q_persona: "Rossi" });
    expect(conditions).toContain("LIKE ? ESCAPE '!'");
    expect(conditions).not.toContain("Rossi");
    expect(params).toEqual(["% Rossi%"]);
  });

  it("cerca nome e patronimico nell'ordine scritto, senza il di", () => {
    const { conditions, params } = buildQuery({ q_persona: "Nuto di Nardo" });
    expect(conditions).toContain("CONCAT(' ', REPLACE(f.Nome_Fuoco, '''', ' ')) LIKE ? ESCAPE '!'");
    expect(params).toEqual(["% Nuto% Nardo%"]);
  });

  it("il pattern esclude le parole in altro ordine o a metà di una parola", () => {
    // Stessa semantica del LIKE di MySQL (case-insensitive) sul nome preceduto da uno spazio.
    const matches = (nome: string, search: string) =>
      new RegExp(`^${namePattern(search).replace(/%/g, ".*")}$`, "i").test(` ${nome.replace(/'/g, " ")}`);
    expect(matches("NUTO NARDO", "nuto nardo")).toBe(true);
    expect(matches("NUTO NARDO", "nut nar")).toBe(true);
    expect(matches("BERNARDO NUTO", "nuto nardo")).toBe(false);
    expect(matches("NUTO BERNARDO", "nuto nardo")).toBe(false);
    expect(matches("NUTO NARDO", "nardo nuto")).toBe(false);
    expect(matches("BERNARDO NUTO", "nardo nuto")).toBe(false);
    expect(matches("GIOVANNI D'ANTONIO", "giovanni antonio")).toBe(true);
    expect(matches("GIOVANNI D'ANTONIO", "giovanni d'antonio")).toBe(true);
  });

  it("scarta solo il di e tiene le parole intere", () => {
    expect(nameTerms("Giovanni di Nuccio")).toEqual(["Giovanni", "Nuccio"]);
    expect(nameTerms("Piero del Nuccio")).toEqual(["Piero", "del", "Nuccio"]);
    expect(nameTerms("  Lapo   ")).toEqual(["Lapo"]);
    expect(nameTerms("di")).toEqual(["di"]);
  });

  it("expands comma-separated ids into one placeholder per id", () => {
    const { conditions, params, usedTables } = buildQuery({ serie: "1,2,3" });
    expect(conditions).toContain("tser.id_serie IN (?,?,?)");
    expect(params).toEqual([1, 2, 3]);
    expect(usedTables.has("tser")).toBe(true);
  });

  it("ids: fuochi scelti a mano, fino a SELECTION_MAX_FUOCHI", () => {
    const { conditions, params } = buildQuery({ ids: "7,3" });
    expect(conditions).toContain("f.ID_Fuochi IN (?,?)");
    expect(params).toEqual([7, 3]);
    expect(() => buildQuery({ ids: Array.from({ length: 501 }, (_, i) => i + 1).join(",") })).toThrow(ValidationError);
    expect(() => buildQuery({ ids: "1,x" })).toThrow(ValidationError);
  });
});

describe("buildQuery - input ostili", () => {
  it("neutralizza i jolly LIKE", () => {
    const { params } = buildQuery({ q_localita: "%_" });
    expect(params).toEqual(["%!%!_%", "%!%!_%", "%!%!_%", "%!%!_%"]);
  });

  it("rifiuta array e oggetti prodotti dal parser qs", () => {
    expect(() => buildQuery({ mestiere: ["1", "2"] } as any)).toThrow(ValidationError);
    expect(() => buildQuery({ q_persona: { a: "b" } } as any)).toThrow(ValidationError);
  });

  it("rifiuta testi troppo lunghi e id non numerici", () => {
    expect(() => buildQuery({ q_persona: "a".repeat(201) })).toThrow(ValidationError);
    expect(() => buildQuery({ serie: "1,2) OR (1=1" })).toThrow(ValidationError);
    expect(() => buildQuery({ fortune_min: "abc" })).toThrow(ValidationError);
  });

  it("applica anche un minimo pari a zero", () => {
    const { conditions, params } = buildQuery({ fortune_min: "0" });
    expect(conditions).toContain("f.Fortune_Fuoco >= ?");
    expect(params).toEqual([0]);
  });
});

describe("buildOrderBy", () => {
  it("defaults to ascending order on an unrecognized column", () => {
    const { clause } = buildOrderBy(undefined, undefined);
    expect(clause).toBe("ORDER BY f.Nome_Fuoco ASC, f.ID_Fuochi ASC");
  });

  it("falls back to ASC when order is not exactly DESC", () => {
    const { clause } = buildOrderBy("fortune", "not-a-real-direction");
    expect(clause).toBe("ORDER BY f.Fortune_Fuoco ASC, f.ID_Fuochi ASC");
  });

  it("marks the joined tables needed for locality sorting", () => {
    const { clause, usedTables } = buildOrderBy("localita", "DESC");
    expect(clause).toContain("tq.nome_quartiere DESC");
    expect(usedTables.has("tq")).toBe(true);
    expect(usedTables.has("tp")).toBe(true);
  });

  it("chiude sempre l'ordinamento sulla chiave univoca, per una paginazione stabile", () => {
    for (const sortBy of [undefined, "fortune", "credito", "creditoM", "imponibile", "deduzioni"]) {
      expect(buildOrderBy(sortBy, "DESC").clause).toMatch(/ DESC, f\.ID_Fuochi ASC$/);
    }
    expect(buildOrderBy("localita", "DESC").clause).toBe(
      "ORDER BY tq.nome_quartiere DESC, tp.nome_popolo DESC, f.ID_Fuochi ASC",
    );
  });
});
