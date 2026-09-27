import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fuoco } from "@catasto/shared";

const query = vi.fn();
vi.mock("../config/db.js", () => ({ default: { query } }));

const { FuocoModel } = await import("./fuoco.model.js");

const fuoco = (id: number, segnatura_portata: string | null) => ({ id, segnatura_portata }) as Fuoco;

describe("FuocoModel.attachCodiciPortata", () => {
  beforeEach(() => query.mockReset());

  it("collega la portata al volume digitalizzato del fondo Catasto", async () => {
    query.mockResolvedValue([[{ volume: 81, codice_archivio: "2722400" }]]);
    const rows = [
      fuoco(1, "ASFi, Catasto 81, c. 245r"),
      fuoco(2, "ASFi, Catasto 999, c. 1"),
      fuoco(3, "ASFi, Estimo 12, c. 3r"),
      fuoco(4, null),
    ];

    await FuocoModel.attachCodiciPortata(rows);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual([[81, 999]]);
    expect(rows.map((r) => r.codice_archivio_portata)).toEqual(["2722400", null, undefined, undefined]);
  });

  it("non interroga il DB se nessun fuoco ha una portata con volume", async () => {
    const rows = [fuoco(1, null), fuoco(2, "Carte Strozziane I, 5")];
    await FuocoModel.attachCodiciPortata(rows);
    expect(query).not.toHaveBeenCalled();
  });
});
