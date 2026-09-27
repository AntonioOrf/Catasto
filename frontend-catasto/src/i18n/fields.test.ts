import { describe, expect, it } from "vitest";
import { MISSING_FIELD_TRANSLATIONS, fieldLabel, operatorLabel } from "./fields";
import { interpolate } from "./messages";

describe("i18n", () => {
  it("ogni campo del registry ha l'etichetta inglese", () => {
    expect(MISSING_FIELD_TRANSLATIONS).toEqual([]);
  });

  it("sceglie la lingua richiesta", () => {
    expect(fieldLabel("mestiere", "it")).toBe("Mestiere");
    expect(fieldLabel("mestiere", "en")).toBe("Occupation");
    expect(operatorLabel("contains", "en")).toBe("contains");
    expect(operatorLabel("contains", "it")).toBe("contiene");
  });

  it("interpola i segnaposto e lascia intatti quelli ignoti", () => {
    expect(interpolate("{n} fuochi su {tot}", { n: 3 })).toBe("3 fuochi su {tot}");
  });
});
