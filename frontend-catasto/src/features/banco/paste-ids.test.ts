import { describe, expect, it } from "vitest";
import { parsePastedIds } from "./paste-ids";
import { idsToAdd } from "./add-target";

describe("parsePastedIds", () => {
  it("accetta qualunque separatore e conta i ripetuti una volta", () => {
    expect(parsePastedIds("10342, 10343\n10518\t10519 #10520\n10342")).toEqual({
      ids: [10342, 10343, 10518, 10519, 10520],
      repeated: 1,
      over: 0,
    });
  });

  it("scarta lo zero e tiene il limite", () => {
    expect(parsePastedIds("0 1 2 3 4", 2)).toEqual({ ids: [1, 2], repeated: 0, over: 2 });
    expect(parsePastedIds("niente")).toEqual({ ids: [], repeated: 0, over: 0 });
  });
});

describe("idsToAdd", () => {
  it("solo i nuovi, senza doppioni", () => {
    expect(idsToAdd([1, 2], [2, 3, 3, 4])).toEqual([3, 4]);
    expect(idsToAdd([1], [1])).toEqual([]);
  });
});
