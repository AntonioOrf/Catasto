import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const tx = {
  findByIdForUpdate: vi.fn(),
  updateStato: vi.fn(),
  upsertSegnatura: vi.fn(),
  deleteSegnatura: vi.fn(),
};

vi.mock("../models/segnalazione.model.js", () => ({
  SegnalazioneModel: {
    transaction: (work: (t: typeof tx) => Promise<unknown>) => work(tx),
  },
}));

const { SegnalazioneService } = await import("./segnalazione.service.js");

const segnatura = (stato: string) => ({
  id: 7,
  id_fuoco: 42,
  tipo: "segnatura",
  valore_proposto: "ASFi, Catasto 81, c. 245r",
  stato,
});

describe("SegnalazioneService.updateStato", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pubblica la segnatura quando la segnalazione viene accettata", async () => {
    tx.findByIdForUpdate.mockResolvedValue(segnatura("in_esame"));
    await SegnalazioneService.updateStato(7, "accettata");
    expect(tx.upsertSegnatura).toHaveBeenCalledWith(42, "ASFi, Catasto 81, c. 245r", 7);
  });

  it("revocando ritira solo la segnatura pubblicata da quella segnalazione", async () => {
    tx.findByIdForUpdate.mockResolvedValue(segnatura("accettata"));
    await SegnalazioneService.updateStato(7, "respinta");
    expect(tx.deleteSegnatura).toHaveBeenCalledWith(42, 7);
  });

  it("restituisce 404 per una segnalazione inesistente, senza scrivere", async () => {
    tx.findByIdForUpdate.mockResolvedValue(null);
    await expect(SegnalazioneService.updateStato(1, "accettata")).rejects.toMatchObject({ status: 404 });
    expect(tx.updateStato).not.toHaveBeenCalled();
  });
});
