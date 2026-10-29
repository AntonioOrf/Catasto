// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { Fuoco } from "@catasto/shared";
import CatastoRow, { CatastoMobileCard } from "./CatastoRow";
import { renderWithProviders } from "../../../test/render";

const fuoco: Fuoco = {
  id: 7,
  nome: "RUCELLAI GIOVANNI",
  imponibile: 800,
  credito: 200,
  credito_m: 50,
  fortune: 1000,
  deduzioni: 400,
  volume: "64",
  foglio: "12r",
  mestiere: "Lanaiolo",
  quartiere: "San Giovanni (I)",
  serie: "Città",
  codice_archivio: "2722300",
};

const renderRow = (expanded: boolean, onRowClick = vi.fn(), onViewArchivio = vi.fn()) =>
  renderWithProviders(
    <table>
      <tbody>
        <CatastoRow
          row={fuoco}
          expanded={expanded}
          onRowClick={onRowClick}
          loadingParenti={false}
          parentiData={[]}
          onViewArchivio={onViewArchivio}
        />
      </tbody>
    </table>,
  );

describe("CatastoRow", () => {
  it("la riga non è un elemento interattivo: si apre da un pulsante dedicato", () => {
    const onRowClick = vi.fn();
    const { container } = renderRow(false, onRowClick);
    const row = container.querySelector("tr")!;
    expect(row.hasAttribute("tabindex")).toBe(false);
    expect(row.hasAttribute("aria-expanded")).toBe(false);

    const toggle = screen.getByRole("button", { name: "Mostra la scheda di RUCELLAI GIOVANNI" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    // Una sola chiamata: il clic sul pulsante non risale alla riga.
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(7);
  });

  it("aperta, il pulsante controlla il dettaglio", () => {
    renderRow(true);
    const toggle = screen.getByRole("button", { name: "Chiudi la scheda di RUCELLAI GIOVANNI" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const details = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(details).not.toBeNull();
    expect(details!.textContent).toContain("Dettagli Economici");
  });

  it("il visore si apre senza espandere la riga", () => {
    const onRowClick = vi.fn();
    const onViewArchivio = vi.fn();
    renderRow(false, onRowClick, onViewArchivio);
    fireEvent.click(screen.getByRole("button", { name: /Campione: visualizza il manoscritto/ }));
    expect(onViewArchivio).toHaveBeenCalledWith(fuoco, "campione");
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("i valori assenti non diventano 0", () => {
    renderWithProviders(
      <table>
        <tbody>
          <CatastoRow row={{ ...fuoco, fortune: null as unknown as number }} expanded={false} onRowClick={vi.fn()} loadingParenti={false} parentiData={[]} />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Non indicato")).toBeTruthy();
  });
});

describe("CatastoMobileCard", () => {
  it("anche la card si apre dal pulsante, non da un contenitore focalizzabile", () => {
    const onRowClick = vi.fn();
    const { container } = renderWithProviders(
      <CatastoMobileCard row={fuoco} expanded={false} onRowClick={onRowClick} loadingParenti={false} parentiData={[]} />,
    );
    expect(container.querySelector("[tabindex]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostra la scheda di RUCELLAI GIOVANNI" }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});
