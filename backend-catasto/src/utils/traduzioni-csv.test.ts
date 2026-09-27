import { describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const { parseCsv, formatCsvRow } = await import("./csv.js");
const { buildExportCsv, parseImportCsv } = await import("./traduzioni-csv.js");

describe("CSV", () => {
  it("gestisce campi fra apici con virgole, apici e a capo", () => {
    const text = '﻿tabella,valore_it,valore_en\r\nmestieri,"Lavoratore, della terra","Farm ""labourer""\nline"\n\n';
    expect(parseCsv(text)).toEqual([
      ["tabella", "valore_it", "valore_en"],
      ["mestieri", "Lavoratore, della terra", 'Farm "labourer"\nline'],
    ]);
  });

  it("formatta e rilegge gli stessi campi", () => {
    const fields = ["casa", 'Casa "del" podere, parte', " spazi "];
    expect(parseCsv(formatCsvRow(fields))).toEqual([fields]);
  });

  it("rifiuta un apice non chiuso", () => {
    expect(() => parseCsv('a,"b')).toThrow(/apice/);
  });
});

describe("buildExportCsv", () => {
  const mappe = new Map([["mestieri", new Map([["lanaiolo", "Wool manufacturer"]])]]);
  const valori = [{ tabella: "mestieri", valori: ["Speziale", "Lanaiolo", "Spezialè ", null, "", "Beccaio, minuto"] }];

  it("elenca una volta i valori senza traduzione", () => {
    expect(buildExportCsv(valori, mappe, "en")).toBe(
      'tabella,valore_it,valore_en\nmestieri,"Beccaio, minuto",\nmestieri,Speziale,\n',
    );
  });

  it("con tutte include anche i tradotti", () => {
    expect(buildExportCsv(valori, mappe, "en", true)).toContain("mestieri,Lanaiolo,Wool manufacturer\n");
  });
});

describe("parseImportCsv", () => {
  it("legge le righe compilate e salta quelle vuote", () => {
    const csv = "tabella,valore_it,valore_en\nmestieri, Lanaiolo ,Wool manufacturer\nmestieri,Speziale,\n";
    expect(parseImportCsv(csv)).toEqual([
      { tabella: "mestieri", valore_it: "Lanaiolo", lingua: "en", valore: "Wool manufacturer" },
    ]);
  });

  it("rifiuta intestazioni e tabelle sconosciute", () => {
    expect(() => parseImportCsv("a,b,c\n")).toThrow(/Intestazione/);
    expect(() => parseImportCsv("tabella,valore_it,valore_it\n")).toThrow(/Intestazione/);
    expect(() => parseImportCsv("tabella,valore_it,valore_en\nt_popoli,Rovezzano,X\n")).toThrow(
      /Riga 2: tabella sconosciuta/,
    );
  });
});
