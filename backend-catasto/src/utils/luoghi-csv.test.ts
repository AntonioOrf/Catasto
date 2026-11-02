import { describe, expect, it } from "vitest";
import { avvisiLuogo, buildLuoghiCsv, buildLuoghiQuery, COLONNE_LUOGHI } from "./luoghi-csv.js";
import { parseCsv } from "./csv.js";

describe("buildLuoghiCsv", () => {
  it("scrive l'intestazione e una riga per luogo, con NULL come campo vuoto", () => {
    const csv = buildLuoghiCsv([
      {
        id_registrazione: 4,
        id_serie: 1,
        nome_serie: "Firenze 1427 (primi ufficiali)",
        id_quartiere: 1,
        nome_quartiere: "Quart. di Santa Croce",
        id_piviere: 4,
        nome_piviere: "Gonf. Carro",
        id_popolo: null,
        nome_popolo: null,
        old_serie: 1,
        old_quartiere: 2,
        old_piviere: 1,
        old_popolo: 0,
        fuochi: 1273,
      },
    ]);
    const [intestazione, riga] = parseCsv(csv);
    expect(intestazione).toEqual([...COLONNE_LUOGHI]);
    expect(riga).toEqual([
      "4", "1", "Firenze 1427 (primi ufficiali)", "1", "Quart. di Santa Croce",
      "4", "Gonf. Carro", "", "", "1", "2", "1", "0", "1273", "",
    ]);
  });

  it("non unisce le voci omonime con numero romano e protegge virgole e apici", () => {
    const csv = buildLuoghiCsv([
      { id_registrazione: 1, nome_popolo: "S. Lorenzo (I)", fuochi: 3 },
      { id_registrazione: 2, nome_popolo: "S. Lorenzo (II)", fuochi: 2 },
      { id_registrazione: 3, nome_popolo: 'Com. "Pieve", Vecchia', fuochi: 1 },
    ]);
    const righe = parseCsv(csv).slice(1);
    const popolo = COLONNE_LUOGHI.indexOf("nome_popolo");
    expect(righe.map((r) => r[popolo])).toEqual(["S. Lorenzo (I)", "S. Lorenzo (II)", 'Com. "Pieve", Vecchia']);
  });

  it("senza righe produce la sola intestazione", () => {
    expect(parseCsv(buildLuoghiCsv([]))).toHaveLength(1);
  });
});

describe("buildLuoghiQuery", () => {
  it("usa t_mappa_conversione solo se richiesto", () => {
    expect(buildLuoghiQuery(true)).toContain("t_mappa_conversione");
    expect(buildLuoghiQuery(false)).not.toContain("t_mappa_conversione");
    expect(buildLuoghiQuery(false)).toContain("NULL AS old_serie");
  });

  it("ordina per fuochi decrescenti", () => {
    expect(buildLuoghiQuery(true)).toMatch(/ORDER BY fuochi DESC, ts\.id_registrazione\s*$/);
  });
});

describe("avvisiLuogo", () => {
  const gonfalone = { id_serie: 1, id_quartiere: 1, id_piviere: 4, old_serie: 1, fuochi: 10 };

  it("nessun avviso per un luogo regolare", () => {
    expect(avvisiLuogo(gonfalone)).toEqual([]);
    expect(avvisiLuogo({ id_serie: 3, id_quartiere: 5, id_piviere: 18, id_popolo: 28, old_serie: 3, fuochi: 5 })).toEqual([]);
  });

  it("segnala i gonfaloni di Firenze senza quartiere", () => {
    expect(avvisiLuogo({ ...gonfalone, id_quartiere: null })).toEqual(["quartiere_mancante"]);
    // Fuori da Firenze il quartiere mancante e' normale (es. Contado di Pistoia).
    expect(avvisiLuogo({ id_serie: 21, id_quartiere: null, id_popolo: 1, old_serie: 21, fuochi: 3 })).toEqual([]);
  });

  it("segnala i codici originali incoerenti o assenti, solo se la conversione c'e'", () => {
    expect(avvisiLuogo({ ...gonfalone, old_serie: 16 })).toEqual(["codici_originali_incoerenti"]);
    expect(avvisiLuogo({ ...gonfalone, old_serie: null })).toEqual(["codici_originali_assenti"]);
    expect(avvisiLuogo({ ...gonfalone, old_serie: null }, false)).toEqual([]);
  });

  it("segnala i luoghi aggregati e quelli senza fuochi", () => {
    expect(avvisiLuogo({ id_serie: 16, old_serie: null, fuochi: 1206 })).toEqual([
      "codici_originali_assenti",
      "luogo_aggregato",
    ]);
    expect(avvisiLuogo({ ...gonfalone, fuochi: 0 })).toEqual(["senza_fuochi"]);
  });

  it("finisce nell'ultima colonna del CSV, separato da punto e virgola", () => {
    const [, riga] = parseCsv(buildLuoghiCsv([{ id_serie: 1, id_piviere: 1, old_serie: 1, fuochi: 0 }]));
    expect(riga.at(-1)).toBe("quartiere_mancante;senza_fuochi");
  });
});
