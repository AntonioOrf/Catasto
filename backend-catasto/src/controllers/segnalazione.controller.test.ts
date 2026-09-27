import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../config/db.js", () => ({ default: {} }));

const service = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../services/segnalazione.service.js", () => ({ SegnalazioneService: service }));

const { SegnalazioneController } = await import("./segnalazione.controller.js");
const { ValidationError } = await import("../utils/validation.js");

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

const create = (body: unknown) =>
  SegnalazioneController.create({ body, ip: "127.0.0.1" } as Request, response());

describe("SegnalazioneController.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rifiuta una segnatura senza fuoco", async () => {
    await expect(
      create({ tipo: "segnatura", valore_proposto: "ASFi, Catasto 81, c. 245r" }),
    ).rejects.toThrow(ValidationError);
    await expect(
      create({ tipo: "segnatura", id_fuoco: null, valore_proposto: "ASFi, Catasto 81, c. 245r" }),
    ).rejects.toThrow(/fuoco/);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("accetta una segnatura legata a un fuoco", async () => {
    service.create.mockResolvedValue(1);
    await create({ tipo: "segnatura", id_fuoco: 42, valore_proposto: "ASFi, Catasto 81, c. 245r" });
    expect(service.create).toHaveBeenCalledOnce();
  });

  it("non richiede il fuoco per le segnalazioni generiche", async () => {
    service.create.mockResolvedValue(1);
    await create({ tipo: "altro", note: "Pagina non caricata" });
    expect(service.create).toHaveBeenCalledOnce();
  });
});
