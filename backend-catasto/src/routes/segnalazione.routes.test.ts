import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

vi.mock("../config/db.js", () => ({ default: {} }));

const service = vi.hoisted(() => ({
  findById: vi.fn(),
  updateStato: vi.fn(),
  isDaModerare: (stato: string) => stato === "nuova" || stato === "in_esame",
}));
vi.mock("../services/segnalazione.service.js", () => ({ SegnalazioneService: service }));

const { default: router } = await import("./segnalazione.routes.js");
const { ModerazioneToken } = await import("../utils/moderazione-token.js");

const segnalazione = (stato: string) => ({
  id: 7,
  id_fuoco: 42,
  nome_fuoco: "Rucellai <Giovanni>",
  tipo: "segnatura",
  valore_proposto: "ASFi, Catasto 81, c. 245r",
  note: null,
  email: null,
  stato,
});

describe("moderazione via link", () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    process.env.MODERAZIONE_SECRET = "segreto-di-test";
    const app = express();
    app.use("/api/segnalazioni", router);
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/segnalazioni/moderazione`;
  });
  afterAll(() => {
    server.close();
    delete process.env.MODERAZIONE_SECRET;
  });
  beforeEach(() => vi.clearAllMocks());

  it("il GET mostra la conferma senza cambiare lo stato", async () => {
    service.findById.mockResolvedValue(segnalazione("nuova"));
    const token = ModerazioneToken.sign(7, "accettata");
    const res = await fetch(`${base}?t=${token}`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain('<form method="post">');
    expect(html).toContain("Rucellai &#60;Giovanni&#62;");
    expect(service.updateStato).not.toHaveBeenCalled();
  });

  it("il GET su una segnalazione già decisa non offre il pulsante", async () => {
    service.findById.mockResolvedValue(segnalazione("accettata"));
    const res = await fetch(`${base}?t=${ModerazioneToken.sign(7, "respinta")}`);
    expect(await res.text()).not.toContain("<form");
  });

  it("il POST applica la decisione firmata nel token", async () => {
    service.updateStato.mockResolvedValue(undefined);
    service.findById.mockResolvedValue(segnalazione("respinta"));
    const res = await fetch(base, {
      method: "POST",
      body: new URLSearchParams({ t: ModerazioneToken.sign(7, "respinta") }),
    });

    expect(res.status).toBe(200);
    expect(service.updateStato).toHaveBeenCalledWith(7, "respinta", { soloSeDaModerare: true });
    expect(await res.text()).toContain("Segnatura respinta");
  });

  it("un token falso produce una pagina di errore HTML e nessuna scrittura", async () => {
    const res = await fetch(base, { method: "POST", body: new URLSearchParams({ t: "7.accettata.9999999999.xxx" }) });
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(service.updateStato).not.toHaveBeenCalled();
  });
});
