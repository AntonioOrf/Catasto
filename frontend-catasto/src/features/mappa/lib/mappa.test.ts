import { describe, expect, it } from "vitest";
import { classe, filtriDaQuery, mescola, pesoClasse, raggio, soglieQuantili } from "./mappa";

describe("mappa: scale e colori", () => {
  it("il raggio cresce con la radice dei fuochi e ha un minimo", () => {
    expect(raggio(1)).toBe(3);
    expect(raggio(400)).toBeCloseTo(22);
    expect(raggio(1600)).toBeCloseTo(2 * raggio(400));
  });

  it("le soglie a quantili dividono i valori in classi", () => {
    const valori = Array.from({ length: 100 }, (_, i) => i + 1);
    const soglie = soglieQuantili(valori);
    expect(soglie).toEqual([21, 41, 61, 81]);
    expect(classe(1, soglie)).toBe(0);
    expect(classe(50, soglie)).toBe(2);
    expect(classe(100, soglie)).toBe(4);
    expect(soglieQuantili([])).toEqual([]);
    // Valori tutti uguali: una soglia sola, nessuna classe vuota inventata.
    expect(soglieQuantili([5, 5, 5, 5])).toEqual([5]);
  });

  it("le classi vanno dal chiaro al pieno", () => {
    expect(pesoClasse(0, 5)).toBe(20);
    expect(pesoClasse(4, 5)).toBe(100);
    expect(pesoClasse(0, 1)).toBe(100);
  });

  it("mescola due colori esadecimali", () => {
    expect(mescola("#000000", "#ffffff", 50)).toBe("#808080");
    expect(mescola("#2a5bb8", "#f4f6fc", 100)).toBe("#2a5bb8");
    expect(mescola("#fff", "#000", 0)).toBe("#000000");
    // Colore non leggibile: si tiene il primo invece di produrre NaN.
    expect(mescola("rgb(1,2,3)", "#000000", 50)).toBe("rgb(1,2,3)");
  });

  it("legge i filtri dalla query string e scarta chiavi e valori vuoti o strani", () => {
    expect(filtriDaQuery("?mestiere=3&serie=&nome=Rossi&X-evil=1")).toEqual({ mestiere: "3", nome: "Rossi" });
    expect(filtriDaQuery("")).toEqual({});
  });
});
