// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import GlossaryTerm from "./GlossaryTerm";
import { renderWithProviders } from "../../test/render";

describe("GlossaryTerm", () => {
  it("la definizione è la descrizione del pulsante anche a riquadro chiuso", () => {
    renderWithProviders(<GlossaryTerm id="imponibile" />);
    const button = screen.getByRole("button", { name: "Che cos'è: Imponibile?" });
    const description = document.getElementById(button.getAttribute("aria-describedby")!);
    expect(description?.textContent).toBe("Base tassabile risultante.");
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("si apre al focus, porta al glossario e si chiude con Esc ridando il focus", () => {
    renderWithProviders(<GlossaryTerm id="portata" />);
    const button = screen.getByRole("button", { name: /Portata/ });
    fireEvent.focus(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const link = screen.getByRole("link", { name: "Approfondisci nel glossario" });
    expect(link.getAttribute("href")).toBe("/glossario#termine-portata");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("il tocco apre e richiude, senza propagare il clic alla riga", () => {
    let rowClicks = 0;
    renderWithProviders(
      <div onClick={() => rowClicks++}>
        <GlossaryTerm id="fuoco" />
      </div>,
    );
    const button = screen.getByRole("button", { name: /Fuoco/ });
    fireEvent.click(button);
    expect(screen.getByText("Nucleo familiare censito: l'unità del catasto, intestata al capofamiglia.", { selector: "p" })).toBeTruthy();
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(rowClicks).toBe(0);
  });

  it("una voce inesistente non mostra nulla", () => {
    const { container } = renderWithProviders(<GlossaryTerm id="inesistente" />);
    expect(container.textContent).toBe("");
  });
});
