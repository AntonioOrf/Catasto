import { describe, expect, it } from "vitest";
import { parseSharedState } from "./shared-state.js";

describe("parseSharedState", () => {
  it("vuota o memory = in memoria", () => {
    expect(parseSharedState(undefined)).toBe("memory");
    expect(parseSharedState("")).toBe("memory");
    expect(parseSharedState(" Memory ")).toBe("memory");
  });

  it("mysql = nel database", () => {
    expect(parseSharedState("mysql")).toBe("mysql");
    expect(parseSharedState("MYSQL")).toBe("mysql");
  });

  it("un valore sconosciuto blocca l'avvio invece di ricadere sulla memoria", () => {
    expect(() => parseSharedState("redis")).toThrow(/SHARED_STATE/);
  });
});
