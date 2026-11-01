// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import type { LuogoMappa } from "@catasto/shared";
import { renderWithProviders } from "../../../test/render";

const mutate = vi.hoisted(() => vi.fn());
const stato = vi.hoisted(() => ({ isSuccess: false, isError: false, isPending: false, error: null as unknown }));
vi.mock("../api/create-segnalazione", () => ({
  useCreateSegnalazione: () => ({ mutate, reset: vi.fn(), ...stato }),
}));

const { default: SegnalazioneLuogoModal } = await import("./SegnalazioneLuogoModal");

const LUOGO: LuogoMappa = {
  id: 7,
  lat: 43.70123,
  lng: 11.1,
  certezza: "approssimata",
  nome: "Pop. S. Donato a Luciana",
  piviere: "Piv. di Campoli",
  serie: "Contado Fiorentino",
  nome_moderno: null,
  fuochi: 30,
  imponibile_medio: null,
  quota_mestiere: 0,
  quota_migrazione: 0,
  ampiezza_media: 3,
};

const apri = (onClose = vi.fn()) =>
  renderWithProviders(<SegnalazioneLuogoModal isOpen onClose={onClose} luogo={LUOGO} certezzaLabel="Approssimata" />);
const scrivi = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const invia = () => fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione" }));

describe("SegnalazioneLuogoModal", () => {
  beforeEach(() => {
    mutate.mockClear();
    Object.assign(stato, { isSuccess: false, isError: false, isPending: false, error: null });
  });

  it("riepiloga il luogo con posizione a 4 decimali e certezza", () => {
    apri();
    expect(screen.getByRole("dialog", { name: "Segnala una localizzazione errata" })).toBeTruthy();
    expect(screen.getByText("Pop. S. Donato a Luciana")).toBeTruthy();
    expect(screen.getByText("Piv. di Campoli")).toBeTruthy();
    expect(screen.getByText("Contado Fiorentino")).toBeTruthy();
    expect(screen.getByText("43.7012, 11.1000")).toBeTruthy();
    expect(screen.getByText("Approssimata")).toBeTruthy();
  });

  it("non invia senza luogo, coordinate o note", () => {
    apri();
    invia();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/Indica dove si trova/);
  });

  it("blocca l'invio con coordinate non valide", () => {
    apri();
    scrivi(/Dove si trova/, "presso la Pesa");
    scrivi(/Coordinate/, "50, 11");
    invia();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText(/Coordinate non valide/)).toBeTruthy();
    expect(screen.getByLabelText(/Coordinate/).getAttribute("aria-invalid")).toBe("true");
  });

  it("invia il payload con testo, coordinate normalizzate, note ed email", () => {
    apri();
    scrivi(/Dove si trova/, "presso la Pesa");
    scrivi(/Coordinate/, "43.7701; 11.1052");
    scrivi(/Fonte o note/, "Carta Inghirami");
    scrivi(/Email/, "a@b.it");
    invia();
    expect(mutate).toHaveBeenCalledWith({
      id_fuoco: null,
      id_registrazione: 7,
      tipo: "localizzazione",
      valore_proposto: "presso la Pesa — 43.7701, 11.1052",
      note: "Carta Inghirami",
      email: "a@b.it",
      website: "",
    });
  });

  it("basta una nota: valore_proposto resta nullo", () => {
    apri();
    scrivi(/Fonte o note/, "Sta altrove");
    invia();
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ valore_proposto: null, note: "Sta altrove", email: null }));
  });

  it("rispetta i limiti di lunghezza dei campi", () => {
    apri();
    expect(screen.getByLabelText(/Dove si trova/).getAttribute("maxlength")).toBe("300");
    expect(screen.getByLabelText(/Fonte o note/).getAttribute("maxlength")).toBe("2000");
  });

  it("mostra la conferma dopo l'invio e l'errore se fallisce", () => {
    stato.isSuccess = true;
    const { unmount } = apri();
    expect(screen.getByText("Segnalazione inviata")).toBeTruthy();
    unmount();
    Object.assign(stato, { isSuccess: false, isError: true, error: new Error("x") });
    apri();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("chiude con Annulla", () => {
    const onClose = vi.fn();
    apri(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    expect(onClose).toHaveBeenCalled();
  });

  it.each(["43.7701, 11.1052", "  43.7701 ;11.1052 ", "43.7701 11.1052"])("accetta le coordinate %j", (v) => {
    apri();
    scrivi(/Coordinate/, v);
    invia();
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ valore_proposto: "43.7701, 11.1052" }));
  });

  it.each(["abc", "43.7", "43.7, 11.1, 5", "41.9, 11", "45.1, 11", "43, 8.9", "43, 13.1"])("rifiuta le coordinate %j", (v) => {
    apri();
    scrivi(/Fonte o note/, "nota");
    scrivi(/Coordinate/, v);
    invia();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("compone il valore: testo, coordinate a 6 decimali, solo testo, solo coordinate", () => {
    apri();
    scrivi(/Dove si trova/, " presso la Pesa ");
    scrivi(/Coordinate/, "43.12345678, 11.5");
    invia();
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ valore_proposto: "presso la Pesa — 43.123457, 11.5" }));
    scrivi(/Coordinate/, "");
    invia();
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ valore_proposto: "presso la Pesa" }));
    scrivi(/Dove si trova/, "  ");
    scrivi(/Coordinate/, "43.7, 11.1");
    invia();
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ valore_proposto: "43.7, 11.1" }));
  });
});
