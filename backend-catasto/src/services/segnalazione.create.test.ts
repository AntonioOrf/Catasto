import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const model = vi.hoisted(() => ({
  fuocoExists: vi.fn(),
  findLuogoRiepilogo: vi.fn(),
  countRecentByIp: vi.fn(),
  create: vi.fn(),
}));
vi.mock("../models/segnalazione.model.js", () => ({ SegnalazioneModel: model }));

const notifica = vi.hoisted(() => ({ invia: vi.fn() }));
vi.mock("./notifica.service.js", () => ({ NotificaService: notifica }));

const { SegnalazioneService, descriviPosizione } = await import("./segnalazione.service.js");

const luogo = {
  serie: "Contado",
  quartiere: null,
  piviere: "S. Giovanni in Gangalandi",
  popolo: "S. Martino a Gangalandi",
  lat: 43.7701,
  lng: 11.1052,
  certezza: "approssimata",
  nome_moderno: "Lastra a Signa",
};

describe("descriviPosizione", () => {
  it("coordinate, certezza e nome moderno", () => {
    expect(descriviPosizione(luogo)).toBe("43.770100, 11.105200 (approssimata; Lastra a Signa)");
  });

  it("luogo senza coordinate", () => {
    expect(descriviPosizione({ ...luogo, lat: null, lng: null, certezza: "non_trovata", nome_moderno: null })).toBe(
      "non localizzato (non trovata)",
    );
    expect(descriviPosizione({ ...luogo, lat: null, lng: null, certezza: null, nome_moderno: null })).toBe("non localizzato");
  });
});

describe("SegnalazioneService.create: localizzazione", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    model.countRecentByIp.mockResolvedValue(0);
    model.create.mockResolvedValue(9);
  });

  const input = {
    id_fuoco: null,
    id_registrazione: 12,
    tipo: "localizzazione" as const,
    valore_attuale: "inventato dal client",
    valore_proposto: "Ginestra Fiorentina",
  };

  it("salva il luogo e la posizione attuale letta dal database, non dal client", async () => {
    model.findLuogoRiepilogo.mockResolvedValue(luogo);
    await expect(SegnalazioneService.create(input, "127.0.0.1")).resolves.toBe(9);
    expect(model.findLuogoRiepilogo).toHaveBeenCalledWith(12);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id_fuoco: null,
        id_registrazione: 12,
        valore_attuale: "43.770100, 11.105200 (approssimata; Lastra a Signa)",
        valore_proposto: "Ginestra Fiorentina",
      }),
    );
    expect(notifica.invia).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ id_registrazione: 12, valore_attuale: "43.770100, 11.105200 (approssimata; Lastra a Signa)" }),
    );
  });

  it("rifiuta un luogo inesistente senza scrivere", async () => {
    model.findLuogoRiepilogo.mockResolvedValue(null);
    await expect(SegnalazioneService.create(input, "127.0.0.1")).rejects.toMatchObject({ status: 400 });
    expect(model.create).not.toHaveBeenCalled();
  });

  it("le segnalazioni sui fuochi non cercano luoghi", async () => {
    model.fuocoExists.mockResolvedValue(true);
    await SegnalazioneService.create({ id_fuoco: 42, tipo: "altro", note: "x" }, "127.0.0.1");
    expect(model.findLuogoRiepilogo).not.toHaveBeenCalled();
    expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ id_fuoco: 42, id_registrazione: null }));
  });
});
