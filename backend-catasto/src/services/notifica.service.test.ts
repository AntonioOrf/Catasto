import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: {} }));

const findFuocoRiepilogo = vi.fn();
vi.mock("../models/segnalazione.model.js", () => ({
  SegnalazioneModel: { findFuocoRiepilogo: (id: number) => findFuocoRiepilogo(id) },
}));

const { NotificaService } = await import("./notifica.service.js");
const { ModerazioneToken } = await import("../utils/moderazione-token.js");

const input = {
  id_fuoco: 42,
  tipo: "segnatura" as const,
  valore_proposto: "ASFi, Catasto 81, c. 245r",
  note: "Verificata sul volume",
  email: "studioso@example.org",
};

describe("NotificaService.invia", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockReset();
    findFuocoRiepilogo.mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("senza FORMSUBMIT_EMAIL non invia nulla", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "");
    await NotificaService.invia(7, input);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invia la proposta a FormSubmit con origin e reply-to", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    vi.stubEnv("FORMSUBMIT_ORIGIN", "https://catasto.example.org");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(7, input);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://formsubmit.co/ajax/abc123");
    expect(init.headers.Origin).toBe("https://catasto.example.org");
    const body = JSON.parse(init.body);
    expect(body["Segnatura proposta"]).toBe("ASFi, Catasto 81, c. 245r");
    expect(body._replyto).toBe("studioso@example.org");
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("un errore di rete viene loggato, non propagato", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    fetchMock.mockRejectedValue(new Error("timeout"));
    await expect(NotificaService.invia(7, input)).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it("con MODERAZIONE_SECRET include i link firmati Accetta e Respingi", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    vi.stubEnv("FORMSUBMIT_ORIGIN", "https://catasto.example.org");
    vi.stubEnv("PUBLIC_API_URL", "https://api.example.org/");
    vi.stubEnv("MODERAZIONE_SECRET", "segreto-di-test");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(7, input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const token = (url: string) => {
      expect(url.startsWith("https://api.example.org/api/segnalazioni/moderazione?t=")).toBe(true);
      return new URL(url).searchParams.get("t");
    };
    expect(ModerazioneToken.verify(token(body.Accetta))).toEqual({ id: 7, azione: "accettata" });
    expect(ModerazioneToken.verify(token(body.Respingi))).toEqual({ id: 7, azione: "respinta" });
  });

  it("senza MODERAZIONE_SECRET l'email non contiene link", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    vi.stubEnv("FORMSUBMIT_ORIGIN", "https://catasto.example.org");
    vi.stubEnv("MODERAZIONE_SECRET", "");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(7, input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Accetta).toBeUndefined();
    expect(body.Respingi).toBeUndefined();
  });

  it("inoltra anche i dati errati, con campo e valori", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(8, {
      id_fuoco: 42,
      tipo: "dato_errato",
      campo: "nome",
      valore_attuale: "ABRAM",
      valore_proposto: "ABRAMO",
      note: null,
      email: null,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Tipo).toBe("Dato errato");
    expect(body.Campo).toBe("Nome fuoco");
    expect(body["Valore attuale"]).toBe("ABRAM");
    expect(body["Valore proposto"]).toBe("ABRAMO");
    expect(body["Segnatura proposta"]).toBeUndefined();
    expect(body._replyto).toBeUndefined();
  });

  it("descrive il fuoco con nome, carta e località", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    findFuocoRiepilogo.mockResolvedValue({
      nome: "ABRAM GIOVANNI NUCCI",
      volume: "296",
      foglio: 86,
      serie: "Firenze 1429-1430 (Terzi Ufficiali)",
      quartiere: "Quart. di Santa Maria Novella",
      piviere: "Gonf. Lion bianco",
      popolo: null,
    });
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(7, input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Fuoco).toBe("ABRAM GIOVANNI NUCCI · Vol. 296, c. 86 (id 42)");
    expect(body["Località"]).toBe(
      "Firenze 1429-1430 (Terzi Ufficiali) › Quart. di Santa Maria Novella › Gonf. Lion bianco",
    );
  });

  it("se il DB non risponde invia comunque, con il solo id del fuoco", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    findFuocoRiepilogo.mockRejectedValue(new Error("db down"));
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.invia(7, input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Fuoco).toBe("id 42");
    expect(body["Località"]).toBeUndefined();
  });
});
