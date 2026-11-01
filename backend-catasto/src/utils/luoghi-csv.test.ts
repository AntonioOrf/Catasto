import { describe, expect, it } from "vitest";
import { buildLuoghiCsv, buildLuoghiQuery, COLONNE_LUOGHI } from "./luoghi-csv.js";
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
      "4", "Gonf. Carro", "", "", "1", "2", "1", "0", "1273",
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
