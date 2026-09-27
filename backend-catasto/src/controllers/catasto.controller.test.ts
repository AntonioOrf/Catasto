import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../config/db.js", () => ({ default: {} }));

const service = vi.hoisted(() => ({
  searchFuochi: vi.fn(),
  queryFuochi: vi.fn(),
  getParenti: vi.fn(),
  getMestieri: vi.fn(),
}));
vi.mock("../services/catasto.service.js", () => ({ CatastoService: service }));

const { CatastoController } = await import("./catasto.controller.js");

const res = () => ({ json: vi.fn(), set: vi.fn() }) as unknown as Response;

describe("CatastoController: parametro lang", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passa la lingua al service e non la tratta come filtro", async () => {
    await CatastoController.getAll({ query: { lang: "en", mestiere: "3" } } as unknown as Request, res());
    const [filters, , view, lang] = service.searchFuochi.mock.calls[0];
    expect(filters).toEqual({ mestiere: "3" });
    expect(view).toBe("table");
    expect(lang).toBe("en");
  });

  it("una lingua sconosciuta e' italiano, non un errore", async () => {
    await CatastoController.getSidebar({ query: { lang: "xx" } } as unknown as Request, res());
    expect(service.searchFuochi.mock.calls[0][3]).toBe("it");
    await CatastoController.getParenti({ params: { id: "5" }, query: {} } as unknown as Request, res());
    expect(service.getParenti).toHaveBeenCalledWith(5, "it");
  });

  it("la ricerca avanzata legge lang dalla query string", async () => {
    const ast = { kind: "group", op: "AND", children: [] };
    await CatastoController.query({ body: { ast }, query: { lang: "en" } } as unknown as Request, res());
    expect(service.queryFuochi.mock.calls[0][3]).toBe("en");
  });
});
