import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterOptions } from "@catasto/shared";

const query = vi.fn();
vi.mock("../config/db.js", () => ({ default: { query } }));

const { normalizeLabel, parseLang, translateFilters, Traduttore, TraduzioniModel, TRADUZIONI_TTL_MS } =
  await import("./traduzioni.model.js");

const righe = [
  { tabella: "mestieri", valore_it: "Lanaiolo", valore: "Wool manufacturer" },
  { tabella: "mestieri", valore_it: "Beccaio", valore: "Butcher" },
  { tabella: "casa", valore_it: "Proprietà", valore: "Owned" },
  { tabella: "casa", valore_it: "Pigione", valore: "  " },
];

describe("parseLang", () => {
  it("riconosce solo en, tutto il resto e' italiano", () => {
    expect(parseLang("en")).toBe("en");
    expect(parseLang(" EN ")).toBe("en");
    expect(parseLang(["en", "it"])).toBe("en");
    for (const value of [undefined, "", "it", "fr", "english", 1, {}, ["fr"]]) {
      expect(parseLang(value)).toBe("it");
    }
  });
});

describe("normalizeLabel", () => {
  it("ignora maiuscole, accenti e spazi superflui", () => {
    expect(normalizeLabel("  Proprietà ")).toBe("proprieta");
    expect(normalizeLabel("LAVORATORE   della  terra")).toBe("lavoratore della terra");
    expect(normalizeLabel("Pròprietà")).toBe(normalizeLabel("proprieta"));
  });
});

describe("Traduttore", () => {
  const t = new Traduttore(
    "en",
    new Map([["mestieri", new Map([["lanaiolo", "Wool manufacturer"]])]]),
  );

  it("traduce confrontando le etichette normalizzate", () => {
    expect(t.t("mestieri", " LANAIOLO")).toBe("Wool manufacturer");
  });

  it("ricade sull'italiano per valori, tabelle o tipi senza traduzione", () => {
    expect(t.t("mestieri", "Speziale")).toBe("Speziale");
    expect(t.t("casa", "Lanaiolo")).toBe("Lanaiolo");
    expect(t.t("mestieri", null)).toBeNull();
    expect(t.t("mestieri", undefined)).toBeUndefined();
  });

  it("traduce solo i campi indicati delle righe", () => {
    const rows = [{ nome: "Lanaiolo", mestiere: "lanaiolo" }, { nome: "X", mestiere: null }];
    t.translateRows(rows, { mestiere: "mestieri" });
    expect(rows).toEqual([{ nome: "Lanaiolo", mestiere: "Wool manufacturer" }, { nome: "X", mestiere: null }]);
  });
});

describe("translateFilters", () => {
  const filters = {
    mestieri: [
      { id: 1, label: "Beccaio" },
      { id: 2, label: "Lanaiolo" },
      { id: 3, label: "Speziale" },
    ],
    quartieri: [{ id: "3,7", label: "San Giovanni" }],
    casa: [],
  } as unknown as FilterOptions;
  const t = new Traduttore(
    "en",
    new Map([
      ["mestieri", new Map([["beccaio", "Butcher"], ["lanaiolo", "Wool manufacturer"]])],
      ["rapporti_parentela", new Map([["san giovanni", "Saint John"]])],
    ]),
  );

  it("traduce e riordina le etichette senza toccare id, luoghi e oggetto in cache", () => {
    const snapshot = structuredClone(filters);
    const out = translateFilters(filters, t);
    expect(out.mestieri).toEqual([
      { id: 1, label: "Butcher" },
      { id: 3, label: "Speziale" },
      { id: 2, label: "Wool manufacturer" },
    ]);
    expect(out.quartieri).toEqual([{ id: "3,7", label: "San Giovanni" }]);
    expect(filters).toEqual(snapshot);
  });

  it("in italiano restituisce l'oggetto invariato", () => {
    expect(translateFilters(filters, new Traduttore("it"))).toBe(filters);
  });
});

describe("TraduzioniModel.forLang", () => {
  beforeEach(() => {
    query.mockReset();
    TraduzioniModel.clearCache();
    vi.useRealTimers();
  });

  it("in italiano non interroga il DB", async () => {
    const t = await TraduzioniModel.forLang("it");
    expect(t.vuoto).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });

  it("carica una volta, condivide la Promise e scarta le traduzioni vuote", async () => {
    query.mockResolvedValue([righe]);
    const [a, b] = await Promise.all([TraduzioniModel.forLang("en"), TraduzioniModel.forLang("en")]);
    expect(a).toBe(b);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual(["en"]);
    expect(a.t("casa", "proprieta")).toBe("Owned");
    expect(a.t("casa", "Pigione")).toBe("Pigione");
  });

  it("ricarica dopo il TTL", async () => {
    vi.useFakeTimers();
    query.mockResolvedValue([righe]);
    await TraduzioniModel.forLang("en");
    vi.advanceTimersByTime(TRADUZIONI_TTL_MS + 1);
    await TraduzioniModel.forLang("en");
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("senza la tabella (migrazione non applicata) resta in italiano, senza errori", async () => {
    query.mockRejectedValue(Object.assign(new Error("Table doesn't exist"), { code: "ER_NO_SUCH_TABLE" }));
    const t = await TraduzioniModel.forLang("en");
    expect(t.vuoto).toBe(true);
    expect(t.t("mestieri", "Lanaiolo")).toBe("Lanaiolo");
  });

  it("su un errore transitorio non rifiuta e non mette in cache il fallimento", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    query.mockRejectedValueOnce(new Error("ECONNRESET")).mockResolvedValueOnce([righe]);
    expect((await TraduzioniModel.forLang("en")).vuoto).toBe(true);
    expect((await TraduzioniModel.forLang("en")).t("mestieri", "Beccaio")).toBe("Butcher");
    expect(query).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
