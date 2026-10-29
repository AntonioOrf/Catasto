import "./env.js";
import { afterAll, describe, expect, it } from "vitest";
import type { ApiResponse, Fuoco, QueryGroup } from "@catasto/shared";
import pool from "../../src/config/db.js";
import { CatastoService } from "../../src/services/catasto.service.js";
import { CommonModel } from "../../src/models/common.model.js";

const pagination = { page: 1, limit: 50, sort_by: "nome", order: "ASC" };

const search = async (filters: Record<string, unknown>, sort = pagination) =>
  (await CatastoService.searchFuochi(filters, sort, "table")) as ApiResponse<Fuoco[]>;

afterAll(() => pool.end());

describe("ricerca su MySQL", () => {
  it("senza filtri restituisce tutti i fuochi, ordinati per nome", async () => {
    const { data, pagination: p } = await search({});
    expect(p?.total).toBe(10);
    expect(data.map((f) => f.nome)).toEqual([...data.map((f) => f.nome)].sort());
  });

  it("le partizioni omonime del quartiere sono un'unica opzione", async () => {
    const filters = await CommonModel.getFilters();
    const sanGiovanni = filters.quartieri.find((q) => q.label === "San Giovanni");
    expect(String(sanGiovanni?.id).split(",").sort()).toEqual(["1", "2"]);

    const { data } = await search({ quartiere: sanGiovanni?.id });
    expect(data.map((f) => f.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("la ricerca avanzata conta le stesse righe della semplice", async () => {
    const ast: QueryGroup = {
      kind: "group",
      op: "AND",
      children: [{ kind: "condition", field: "fortune", operator: "gte", value: 1000 }],
    };
    const avanzata = (await CatastoService.queryFuochi(ast, pagination, "table")) as ApiResponse<Fuoco[]>;
    const semplice = await search({ fortune_min: 1000 });
    expect(avanzata.pagination?.total).toBe(3);
    expect(avanzata.data.map((f) => f.id)).toEqual(semplice.data.map((f) => f.id));
  });

  it("i valori assenti restano null", async () => {
    const { data } = await search({ q_persona: "Guasconi" });
    expect(data).toHaveLength(1);
    expect(data[0].fortune).toBeNull();
  });

  it("dopo l'invalidazione le opzioni dei filtri vengono rilette", async () => {
    await CommonModel.getFilters();
    await pool.query("INSERT INTO mestieri VALUES (99, 'Zz mestiere nuovo')");
    try {
      expect((await CommonModel.getFilters()).mestieri.some((m) => m.id === 99)).toBe(false);
      CommonModel.invalidateFilters();
      expect((await CommonModel.getFilters()).mestieri.some((m) => m.id === 99)).toBe(true);
    } finally {
      await pool.query("DELETE FROM mestieri WHERE id = 99");
      CommonModel.invalidateFilters();
    }
  });
});

describe("fuochi per id (confronto)", () => {
  it("restituisce i fuochi nell'ordine chiesto e omette gli inesistenti", async () => {
    const fuochi = await CatastoService.getFuochiByIds([5, 999, 1]);
    expect(fuochi.map((f) => f.id)).toEqual([5, 1]);
    expect(fuochi[0].nome).toBe("MEDICI COSIMO");
    expect(fuochi[0].quartiere).toBe("San Giovanni (I)");
  });
});
