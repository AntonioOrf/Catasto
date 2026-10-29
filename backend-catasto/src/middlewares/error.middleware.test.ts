import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { errorHandler, notFoundHandler } from "./error.middleware.js";
import { HttpError, ValidationError } from "../utils/validation.js";

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const handle = (err: unknown) => {
  const res = response();
  errorHandler(err, {} as Request, res as unknown as Response, vi.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

describe("errorHandler", () => {
  const env = process.env.NODE_ENV;
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    process.env.NODE_ENV = env;
    vi.restoreAllMocks();
  });

  it("un errore di validazione è un 400 con il suo messaggio", () => {
    const { status, body } = handle(new ValidationError("Parametro non valido"));
    expect(status).toBe(400);
    expect(body.error).toBe("Parametro non valido");
  });

  it("legge anche `statusCode` (body-parser) e ignora status fuori intervallo", () => {
    expect(handle(Object.assign(new Error("troppo grande"), { statusCode: 413 })).status).toBe(413);
    expect(handle(Object.assign(new Error("strano"), { status: 200 })).status).toBe(500);
    expect(handle("non un Error").status).toBe(500);
  });

  it("in produzione maschera i 5xx e non espone lo stack", () => {
    process.env.NODE_ENV = "production";
    const { status, body } = handle(new Error("ER_NO_SUCH_TABLE: fuoco_segnature"));
    expect(status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error", stack: undefined });
  });

  it("in produzione i 4xx restano leggibili", () => {
    process.env.NODE_ENV = "production";
    const { body } = handle(new HttpError(404, "Volume non trovato"));
    expect(body.error).toBe("Volume non trovato");
    expect(body.stack).toBeUndefined();
  });

  it("in sviluppo mostra messaggio e stack anche dei 5xx", () => {
    process.env.NODE_ENV = "development";
    const { body } = handle(new Error("boom"));
    expect(body.error).toBe("boom");
    expect(body.stack).toContain("boom");
  });
});

describe("notFoundHandler", () => {
  it("risponde 404 in JSON", () => {
    const res = response();
    notFoundHandler({} as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Risorsa non trovata" });
  });
});
