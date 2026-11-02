import { describe, expect, it } from "vitest";
import { ErroreCsvLuoghi, leggiCsvLuoghi, migrazioneSeedSql, parametriUpsert, upsertLuoghiSql } from "./luoghi-geo.js";

const CSV = [
  "id_registrazione,nome_serie,nome_quartiere,nome_piviere,nome_popolo,certezza,lat,lng,repetti_titolo,pieve_titolo,motivo",
  "57,Contado Fiorentino,Quart. di Santo Spirito,Piv. di San Piero in Bossolo,Pop. S. Maria a Marcialla,sicura,43.574456,11.140283,MARCIALLA,BOSSOLO (S. PIETRO IN),piviere",
  "80,Contado Fiorentino,Quart. di Santo Spirito,Piv. di Campoli,Pop. S. Lucia a Nulla,solo_piviere,43.6,11.2,,CAMPOLI (PIEVE DI),luogo_non_nel_repetti",
  "4,Firenze 1427,Quart. di Santa Croce,Gonf. Carro,,non_trovata,,,,,gonfalone_firenze",
].join("\n");

describe("leggiCsvLuoghi", () => {
  it("legge il CSV degli abbinamenti", () => {
    const righe = leggiCsvLuoghi(CSV);
    expect(righe[0]).toEqual({
      id_registrazione: 57,
      lat: 43.574456,
      lng: 11.140283,
      certezza: "sicura",
      nome_moderno: "MARCIALLA",
      fonte: "Repetti: MARCIALLA",
      chiave_nomi: "Contado Fiorentino|Quart. di Santo Spirito|Piv. di San Piero in Bossolo|Pop. S. Maria a Marcialla",
      note: "piviere",
    });
    expect(righe[1]).toMatchObject({ certezza: "solo_piviere", nome_moderno: null, fonte: "Repetti (pieve): CAMPOLI (PIEVE DI)" });
    expect(righe[2]).toMatchObject({ certezza: "non_trovata", lat: null, lng: null });
  });

  it("accetta le colonne di una revisione manuale", () => {
    const [r] = leggiCsvLuoghi("id_registrazione,lat,lng,certezza,nome_moderno,fonte,note\n12,43.1,11.5,sicura,Lecchi,Catasto Leopoldino,controllato");
    expect(r).toMatchObject({ nome_moderno: "Lecchi", fonte: "Catasto Leopoldino", note: "controllato", chiave_nomi: null });
  });

  it("rifiuta righe incoerenti indicando la riga", () => {
    expect(() => leggiCsvLuoghi("id_registrazione,certezza,lat,lng\n5,sicura,,")).toThrow(/Riga 2: certezza sicura senza coordinate/);
    expect(() => leggiCsvLuoghi("id_registrazione,certezza,lat,lng\n5,forse,43,11")).toThrow(ErroreCsvLuoghi);
    expect(() => leggiCsvLuoghi("id_registrazione,certezza,lat,lng\n5,sicura,143,11")).toThrow(/lat non valida/);
    expect(() => leggiCsvLuoghi("id_registrazione,certezza,lat,lng\nx,sicura,43,11")).toThrow(/id_registrazione/);
    expect(() => leggiCsvLuoghi("id_registrazione,lat\n5,43")).toThrow(/Colonna mancante: certezza/);
  });
});

describe("upsert", () => {
  it("l'import automatico non sovrascrive le righe revisionate", () => {
    const sql = upsertLuoghiSql(2, false);
    expect(sql.match(/\(\?, \?, \?, \?, \?, \?, \?, \?, \?\)/g)).toHaveLength(2);
    expect(sql).toContain("lat = IF(revisionato = 1, lat, VALUES(lat))");
    // revisionato si aggiorna per ultimo, dopo le IF che lo leggono.
    expect(sql.trim().endsWith("revisionato = IF(revisionato = 1, revisionato, VALUES(revisionato))")).toBe(true);
  });

  it("l'import revisionato sovrascrive", () => {
    expect(upsertLuoghiSql(1, true)).toContain("lat = VALUES(lat)");
    expect(parametriUpsert(leggiCsvLuoghi(CSV).slice(0, 1), true).at(-1)).toBe(1);
  });

  it("la migrazione generata non contiene ; nei valori e raddoppia gli apici", () => {
    const sql = migrazioneSeedSql(
      leggiCsvLuoghi("id_registrazione,certezza,lat,lng,nome_moderno,motivo\n9,sicura,43,11,Sant'Andrea,a;b"),
      "-- prova",
    );
    expect(sql).toContain("'Sant''Andrea'");
    expect(sql).toContain("'a,b'");
    expect(sql.split(";").length).toBe(2);
  });
});
