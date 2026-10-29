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

  it("la ricerca semplice accetta la vista banco, ma non la passa come filtro", async () => {
    await CatastoController.getAll({ query: { view: "banco", mestiere: "3" } } as unknown as Request, res());
    const [filters, , view] = service.searchFuochi.mock.calls[0];
    expect(filters).toEqual({ mestiere: "3" });
    expect(view).toBe("banco");
  });

  it("la ricerca avanzata accetta la vista banco", async () => {
    const ast = { kind: "group", op: "AND", children: [] };
    await CatastoController.query({ body: { ast, view: "banco" }, query: {} } as unknown as Request, res());
    expect(service.queryFuochi.mock.calls[0][2]).toBe("banco");
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

const exportService = vi.hoisted(() => ({ exportFuochi: vi.fn() }));
vi.mock("../services/export.service.js", () => ({ ExportService: exportService }));

describe("CatastoController: export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("separa le opzioni dell'export da filtri e ordinamento", async () => {
    await CatastoController.exportSimple(
      { query: { format: "xlsx", parenti: "1", sep: "semicolon", lang: "en", mestiere: "3", sort_by: "fortune", page: "4" } } as unknown as Request,
      res(),
    );
    const [, compiled, pagination, , options] = exportService.exportFuochi.mock.calls[0];
    expect(compiled.params).toEqual([3]);
    expect(pagination.sort_by).toBe("fortune");
    expect(options).toEqual({ format: "xlsx", parenti: true, sep: ";", lang: "en" });
  });

  it("default: CSV dei fuochi con la virgola", async () => {
    await CatastoController.exportSimple({ query: {} } as unknown as Request, res());
    expect(exportService.exportFuochi.mock.calls[0][4]).toEqual({ format: "csv", parenti: false, sep: ",", lang: "it" });
  });

  it.each([
    ["formato sconosciuto", { format: "pdf" }],
    ["parenti non booleano", { parenti: "forse" }],
    ["separatore sconosciuto", { sep: "|" }],
  ])("%s: 400", async (_caso, query) => {
    await expect(CatastoController.exportSimple({ query } as unknown as Request, res())).rejects.toThrow(ValidationError);
    expect(exportService.exportFuochi).not.toHaveBeenCalled();
  });

  it("la ricerca avanzata legge le opzioni dal body", async () => {
    const ast = { kind: "group", op: "AND", children: [] };
    await CatastoController.exportAdvanced(
      { body: { ast, format: "csv", parenti: true, sort_by: "nome" }, query: {} } as unknown as Request,
      res(),
    );
    expect(exportService.exportFuochi.mock.calls[0][4]).toMatchObject({ format: "csv", parenti: true });
  });
});

const statsService = vi.hoisted(() => ({ searchStats: vi.fn(), queryStats: vi.fn() }));
vi.mock("../services/stats.service.js", () => ({ StatsService: statsService }));

describe("CatastoController: statistiche", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ignora paginazione e ordinamento, passa filtri e lingua", async () => {
    await CatastoController.stats({ query: { page: "3", sort_by: "fortune", mestiere: "2", lang: "en" } } as unknown as Request, res());
    expect(statsService.searchStats).toHaveBeenCalledWith({ mestiere: "2" }, "en");
  });

  it("la ricerca avanzata valida l'AST prima di interrogare il DB", async () => {
    await expect(
      CatastoController.queryStats({ body: { ast: { kind: "group", op: "NAND", children: [] } }, query: {} } as unknown as Request, res()),
    ).rejects.toThrow(ValidationError);
    expect(statsService.queryStats).not.toHaveBeenCalled();
  });
});

describe("CatastoController: fuochi per id", () => {
  const getFuochiByIds = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (service as Record<string, unknown>).getFuochiByIds = getFuochiByIds;
  });

  it("id numerici, senza duplicati, nell'ordine dato", async () => {
    await CatastoController.getByIds({ query: { ids: "12, 345,12,678", lang: "en" } } as unknown as Request, res());
    expect(getFuochiByIds).toHaveBeenCalledWith([12, 345, 678], "en");
  });

  it.each([
    ["assente", undefined],
    ["vuoto", ""],
    ["non numerico", "1,a"],
    ["virgola finale", "1,2,"],
    ["array", ["1", "2"]],
    ["oltre il massimo", Array.from({ length: 51 }, (_, i) => i + 1).join(",")],
  ])("%s: 400", async (_caso, ids) => {
    await expect(CatastoController.getByIds({ query: { ids } } as unknown as Request, res())).rejects.toThrow(ValidationError);
    expect(getFuochiByIds).not.toHaveBeenCalled();
  });
});
