import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificaService } from "./notifica.service.js";
import { ModerazioneToken } from "../utils/moderazione-token.js";

const input = {
  id_fuoco: 42,
  tipo: "segnatura" as const,
  valore_proposto: "ASFi, Catasto 81, c. 245r",
  note: "Verificata sul volume",
  email: "studioso@example.org",
};

describe("NotificaService.inviaSegnatura", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("senza FORMSUBMIT_EMAIL non invia nulla", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "");
    await NotificaService.inviaSegnatura(7, input);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invia la proposta a FormSubmit con origin e reply-to", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    vi.stubEnv("FORMSUBMIT_ORIGIN", "https://catasto.example.org");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.inviaSegnatura(7, input);

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
    await expect(NotificaService.inviaSegnatura(7, input)).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it("con MODERAZIONE_SECRET include i link firmati Accetta e Respingi", async () => {
    vi.stubEnv("FORMSUBMIT_EMAIL", "abc123");
    vi.stubEnv("FORMSUBMIT_ORIGIN", "https://catasto.example.org");
    vi.stubEnv("PUBLIC_API_URL", "https://api.example.org/");
    vi.stubEnv("MODERAZIONE_SECRET", "segreto-di-test");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "true" }) });

    await NotificaService.inviaSegnatura(7, input);

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

    await NotificaService.inviaSegnatura(7, input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Accetta).toBeUndefined();
    expect(body.Respingi).toBeUndefined();
  });
});
