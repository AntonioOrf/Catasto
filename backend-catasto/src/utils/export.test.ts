import { describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const { describeSimpleFilters, simpleFiltersToAst } = await import("./describe-filters.js");
const { FUOCHI_COLUMNS, PARENTI_COLUMNS, columnLabels, toCells } = await import("./export-columns.js");
const { formatCsvRow, parseCsv } = await import("./csv.js");
const { exportFilename, exportMaxRows, DEFAULT_EXPORT_MAX_ROWS } = await import("../services/export.service.js");
const { Traduttore } = await import("../models/traduzioni.model.js");

const options = {
  mestieri: [{ id: 3, label: "Lanaiolo" }],
  quartieri: [{ id: "1,2", label: "San Giovanni" }],
};

describe("describeSimpleFilters", () => {
  it("usa le stesse parole della ricerca avanzata, con le etichette delle opzioni", () => {
    expect(
      describeSimpleFilters({ q_persona: "Nuto", mestiere: "3", quartiere: "1,2", fortune_min: "100", page: "2" }, options, "it"),
    ).toBe('Nome fuoco contiene "Nuto" e Mestiere è uguale a "Lanaiolo" e Quartiere è uguale a "San Giovanni" e Fortune maggiore o uguale a 100');
  });

  it("nessun filtro: tutti i fuochi; la località resta in testa", () => {
    expect(describeSimpleFilters({}, options, "en")).toBe("all households");
    expect(describeSimpleFilters({ q_localita: "Spirito", creditoM_max: "5" }, options, "it")).toBe(
      'Località contiene "Spirito" e Credito ai Monti minore o uguale a 5',
    );
  });

  it("i fuochi scelti a mano sono contati in testa", () => {
    expect(describeSimpleFilters({ ids: "4,8,15" }, options, "it")).toBe("fuochi scelti a mano: 3");
    expect(describeSimpleFilters({ ids: "4", q_localita: "Spirito" }, options, "en")).toBe(
      'hand-picked households: 1 and Place contains "Spirito"',
    );
  });

  it("ignora parametri non scalari", () => {
    expect(simpleFiltersToAst({ mestiere: ["1", "2"] }).children).toEqual([]);
  });
});

describe("colonne dell'export", () => {
  it("etichette nella lingua richiesta", () => {
    expect(columnLabels(FUOCHI_COLUMNS, "it").slice(0, 3)).toEqual(["ID fuoco", "Nome fuoco", "Mestiere"]);
    expect(columnLabels(PARENTI_COLUMNS, "en")).toContain("Marital status");
  });

  it("numeri veri, assenti vuoti, lookup tradotti", () => {
    const traduttore = new Traduttore("en", new Map([["mestieri", new Map([["lanaiolo", "Wool manufacturer"]])]]));
    const cells = toCells(
      { id: 5, nome: " RUCELLAI ", mestiere: "Lanaiolo", fortune: "1000.50", credito: null, credito_m: "0.00", serie: "" },
      FUOCHI_COLUMNS,
      traduttore,
    );
    const at = (key: string) => cells[FUOCHI_COLUMNS.findIndex((c) => c.key === key)];
    expect(at("id")).toBe(5);
    expect(at("nome")).toBe("RUCELLAI");
    expect(at("mestiere")).toBe("Wool manufacturer");
    expect(at("fortune")).toBe(1000.5);
    expect(at("credito")).toBeNull();
    expect(at("credito_m")).toBe(0);
    expect(at("serie")).toBeNull();
  });
});

describe("CSV", () => {
  it("con il punto e virgola mette fra apici i campi che lo contengono", () => {
    expect(formatCsvRow(["a;b", "c,d", 'e"f'], ";")).toBe('"a;b";c,d;"e""f"');
    expect(parseCsv(formatCsvRow(["a,b", "c"]))).toEqual([["a,b", "c"]]);
  });
});

describe("opzioni dell'export", () => {
  it("EXPORT_MAX_ROWS: intero positivo, altrimenti il default", () => {
    expect(exportMaxRows("500")).toBe(500);
    expect(exportMaxRows("0")).toBe(DEFAULT_EXPORT_MAX_ROWS);
    expect(exportMaxRows("tanti")).toBe(DEFAULT_EXPORT_MAX_ROWS);
    expect(exportMaxRows(undefined)).toBe(DEFAULT_EXPORT_MAX_ROWS);
  });

  it("nome del file per formato e contenuto", () => {
    expect(exportFilename({ format: "csv", parenti: false }, "2026-10-29")).toBe("catasto1427-fuochi-2026-10-29.csv");
    expect(exportFilename({ format: "csv", parenti: true }, "2026-10-29")).toBe("catasto1427-parenti-2026-10-29.csv");
    expect(exportFilename({ format: "xlsx", parenti: true }, "2026-10-29")).toBe("catasto1427-2026-10-29.xlsx");
  });
});
