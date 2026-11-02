import { describe, expect, it } from "vitest";
import type { Segnalazione } from "@catasto/shared";
import { ModerazionePage } from "./moderazione.page.js";

const localizzazione: Segnalazione = {
  id: 8,
  id_fuoco: null,
  id_registrazione: 12,
  nome_luogo: "Contado › S. Martino a <Gangalandi>",
  tipo: "localizzazione",
  campo: null,
  valore_attuale: "43.770100, 11.105200 (approssimata)",
  valore_proposto: "Ginestra Fiorentina",
  note: null,
  email: null,
  stato: "nuova",
  created_at: "2026-11-01T10:00:00Z",
};

describe("ModerazionePage: localizzazione", () => {
  it("mostra luogo, posizione attuale e proposta, con l'HTML escapato", () => {
    const html = ModerazionePage.conferma(localizzazione, "accettata", "tok", true);
    expect(html).toContain("Luogo</dt>");
    expect(html).toContain("S. Martino a &#60;Gangalandi&#62; (luogo 12)");
    expect(html).not.toContain("<dt>Fuoco</dt>");
    expect(html).toContain("Posizione attuale</dt><dd class=\"mono\">43.770100, 11.105200 (approssimata)");
    expect(html).toContain("Posizione proposta</dt><dd class=\"mono\">Ginestra Fiorentina");
  });

  it("spiega che accettare non cambia le coordinate", () => {
    expect(ModerazionePage.conferma(localizzazione, "accettata", "tok", true)).toContain("db:import-luoghi");
  });
});
