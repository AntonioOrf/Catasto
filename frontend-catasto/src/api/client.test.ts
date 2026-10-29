import { afterEach, describe, expect, it, vi } from "vitest";
import { apiDownload, filenameFromDisposition } from "./client";

describe("filenameFromDisposition", () => {
  it("legge il nome con o senza virgolette, altrimenti il fallback", () => {
    expect(filenameFromDisposition('attachment; filename="catasto1427-2026-10-29.xlsx"', "x")).toBe("catasto1427-2026-10-29.xlsx");
    expect(filenameFromDisposition("attachment; filename=a.csv", "x")).toBe("a.csv");
    expect(filenameFromDisposition(null, "x.csv")).toBe("x.csv");
  });
});

describe("apiDownload", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("un 400 diventa un errore con il messaggio del backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Troppe righe" }), { status: 400 })),
    );
    await expect(apiDownload("/api/catasto/export", "Export non riuscito", "f.csv")).rejects.toThrow("Troppe righe");
  });

  it("un 200 restituisce il file e il suo nome", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("a,b", { status: 200, headers: { "Content-Disposition": 'attachment; filename="f.csv"' } }),
      ),
    );
    const { blob, filename } = await apiDownload("/api/catasto/export", "x", "y.csv");
    expect(filename).toBe("f.csv");
    expect(await blob.text()).toBe("a,b");
  });
});
