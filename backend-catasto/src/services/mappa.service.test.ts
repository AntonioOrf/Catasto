import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const model = vi.hoisted(() => ({ aggregati: vi.fn(), luoghi: vi.fn() }));
vi.mock("../models/mappa.model.js", () => ({ MappaModel: model }));

const { MappaService, componiMappa, nomeLuogo } = await import("./mappa.service.js");

const geo = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  lat: 43.5,
  lng: 11.2,
  certezza: "sicura",
  nome_moderno: "MARCIALLA",
  serie: "Contado Fiorentino",
  piviere: "Piv. di San Piero in Bossolo",
  popolo: "Pop. S. Maria a Marcialla",
  quartiere: "Quart. di Santo Spirito",
  ...extra,
});
const agg = (id: number, fuochi: number, extra: Record<string, unknown> = {}) => ({
  id,
  fuochi,
  imponibile_medio: 100,
  con_mestiere: fuochi / 2,
  con_migrazione: 0,
  ampiezza_media: 4.5,
  ...extra,
});

describe("componiMappa", () => {
  it("unisce aggregati e coordinate e calcola le quote", () => {
    const m = componiMappa([agg(1, 10)], [geo(1)], true);
    expect(m.luoghi).toEqual([
      expect.objectContaining({ id: 1, lat: 43.5, lng: 11.2, certezza: "sicura", nome: "Pop. S. Maria a Marcialla", fuochi: 10, quota_mestiere: 0.5 }),
    ]);
    expect(m).toMatchObject({ fuochi: 10, non_localizzati: { fuochi: 0, luoghi: 0 }, disponibile: true });
  });

  it("conta come non localizzati i luoghi senza coordinate, non trovati o assenti", () => {
    const m = componiMappa(
      [agg(1, 10), agg(2, 5), agg(3, 7), agg(4, 2)],
      [geo(1), geo(2, { lat: null, lng: null }), geo(3, { certezza: "non_trovata" })],
      true,
    );
    expect(m.luoghi.map((l) => l.id)).toEqual([1]);
    expect(m.non_localizzati).toEqual({ fuochi: 14, luoghi: 3 });
    expect(m.fuochi).toBe(24);
  });

  it("ordina per fuochi decrescenti", () => {
    const m = componiMappa([agg(1, 3), agg(2, 9)], [geo(1), geo(2)], true);
    expect(m.luoghi.map((l) => l.id)).toEqual([2, 1]);
  });
});

describe("nomeLuogo", () => {
  it("usa il popolo, poi il piviere (gonfalone, podesteria), il quartiere e la serie", () => {
    expect(nomeLuogo({ popolo: null, piviere: "Gonf. Carro", quartiere: "Quart. di Santa Croce", serie: "Firenze 1427" })).toBe("Gonf. Carro");
    expect(nomeLuogo({ popolo: null, piviere: null, quartiere: null, serie: "Città di Arezzo" })).toBe("Città di Arezzo");
  });
});

describe("MappaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MappaService.clearCache();
  });

  it("applica i filtri della ricerca semplice e mette in cache le coordinate", async () => {
    model.aggregati.mockResolvedValue([agg(1, 4)]);
    model.luoghi.mockResolvedValue([geo(1)]);
    await MappaService.searchLuoghi({ mestiere: "3" });
    await MappaService.searchLuoghi({ mestiere: "1" });
    const [filtri] = model.aggregati.mock.calls[0];
    expect(filtri.conditions).toMatch(/WHERE/);
    expect(filtri.params).toContain(3);
    expect(model.aggregati).toHaveBeenCalledTimes(2);
    expect(model.luoghi).toHaveBeenCalledTimes(1);
  });

  it("senza la tabella delle coordinate risponde con la mappa non disponibile", async () => {
    model.aggregati.mockResolvedValue([agg(1, 4)]);
    model.luoghi.mockRejectedValue(Object.assign(new Error("no table"), { code: "ER_NO_SUCH_TABLE" }));
    const m = await MappaService.searchLuoghi({});
    expect(m).toMatchObject({ disponibile: false, luoghi: [], non_localizzati: { fuochi: 4, luoghi: 1 } });
  });

  it("propaga gli altri errori del database", async () => {
    model.aggregati.mockResolvedValue([]);
    model.luoghi.mockRejectedValue(new Error("connessione persa"));
    await expect(MappaService.searchLuoghi({})).rejects.toThrow("connessione persa");
  });
});
