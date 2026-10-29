import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../config/db.js", () => ({ default: {} }));

const service = vi.hoisted(() => ({
  searchFuochi: vi.fn(),
  queryFuochi: vi.fn(),
}));
vi.mock("../services/catasto.service.js", () => ({ CatastoService: service }));

const { CatastoController } = await import("./catasto.controller.js");
const { ValidationError } = await import("../utils/validation.js");

const res = () => ({ json: vi.fn(), set: vi.fn() }) as unknown as Response & { json: ReturnType<typeof vi.fn> };

describe("CatastoController: ricerca", () => {
  beforeEach(() => vi.clearAllMocks());

  it("separa paginazione e filtri e restituisce la risposta del service", async () => {
    service.searchFuochi.mockResolvedValue({ data: [], pagination: { total: 0 } });
    const r = res();
    await CatastoController.getAll(
      { query: { page: "2", limit: "20", sort_by: "fortune", order: "DESC", mestiere: "3" } } as unknown as Request,
      r,
    );
    const [filters, pagination, view] = service.searchFuochi.mock.calls[0];
    expect(filters).toEqual({ mestiere: "3" });
    expect(pagination).toEqual({ page: 2, limit: 20, sort_by: "fortune", order: "DESC" });
    expect(view).toBe("table");
    expect(r.json).toHaveBeenCalledWith({ data: [], pagination: { total: 0 } });
  });

  it("l'indice laterale carica blocchi da 1000 se il limit manca", async () => {
    await CatastoController.getSidebar({ query: {} } as unknown as Request, res());
    expect(service.searchFuochi.mock.calls[0][1].limit).toBe(1000);
    expect(service.searchFuochi.mock.calls[0][2]).toBe("sidebar");
  });

  it("la ricerca avanzata legge AST, vista e paginazione dal body", async () => {
    const ast = { kind: "group", op: "OR", children: [{ kind: "condition", field: "nome", operator: "contains", value: "Nuto" }] };
    await CatastoController.query({ body: { ast, view: "sidebar", page: 3, limit: 10 }, query: {} } as unknown as Request, res());
    const [parsedAst, pagination, view] = service.queryFuochi.mock.calls[0];
    expect(parsedAst).toEqual(ast);
    expect(pagination).toMatchObject({ page: 3, limit: 10 });
    expect(view).toBe("sidebar");
  });

  it("una vista sconosciuta è la tabella", async () => {
    const ast = { kind: "group", op: "AND", children: [] };
    await CatastoController.query({ body: { ast, view: "boh" }, query: {} } as unknown as Request, res());
    expect(service.queryFuochi.mock.calls[0][2]).toBe("table");
  });

  it.each([
    ["body assente", undefined],
    ["AST mancante", { view: "table" }],
    ["radice non gruppo", { ast: { kind: "condition", field: "nome", operator: "eq", value: "x" } }],
    ["operatore logico sconosciuto", { ast: { kind: "group", op: "XOR", children: [] } }],
  ])("%s: 400 senza interrogare il DB", async (_caso, body) => {
    await expect(CatastoController.query({ body, query: {} } as unknown as Request, res())).rejects.toThrow(ValidationError);
    expect(service.queryFuochi).not.toHaveBeenCalled();
  });

  it("un id di fuoco non numerico è un 400", async () => {
    await expect(
      CatastoController.getParenti({ params: { id: "1;DROP" }, query: {} } as unknown as Request, res()),
    ).rejects.toThrow(ValidationError);
  });
});
