import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const { toPages, CatastoService } = await import("./catasto.service.js");

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

describe("CatastoService.getManifest: errori dell'Archivio", () => {
  afterEach(() => vi.unstubAllGlobals());

  const tlsError = () =>
    Object.assign(new TypeError("fetch failed"), {
      cause: Object.assign(new Error("certificate has expired"), { code: "CERT_HAS_EXPIRED" }),
    });

  it("un certificato scaduto o un errore di rete diventano un 502", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(tlsError()));
    await expect(CatastoService.getManifest(900001)).rejects.toMatchObject({ status: 502 });
  });

  it("il timeout diventa un 504", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    await expect(CatastoService.getManifest(900002)).rejects.toMatchObject({ status: 504 });
  });

  it("un corpo non JSON diventa un 502", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })));
    await expect(CatastoService.getManifest(900003)).rejects.toMatchObject({ status: 502 });
  });
});
