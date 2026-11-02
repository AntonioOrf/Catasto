import "./env.js";
import { afterAll, describe, expect, it } from "vitest";
import pool from "../../src/config/db.js";
import { SegnalazioneService } from "../../src/services/segnalazione.service.js";

afterAll(() => pool.end());

describe("segnalazioni di localizzazione su MySQL", () => {
  it("salvano il luogo e la posizione attuale, e la moderazione le rilegge col nome del luogo", async () => {
    const [[luogo]]: any = await pool.query(
      "SELECT f.id_registrazione AS id FROM fuochi f WHERE f.id_registrazione IS NOT NULL LIMIT 1",
    );
    await pool.query(
      `INSERT INTO luoghi_geo (id_registrazione, lat, lng, certezza, nome_moderno, revisionato)
       VALUES (?, 43.6, 11.3, 'approssimata', 'Prova', 0)
       ON DUPLICATE KEY UPDATE lat = 43.6, lng = 11.3, certezza = 'approssimata', nome_moderno = 'Prova'`,
      [luogo.id],
    );

    const id = await SegnalazioneService.create(
      {
        id_fuoco: null,
        id_registrazione: Number(luogo.id),
        tipo: "localizzazione",
        valore_proposto: "Altrove",
        note: "Prova di integrazione",
      },
      undefined,
    );
    expect(id).toEqual(expect.any(Number));

    const salvata = await SegnalazioneService.findById(id!);
    expect(salvata).toMatchObject({
      id_fuoco: null,
      id_registrazione: Number(luogo.id),
      tipo: "localizzazione",
      valore_attuale: "43.600000, 11.300000 (approssimata; Prova)",
      valore_proposto: "Altrove",
    });
    expect(salvata.nome_luogo).toEqual(expect.any(String));

    // Accettare non tocca le coordinate: la correzione passa da db:import-luoghi.
    await SegnalazioneService.updateStato(id!, "accettata");
    const [[geo]]: any = await pool.query("SELECT lat, lng FROM luoghi_geo WHERE id_registrazione = ?", [luogo.id]);
    expect([Number(geo.lat), Number(geo.lng)]).toEqual([43.6, 11.3]);
  });

  it("rifiutano un luogo inesistente", async () => {
    await expect(
      SegnalazioneService.create(
        { id_fuoco: null, id_registrazione: 999_999_999, tipo: "localizzazione", note: "x" },
        undefined,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
