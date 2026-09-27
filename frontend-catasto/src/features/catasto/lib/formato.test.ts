import { describe, expect, it } from "vitest";
import { NON_INDICATO, eta, fiorini, piviereEPopolo } from "./formato";

describe("fiorini", () => {
  it("distingue il valore assente dallo zero", () => {
    expect(fiorini(null)).toBe(NON_INDICATO);
    expect(fiorini(undefined)).toBe(NON_INDICATO);
    expect(fiorini(0)).toBe("0 fiorini");
  });

  it("formatta con il locale italiano", () => {
    expect(fiorini(12345)).toBe("12.345 fiorini");
  });
});

describe("eta", () => {
  it("mostra 0 per i neonati e il trattino solo se manca", () => {
    expect(eta(0)).toBe("0");
    expect(eta(42)).toBe("42");
    expect(eta(null)).toBe("-");
    expect(eta(undefined)).toBe("-");
  });
});

describe("piviereEPopolo", () => {
  it("unisce solo le parti presenti", () => {
    expect(piviereEPopolo("San Giovanni", "Santa Maria")).toBe("San Giovanni » Santa Maria");
    expect(piviereEPopolo("San Giovanni", null)).toBe("San Giovanni");
    expect(piviereEPopolo(undefined, "Santa Maria")).toBe("Santa Maria");
    expect(piviereEPopolo(null, "  ")).toBe("");
    expect(piviereEPopolo(null, null)).toBe("");
  });
});
