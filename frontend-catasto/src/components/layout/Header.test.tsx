// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../../i18n";
import { TourProvider } from "../../features/tour/TourProvider";
import Header from "./Header";

const renderAt = (path: string) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <TourProvider>
          <Header />
        </TourProvider>
      </MemoryRouter>
    </LanguageProvider>,
  );

describe("Header", () => {
  it("la voce «Mappa» segue «Banco di lavoro» e porta a /mappa", () => {
    renderAt("/");
    const links = screen.getAllByRole("link", { name: /Consultazione|Banco di lavoro|Mappa/ }).map((a) => a.textContent);
    expect(links.slice(0, 3)).toEqual(["Consultazione", "Banco di lavoro", "Mappa"]);
    expect(screen.getAllByRole("link", { name: "Mappa" })[0].getAttribute("href")).toBe("/mappa");
  });

  it("su /mappa la voce è attiva e le altre no", () => {
    renderAt("/mappa");
    // Barra e menu del telefono usano le stesse sezioni: ogni voce compare due volte.
    for (const link of screen.getAllByRole("link", { name: "Mappa" })) expect(link.getAttribute("aria-current")).toBe("page");
    for (const link of screen.getAllByRole("link", { name: "Banco di lavoro" })) expect(link.getAttribute("aria-current")).toBeNull();
  });
});
