import { describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const { toPages } = await import("./catasto.service.js");

describe("toPages", () => {
  it("tiene solo etichetta e immagine https di ogni carta", () => {
    const manifest = {
      sequences: [
        {
          canvases: [
            { label: "c. 1r", images: [{ resource: { "@id": "https://iiif.example/1.jpg" } }], extra: "x" },
            { label: "c. 1v", images: [{ resource: { "@id": "javascript:alert(1)" } }] },
            { label: "c. 2r", images: [{ resource: { "@id": "http://iiif.example/2.jpg" } }] },
          ],
        },
      ],
    };
    expect(toPages(manifest)).toEqual([{ label: "c. 1r", image: "https://iiif.example/1.jpg" }]);
  });

  it("degrada a lista vuota su un manifest malformato", () => {
    expect(toPages(null)).toEqual([]);
    expect(toPages({ sequences: "boh" })).toEqual([]);
  });
});
