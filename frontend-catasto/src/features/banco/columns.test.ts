// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIELD_REGISTRY } from "@catasto/shared";
import {
  COLUMNS,
  COLUMNS_STORAGE_KEY,
  defaultColumns,
  loadColumns,
  moveColumn,
  normalizeColumns,
  resetColumns,
  storeColumns,
  toggleColumn,
  visibleColumns,
} from "./columns";

beforeEach(() => localStorage.clear());

const keys = (state: ReturnType<typeof defaultColumns>) => visibleColumns(state).map((c) => c.key);

describe("colonne del Banco", () => {
  it("vengono dal registro dei campi, più le colonne derivate", () => {
    const all = COLUMNS.map((c) => c.key);
    for (const key of ["fortune", "mestiere", "piviere", "segnatura_portata"]) {
      expect(FIELD_REGISTRY.some((f) => f.key === key)).toBe(true);
      expect(all).toContain(key);
    }
    expect(all).toEqual(expect.arrayContaining(["bocche", "eta_media", "campione", "localita"]));
    // I campi dei parenti restano filtri.
    expect(all).not.toContain("eta_parente");
    expect(all).not.toContain("particolarita_parente");
  });

  it("partenza come nel mockup", () => {
    expect(keys(defaultColumns())).toEqual(["nome", "mestiere", "localita", "imponibile", "fortune", "bocche", "campione"]);
  });

  it("accende, spegne e sposta; il nome non si spegne", () => {
    let s = toggleColumn(defaultColumns(), "credito");
    expect(keys(s)).toContain("credito");
    s = toggleColumn(s, "mestiere");
    expect(keys(s)).not.toContain("mestiere");
    expect(toggleColumn(s, "nome")).toBe(s);
    s = moveColumn(s, "bocche", 1);
    expect(keys(s).slice(0, 2)).toEqual(["nome", "bocche"]);
    expect(moveColumn(s, "bocche", -5).order[0]).toBe("bocche");
    expect(moveColumn(s, "boh", 2)).toBe(s);
  });

  it("si ricorda sul dispositivo e si ripristina", () => {
    const s = moveColumn(toggleColumn(defaultColumns(), "eta_media"), "eta_media", 0);
    storeColumns(s);
    expect(loadColumns()).toEqual(s);
    expect(resetColumns()).toEqual(defaultColumns());
    expect(localStorage.getItem(COLUMNS_STORAGE_KEY)).toBeNull();
  });

  it("stato salvato vecchio o alterato: chiavi ignote fuori, colonne nuove in coda", () => {
    const s = normalizeColumns({ order: ["fortune", "boh", "nome", "fortune", 3], hidden: ["nome", "mestiere", "boh"] });
    expect(s.order.slice(0, 2)).toEqual(["fortune", "nome"]);
    expect(s.order).toHaveLength(COLUMNS.length);
    expect(s.hidden).toContain("mestiere");
    expect(s.hidden).not.toContain("nome");
    // Una colonna nuova spenta di default resta spenta.
    expect(s.hidden).toContain("eta_media");
    expect(normalizeColumns("rotto")).toEqual(defaultColumns());
  });

  it("senza localStorage valgono le colonne di partenza", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloccato");
    });
    expect(loadColumns()).toEqual(defaultColumns());
    spy.mockRestore();
  });
});
