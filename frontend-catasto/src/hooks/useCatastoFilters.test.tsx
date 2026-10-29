// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCatastoFilters } from "./useCatastoFilters";
import { encodeAst } from "../features/catasto/lib/query-share";

describe("useCatastoFilters", () => {
  it("cambiare un livello geografico azzera quelli sottostanti", () => {
    const { result } = renderHook(() => useCatastoFilters());
    act(() => {
      result.current.setFilter("filterQuartiere", "1,2");
      result.current.setFilter("filterPiviere", "3");
      result.current.setFilter("filterPopolo", "4");
    });
    act(() => result.current.setFilter("filterSerie", "1"));
    expect(result.current.filters).toMatchObject({ filterSerie: "1", filterQuartiere: "", filterPiviere: "", filterPopolo: "" });
  });

  it("l'ordinamento alterna il verso sulla stessa colonna e riparte da ASC su un'altra", () => {
    const { result } = renderHook(() => useCatastoFilters());
    act(() => result.current.handleSort("fortune"));
    expect([result.current.sortBy, result.current.sortOrder]).toEqual(["fortune", "ASC"]);
    act(() => result.current.handleSort("fortune"));
    expect(result.current.sortOrder).toBe("DESC");
    act(() => result.current.handleSort("nome"));
    expect([result.current.sortBy, result.current.sortOrder]).toEqual(["nome", "ASC"]);
  });

  it("la ricerca eseguibile scarta le condizioni incomplete", () => {
    const { result } = renderHook(() => useCatastoFilters());
    act(() =>
      result.current.setAst({
        kind: "group",
        op: "AND",
        children: [
          { kind: "condition", field: "fortune", operator: "gt", value: 100 },
          { kind: "condition", field: "nome", operator: "contains", value: "" },
        ],
      }),
    );
    expect(result.current.astConditionCount).toBe(1);
    expect(result.current.searchParams.ast.children).toHaveLength(1);
  });

  it("un link #q= apre la ricerca avanzata e viene tolto dall'URL", () => {
    const ast = { kind: "group" as const, op: "AND" as const, children: [{ kind: "condition" as const, field: "nome", operator: "contains" as const, value: "Nuto" }] };
    window.history.replaceState(null, "", `/#q=${encodeAst(ast)}`);
    const { result } = renderHook(() => useCatastoFilters());
    expect(result.current.advancedMode).toBe(true);
    expect(result.current.ast).toEqual(ast);
    expect(window.location.hash).toBe("");
  });
});
