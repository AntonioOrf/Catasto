import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModerazioneToken } from "./moderazione-token.js";

describe("ModerazioneToken", () => {
  beforeEach(() => vi.stubEnv("MODERAZIONE_SECRET", "segreto-di-test"));
  afterEach(() => vi.unstubAllEnvs());

  it("un token firmato si verifica con id e azione originali", () => {
    const token = ModerazioneToken.sign(7, "accettata");
    expect(ModerazioneToken.verify(token)).toEqual({ id: 7, azione: "accettata" });
  });

  it("modificare id o azione invalida la firma", () => {
    const token = ModerazioneToken.sign(7, "respinta");
    expect(() => ModerazioneToken.verify(token.replace(/^7\./, "8."))).toThrow(/non valido/);
    expect(() => ModerazioneToken.verify(token.replace("respinta", "accettata"))).toThrow(/non valido/);
  });

  it("un token firmato con un altro segreto non vale", () => {
    const token = ModerazioneToken.sign(7, "accettata");
    vi.stubEnv("MODERAZIONE_SECRET", "altro-segreto");
    expect(() => ModerazioneToken.verify(token)).toThrow(/non valido/);
  });

  it("un token scaduto viene rifiutato con 410", () => {
    const token = ModerazioneToken.sign(7, "accettata", Date.now() - 15 * 24 * 60 * 60 * 1000);
    expect(() => ModerazioneToken.verify(token)).toThrow(expect.objectContaining({ status: 410 }));
  });

  it("senza segreto configurato la moderazione via link è chiusa", () => {
    vi.stubEnv("MODERAZIONE_SECRET", "");
    expect(() => ModerazioneToken.verify("7.accettata.1.x")).toThrow(expect.objectContaining({ status: 403 }));
  });

  it("input malformati sono rifiutati", () => {
    for (const bad of [undefined, "", "abc", ["7.accettata.1.x"]]) {
      expect(() => ModerazioneToken.verify(bad)).toThrow(expect.objectContaining({ status: 400 }));
    }
  });
});
