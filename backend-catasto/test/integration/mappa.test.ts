import "./env.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { ApiResponse, Fuoco } from "@catasto/shared";
import pool from "../../src/config/db.js";
import { CatastoService } from "../../src/services/catasto.service.js";
import { MappaService } from "../../src/services/mappa.service.js";

afterAll(() => pool.end());
beforeEach(() => MappaService.clearCache());

const totale = async (filters: Record<string, unknown>) =>
  ((await CatastoService.searchFuochi(filters, { page: 1, limit: 1, sort_by: "nome", order: "ASC" }, "table")) as ApiResponse<Fuoco[]>)
    .pagination?.total;

describe("mappa su MySQL", () => {
  it("luoghi in mappa e non localizzati sommano ai fuochi della tabella", async () => {
    const mappa = await MappaService.searchLuoghi({});
    expect(mappa.disponibile).toBe(true);
    const inMappa = mappa.luoghi.reduce((s, l) => s + l.fuochi, 0);
    expect(inMappa + mappa.non_localizzati.fuochi).toBe(mappa.fuochi);
    expect(mappa.fuochi).toBe(await totale({}));
  });

  it("un luogo con coordinate compare con i suoi aggregati e rispetta i filtri", async () => {
    const [[luogo]]: any = await pool.query(
      "SELECT f.id_registrazione AS id, COUNT(*) AS n FROM fuochi f GROUP BY f.id_registrazione ORDER BY n DESC LIMIT 1",
    );
    await pool.query(
      `INSERT INTO luoghi_geo (id_registrazione, lat, lng, certezza, nome_moderno, revisionato)
       VALUES (?, 43.5, 11.2, 'sicura', 'Prova', 1)
       ON DUPLICATE KEY UPDATE lat = 43.5, lng = 11.2, certezza = 'sicura', nome_moderno = 'Prova', revisionato = 1`,
      [luogo.id],
    );
    const mappa = await MappaService.searchLuoghi({});
    const trovato = mappa.luoghi.find((l) => l.id === Number(luogo.id));
    expect(trovato).toMatchObject({ lat: 43.5, lng: 11.2, certezza: "sicura", nome_moderno: "Prova", fuochi: Number(luogo.n) });
    expect(trovato!.quota_mestiere).toBeGreaterThanOrEqual(0);
    expect(trovato!.quota_mestiere).toBeLessThanOrEqual(1);

    const filtrata = await MappaService.searchLuoghi({ mestiere: "99999" });
    expect(filtrata).toMatchObject({ luoghi: [], fuochi: 0 });
  });
});
