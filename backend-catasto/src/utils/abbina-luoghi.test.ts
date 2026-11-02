import { describe, expect, it } from "vitest";
import {
  abbinaLuogo,
  chiave,
  cittaDelLuogo,
  indicizzaRepetti,
  localitaChiave,
  nomePiviere,
  scomponiPopolo,
  type LuogoCatasto,
  type VoceRepetti,
} from "./abbina-luoghi.js";

function voce(v: Partial<VoceRepetti> & { titolo: string }): VoceRepetti {
  return {
    slug: "",
    contesto: "",
    tipo: "",
    dedicazione: "",
    piviere: "",
    comunita: "",
    giurisdizione: "",
    diocesi: "",
    lat: "",
    lng: "",
    fonte_coordinate: "",
    note: "",
    ...v,
  };
}

function luogo(l: Partial<LuogoCatasto>): LuogoCatasto {
  return {
    id_registrazione: "1",
    id_serie: "3",
    nome_serie: "Contado Fiorentino",
    nome_quartiere: "Quart. di Santo Spirito",
    nome_piviere: "",
    nome_popolo: "",
    fuochi: "10",
    ...l,
  };
}

describe("nomi del catasto", () => {
  it("scompone il popolo in dedicazione e località", () => {
    expect(scomponiPopolo("Pop. S. Donato a Luciana")).toEqual({
      completo: "S. Donato a Luciana",
      dedicazione: "S. Donato",
      localita: ["Luciana"],
    });
    expect(scomponiPopolo("Pop. S. Donato a Legnone e Bagnolo").localita).toEqual([
      "Legnone e Bagnolo",
      "Legnone",
      "Bagnolo",
    ]);
    expect(scomponiPopolo("Pop. S. Michele a Monteluco a Lecchi").localita).toEqual(["Monteluco a Lecchi", "Monteluco"]);
  });

  it("gestisce comuni, articoli, alternative e parentesi non chiuse", () => {
    expect(scomponiPopolo("Com. la Vaiana (o Lavaiano)").localita).toEqual(["Vaiana", "Lavaiano"]);
    expect(scomponiPopolo("Com. la Cornia, popolo di S. Agnolo")).toMatchObject({ localita: ["Cornia"], dedicazione: "S. Agnolo" });
    expect(scomponiPopolo("Com. di Gangalandi (S. Michele a Gangalandi").localita).toEqual(["Gangalandi"]);
    expect(scomponiPopolo("Pop. S . Tommè a Castelfranco").dedicazione).toBe("S. Tommè");
    expect(scomponiPopolo("Com. Levane1").localita).toEqual(["Levane"]);
  });

  it("ricava il nome del piviere e la città", () => {
    expect(nomePiviere("Piv. di San Piero in Bossolo")).toBe("San Piero in Bossolo");
    expect(nomePiviere("Piv. di Giogoli (IV)")).toBe("Giogoli");
    expect(nomePiviere("Città e sobborghi di Prato")).toBe("Prato");
    expect(nomePiviere("Gonf. Carro")).toBe("");
    expect(localitaChiave("S. Pietro in Bossolo")).toBe("BOSSOLO");
    expect(cittaDelLuogo(luogo({ nome_serie: "Città di Cortona", nome_quartiere: "" }))).toBe("Cortona");
    expect(cittaDelLuogo(luogo({ nome_serie: "Colle", nome_quartiere: "Città di Colle" }))).toBe("Colle di Val d'Elsa");
  });

  it("rende equivalenti grafie dei santi, J e preposizioni articolate", () => {
    expect(chiave("S. Piero a Ema")).toBe(chiave("S. Pietro a Ema"));
    expect(chiave("Fojano")).toBe(chiave("Foiano"));
    expect(chiave("S. Miniato a Monte")).toBe(chiave("S. Miniato al Monte"));
  });
});

describe("abbinaLuogo", () => {
  const voci = [
    voce({ titolo: "BOSSOLO (S. PIETRO IN)", tipo: "Antica pieve", lat: "43.55", lng: "11.20", fonte_coordinate: "manual" }),
    voce({
      titolo: "MARCIALLA",
      tipo: "Villata",
      dedicazione: "S. Maria",
      piviere: "S. Pietro in Bossolo",
      lat: "43.574",
      lng: "11.140",
      fonte_coordinate: "manual",
    }),
    // Omonimo lontano: non è il popolo del piviere di Bossolo.
    voce({ titolo: "MARCIALLA in Val di Chiana", lat: "43.20", lng: "11.90", fonte_coordinate: "manual" }),
    voce({ titolo: "LUCIANA", dedicazione: "S. Donato a Luciana", lat: "43.56", lng: "11.25", fonte_coordinate: "distanza" }),
    voce({ titolo: "CORTONA", tipo: "Città", lat: "43.27", lng: "11.98", fonte_coordinate: "text" }),
    voce({ titolo: "SENZA COORDINATE" }),
  ];
  const indice = indicizzaRepetti(voci);

  it("sicura: coordinate note, stesso piviere e vicino alla pieve", () => {
    const a = abbinaLuogo(luogo({ nome_piviere: "Piv. di San Piero in Bossolo", nome_popolo: "Pop. S. Maria a Marcialla" }), indice);
    expect(a.certezza).toBe("sicura");
    expect(a.voce?.titolo).toBe("MARCIALLA");
    expect(a.pieve?.titolo).toBe("BOSSOLO (S. PIETRO IN)");
    expect(a.lat).toBeCloseTo(43.574);
  });

  it("approssimata: coordinate calcolate dalla distanza", () => {
    const a = abbinaLuogo(luogo({ nome_piviere: "Piv. di San Piero in Bossolo", nome_popolo: "Pop. S. Donato a Luciana" }), indice);
    expect(a.certezza).toBe("approssimata");
    expect(a.motivo).toContain("coordinate_da_distanza");
  });

  it("solo_piviere: luogo assente, coordinate della pieve", () => {
    const a = abbinaLuogo(luogo({ nome_piviere: "Piv. di San Piero in Bossolo", nome_popolo: "Pop. S. Lucia a Inesistente" }), indice);
    expect(a.certezza).toBe("solo_piviere");
    expect(a.lat).toBeCloseTo(43.55);
    expect(a.voce).toBeNull();
  });

  it("non_trovata: né luogo né pieve; i gonfaloni di Firenze restano alla fase delle città", () => {
    expect(abbinaLuogo(luogo({ nome_piviere: "Piv. di Nessuno", nome_popolo: "Pop. S. Lucia a Nulla" }), indice).certezza).toBe(
      "non_trovata",
    );
    const g = abbinaLuogo(luogo({ id_serie: "1", nome_serie: "Firenze 1427", nome_piviere: "Gonf. Carro" }), indice);
    expect(g).toMatchObject({ certezza: "non_trovata", motivo: "gonfalone_firenze", lat: null });
  });

  it("città con un solo record: la città stessa", () => {
    const a = abbinaLuogo(luogo({ id_serie: "10", nome_serie: "Città di Cortona", nome_quartiere: "" }), indice);
    expect(a.voce?.titolo).toBe("CORTONA");
    expect(a.lat).toBeCloseTo(43.27);
  });
});
