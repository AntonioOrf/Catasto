import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const tx = {
  findByIdForUpdate: vi.fn(),
  updateStato: vi.fn(),
  upsertSegnatura: vi.fn(),
  deleteSegnatura: vi.fn(),
  findUltimaSegnaturaAccettata: vi.fn(),
  replaceSegnatura: vi.fn(),
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
    tx.findUltimaSegnaturaAccettata.mockResolvedValue(null);
    await SegnalazioneService.updateStato(7, "respinta");
    expect(tx.findUltimaSegnaturaAccettata).toHaveBeenCalledWith(42, 7);
    expect(tx.deleteSegnatura).toHaveBeenCalledWith(42, 7);
    expect(tx.replaceSegnatura).not.toHaveBeenCalled();
  });

  it("revocando ripristina l'ultima altra segnatura ancora accettata sul fuoco", async () => {
    tx.findByIdForUpdate.mockResolvedValue(segnatura("accettata"));
    tx.findUltimaSegnaturaAccettata.mockResolvedValue({ id: 3, valore_proposto: "ASFi, Catasto 80, c. 12v" });
    await SegnalazioneService.updateStato(7, "respinta");
    expect(tx.replaceSegnatura).toHaveBeenCalledWith(42, 7, "ASFi, Catasto 80, c. 12v", 3);
    expect(tx.deleteSegnatura).not.toHaveBeenCalled();
  });

  it("restituisce 404 per una segnalazione inesistente, senza scrivere", async () => {
    tx.findByIdForUpdate.mockResolvedValue(null);
    await expect(SegnalazioneService.updateStato(1, "accettata")).rejects.toMatchObject({ status: 404 });
    expect(tx.updateStato).not.toHaveBeenCalled();
  });

  it("con soloSeDaModerare rifiuta una segnalazione già decisa, senza scrivere", async () => {
    tx.findByIdForUpdate.mockResolvedValue(segnatura("respinta"));
    await expect(
      SegnalazioneService.updateStato(7, "accettata", { soloSeDaModerare: true }),
    ).rejects.toMatchObject({ status: 409 });
    expect(tx.updateStato).not.toHaveBeenCalled();
    expect(tx.upsertSegnatura).not.toHaveBeenCalled();
  });

  it("con soloSeDaModerare accetta una segnalazione nuova", async () => {
    tx.findByIdForUpdate.mockResolvedValue(segnatura("nuova"));
    await SegnalazioneService.updateStato(7, "accettata", { soloSeDaModerare: true });
    expect(tx.upsertSegnatura).toHaveBeenCalledWith(42, "ASFi, Catasto 81, c. 245r", 7);
  });
});
