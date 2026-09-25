import { describe, expect, it } from "vitest";
import { buildOrderBy, buildQuery } from "./query-builder.js";
import { ValidationError } from "./validation.js";

describe("buildQuery", () => {
  it("returns the base condition with no params when no filters are given", () => {
    const { conditions, params } = buildQuery({});
    expect(conditions).toBe("WHERE 1=1");
    expect(params).toEqual([]);
  });

  it("parameterizes text filters instead of interpolating them into the SQL", () => {
    const { conditions, params } = buildQuery({ q_persona: "Rossi" });
    expect(conditions).toContain("f.Nome_Fuoco LIKE ? ESCAPE '!'");
    expect(conditions).not.toContain("Rossi");
    expect(params).toEqual(["%Rossi%"]);
  });

  it("expands comma-separated ids into one placeholder per id", () => {
    const { conditions, params, usedTables } = buildQuery({ serie: "1,2,3" });
    expect(conditions).toContain("tser.id_serie IN (?,?,?)");
    expect(params).toEqual([1, 2, 3]);
    expect(usedTables.has("tser")).toBe(true);
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
    expect(clause).toBe("ORDER BY f.Nome_Fuoco ASC");
  });

  it("falls back to ASC when order is not exactly DESC", () => {
    const { clause } = buildOrderBy("fortune", "not-a-real-direction");
    expect(clause).toBe("ORDER BY f.Fortune_Fuoco ASC");
  });

  it("marks the joined tables needed for locality sorting", () => {
    const { clause, usedTables } = buildOrderBy("localita", "DESC");
    expect(clause).toContain("tq.nome_quartiere DESC");
    expect(usedTables.has("tq")).toBe(true);
    expect(usedTables.has("tp")).toBe(true);
  });
});
