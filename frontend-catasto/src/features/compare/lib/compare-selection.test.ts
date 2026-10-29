// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  COMPARE_STORAGE_KEY,
  buildCompareUrl,
  loadSelection,
  normalizeIds,
  parseIdsParam,
  readCompareFromHash,
  serializeIds,
  storeSelection,
  toggleId,
} from "./compare-selection";

const location = { origin: "https://catasto.example.org", pathname: "/", search: "" };

describe("link del confronto", () => {
  it("serializza e rilegge gli stessi id, nello stesso ordine", () => {
    const url = buildCompareUrl([12, 345, 678], location);
    expect(url).toBe("https://catasto.example.org/#confronta=12,345,678");
    expect(readCompareFromHash(new URL(url).hash)).toEqual([12, 345, 678]);
  });

  it("id non validi, duplicati e oltre il massimo vengono scartati senza errori", () => {
    expect(parseIdsParam("12,abc,-3,12,0,7.5, 99 ,,")).toEqual([12, 99]);
    expect(parseIdsParam(Array.from({ length: 600 }, (_, i) => i + 1).join(","))).toHaveLength(500);
    expect(parseIdsParam("")).toEqual([]);
    expect(serializeIds([3, 3, 4])).toBe("3,4");
  });

  it("senza #confronta non c'è confronto; convive con altri parametri del fragment", () => {
    expect(readCompareFromHash("")).toBeNull();
    expect(readCompareFromHash("#q=abc")).toBeNull();
    expect(readCompareFromHash("#q=abc&confronta=4,5")).toEqual([4, 5]);
    expect(readCompareFromHash("#confronta=")).toEqual([]);
  });

  it("normalizza numeri e stringhe, rifiuta id non sicuri", () => {
    expect(normalizeIds([1, "2", null, {}, 2 ** 60, "3"])).toEqual([1, 2, 3]);
  });
});

describe("selezione", () => {
  it("aggiunge e toglie; oltre cinque non cambia", () => {
    expect(toggleId([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleId([1, 2, 3], 2)).toEqual([1, 3]);
    const full = Array.from({ length: 500 }, (_, i) => i + 1);
    expect(toggleId(full, 501)).toEqual(full);
  });

  it("resta in sessionStorage e tollera valori alterati", () => {
    storeSelection([4, 8]);
    expect(loadSelection()).toEqual([4, 8]);
    sessionStorage.setItem(COMPARE_STORAGE_KEY, "{rotto");
    expect(loadSelection()).toEqual([]);
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify({ a: 1 }));
    expect(loadSelection()).toEqual([]);
  });
});
