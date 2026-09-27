import { describe, expect, it } from "vitest";
import { parseTrustProxy } from "./trust-proxy.js";

describe("parseTrustProxy", () => {
  it("lascia disattivato un valore assente o vuoto", () => {
    expect(parseTrustProxy(undefined)).toBeUndefined();
    expect(parseTrustProxy("")).toBeUndefined();
  });

  it("converte i booleani invece di passarli come indirizzo", () => {
    expect(parseTrustProxy("true")).toBe(true);
    expect(parseTrustProxy("false")).toBe(false);
  });

  it("converte il numero di proxy", () => {
    expect(parseTrustProxy("1")).toBe(1);
  });

  it("passa invariati nomi e indirizzi", () => {
    expect(parseTrustProxy("loopback")).toBe("loopback");
    expect(parseTrustProxy("10.0.0.1, 10.0.0.2")).toBe("10.0.0.1, 10.0.0.2");
  });
});
