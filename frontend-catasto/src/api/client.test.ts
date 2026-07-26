import { describe, expect, it } from "vitest";
import { buildParams } from "./client";

describe("buildParams", () => {
  it("maps filter fields to their query param names", () => {
    const params = buildParams({
      searchPersona: "Rossi",
      searchLocalita: "Firenze",
      filterMestiere: "fabbro",
      filterFortuneMin: "100",
      filterFortuneMax: "500",
      sortBy: "fortune",
      sortOrder: "DESC",
    });

    expect(params.get("q_persona")).toBe("Rossi");
    expect(params.get("q_localita")).toBe("Firenze");
    expect(params.get("mestiere")).toBe("fabbro");
    expect(params.get("fortune_min")).toBe("100");
    expect(params.get("fortune_max")).toBe("500");
    expect(params.get("sort_by")).toBe("fortune");
    expect(params.get("order")).toBe("DESC");
  });

  it("omits params for empty/falsy filter values", () => {
    const params = buildParams({ searchPersona: "", filterMestiere: undefined });

    expect(params.has("q_persona")).toBe(false);
    expect(params.has("mestiere")).toBe(false);
    expect(params.toString()).toBe("");
  });
});
