import { describe, it, expect } from "vitest";
import type { QueryGroup } from "@catasto/shared";
import { buildQueryFromAst } from "./query-ast-builder.js";
import { ValidationError } from "./validation.js";

const group = (children: any[], op: "AND" | "OR" = "AND", not?: boolean): QueryGroup => ({
  kind: "group",
  op,
  not,
  children,
});

const cond = (field: string, operator: string, value?: any): any => ({
  kind: "condition",
  field,
  operator,
  value,
});

describe("buildQueryFromAst", () => {
  it("compila un gruppo vuoto come nessun filtro", () => {
    const { conditions, params } = buildQueryFromAst(group([]));
    expect(conditions).toBe("WHERE 1=1");
    expect(params).toEqual([]);
  });

  it("usa placeholder e mai interpolazione dei valori", () => {
    const { conditions, params } = buildQueryFromAst(
      group([cond("nome", "contains", "Medici")]),
    );
    expect(conditions).toContain("f.Nome_Fuoco LIKE ?");
    expect(conditions).not.toContain("Medici");
    expect(params).toEqual(["%Medici%"]);
  });

  it("neutralizza i metacaratteri LIKE nel valore utente", () => {
    const { params } = buildQueryFromAst(group([cond("nome", "contains", "100%_a")]));
    expect(params).toEqual(["%100!%!_a%"]);
  });

  it("combina gruppi annidati con operatori booleani diversi", () => {
    const { conditions, params } = buildQueryFromAst(
      group([
        cond("fortune", "gte", 1000),
        group([cond("quartiere", "eq", 3), cond("popolo", "eq", 7)], "OR"),
      ]),
    );
    expect(conditions).toBe(
      "WHERE (f.Fortune_Fuoco >= ? AND (tq.id_quartiere = ? OR tp.id_popolo = ?))",
    );
    expect(params).toEqual([1000, 3, 7]);
  });

  it("dichiara i join richiesti dai campi geografici", () => {
    const { usedTables } = buildQueryFromAst(group([cond("serie", "in", [1, 2])]));
    expect([...usedTables].sort()).toEqual(["f", "tser"]);
  });

  it("nega un gruppo mantenendo le parentesi", () => {
    const { conditions } = buildQueryFromAst(
      group([group([cond("casa", "eq", 1)], "AND", true)]),
    );
    expect(conditions).toBe("WHERE NOT (f.Casa_Fuoco = ?)");
  });

  it("include le righe NULL nelle negazioni", () => {
    const { conditions } = buildQueryFromAst(group([cond("mestiere", "neq", 5)]));
    expect(conditions).toBe("WHERE (f.Mestiere_Fuoco <> ? OR f.Mestiere_Fuoco IS NULL)");
  });

  it("incapsula i campi relazionali in un EXISTS", () => {
    const { conditions, params } = buildQueryFromAst(
      group([cond("particolarita_parente", "eq", 4)]),
    );
    expect(conditions).toBe(
      "WHERE EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Particolarita = ?)",
    );
    expect(params).toEqual([4]);
  });

  it("nega i campi relazionali fuori dall'EXISTS", () => {
    const { conditions, params } = buildQueryFromAst(
      group([cond("particolarita_parente", "neq", 4)]),
    );
    expect(conditions).toBe(
      "WHERE NOT EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Particolarita = ?)",
    );
    expect(params).toEqual([4]);
  });

  it("gestisce between su un campo numerico", () => {
    const { conditions, params } = buildQueryFromAst(
      group([cond("imponibile", "between", [10, 200])]),
    );
    expect(conditions).toBe("WHERE f.Imponibile_Fuoco BETWEEN ? AND ?");
    expect(params).toEqual([10, 200]);
  });

  it("rifiuta un campo fuori registry", () => {
    expect(() => buildQueryFromAst(group([cond("password", "eq", "x")]))).toThrow(
      ValidationError,
    );
  });

  it("rifiuta un operatore non ammesso sul tipo del campo", () => {
    expect(() => buildQueryFromAst(group([cond("nome", "between", [1, 2])]))).toThrow(
      ValidationError,
    );
  });

  it("rifiuta valori non numerici su campi numerici", () => {
    expect(() => buildQueryFromAst(group([cond("fortune", "gt", "abc")]))).toThrow(
      ValidationError,
    );
  });

  it("rifiuta un AST troppo annidato", () => {
    let node: QueryGroup = group([cond("nome", "contains", "a")]);
    for (let i = 0; i < 6; i++) node = group([node]);
    expect(() => buildQueryFromAst(node)).toThrow(/annidata/);
  });

  it("filtra per età dei parenti con un EXISTS", () => {
    const { conditions, params, usedTables } = buildQueryFromAst(
      group([cond("eta_parente", "between", ["60", "80"])]),
    );
    expect(conditions).toBe(
      "WHERE EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Eta BETWEEN ? AND ?)",
    );
    expect(params).toEqual([60, 80]);
    expect([...usedTables]).toEqual(["f"]);
  });

  it("nega l'età dei parenti fuori dall'EXISTS", () => {
    const { conditions, params } = buildQueryFromAst(group([cond("eta_parente", "neq", 30)]));
    expect(conditions).toBe(
      "WHERE NOT EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Eta = ?)",
    );
    expect(params).toEqual([30]);
  });

  it("non tratta lo 0 come vuoto sui campi numerici", () => {
    expect(buildQueryFromAst(group([cond("fortune", "is_empty")])).conditions).toBe(
      "WHERE f.Fortune_Fuoco IS NULL",
    );
    expect(buildQueryFromAst(group([cond("eta_parente", "is_empty")])).conditions).toBe(
      "WHERE NOT EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Eta IS NOT NULL)",
    );
  });

  it("rifiuta un'età non numerica", () => {
    expect(() => buildQueryFromAst(group([cond("eta_parente", "gt", "vecchio")]))).toThrow(
      ValidationError,
    );
  });

  it("non richiede valore per is_empty", () => {
    const { conditions, params } = buildQueryFromAst(
      group([cond("segnatura_portata", "is_empty")]),
    );
    expect(conditions).toBe("WHERE (fs.segnatura IS NULL OR fs.segnatura = '')");
    expect(params).toEqual([]);
  });
});
