// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { emptyGroup } from "@catasto/shared";
import { renderWithProviders } from "../../../test/render";
import { EMPTY_SIMPLE_FILTERS, type SearchParams } from "../lib/simple-filters";

const api = vi.hoisted(() => ({ downloadExport: vi.fn() }));
vi.mock("../../../api/catastoService", () => api);
const download = vi.hoisted(() => ({ saveBlob: vi.fn() }));
vi.mock("../lib/download", () => download);

const { default: ExportMenu } = await import("./ExportMenu");

const search: SearchParams = {
  ...EMPTY_SIMPLE_FILTERS,
  filterMestiere: "3",
  sortBy: "fortune",
  sortOrder: "DESC",
  advancedMode: false,
  ast: emptyGroup(),
};

const open = () => fireEvent.click(screen.getByRole("button", { name: "Esporta" }));

describe("ExportMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.downloadExport.mockImplementation(async (_s, req) => ({
      blob: new Blob(["x"]),
      filename: req.parenti ? "catasto1427-parenti.csv" : "catasto1427-fuochi.csv",
    }));
  });

  it("il pannello si apre dal pulsante e si chiude con Esc", () => {
    renderWithProviders(<ExportMenu search={search} totalRecords={120} />);
    const button = screen.getByRole("button", { name: "Esporta" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    open();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/Tutte le pagine della ricerca \(120 fuochi\)/)).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("CSV con i parenti scarica due file, col punto e virgola in italiano", async () => {
    renderWithProviders(<ExportMenu search={search} totalRecords={120} />);
    open();
    fireEvent.click(screen.getByRole("checkbox", { name: /Includi i parenti/ }));
    fireEvent.click(screen.getByRole("button", { name: "Scarica" }));

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalledTimes(2));
    expect(api.downloadExport.mock.calls.map((c) => c[1])).toEqual([
      { format: "csv", parenti: false, sep: "semicolon" },
      { format: "csv", parenti: true, sep: "semicolon" },
    ]);
    expect(api.downloadExport.mock.calls[0][0]).toBe(search);
    expect(screen.getByRole("status").textContent).toContain("catasto1427-parenti.csv");
  });

  it("XLSX con i parenti è un solo file", async () => {
    renderWithProviders(<ExportMenu search={search} totalRecords={5} />);
    open();
    fireEvent.click(screen.getByRole("radio", { name: /Excel/ }));
    expect(screen.queryByLabelText("Separatore delle colonne")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /Includi i parenti/ }));
    fireEvent.click(screen.getByRole("button", { name: "Scarica" }));
    await waitFor(() => expect(download.saveBlob).toHaveBeenCalledTimes(1));
    expect(api.downloadExport.mock.calls[0][1]).toMatchObject({ format: "xlsx", parenti: true });
  });

  it("oltre il tetto mostra il messaggio del server", async () => {
    api.downloadExport.mockRejectedValue(new Error("La ricerca restituisce 70000 fuochi: l'export è limitato a 50000."));
    renderWithProviders(<ExportMenu search={search} totalRecords={70000} />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "Scarica" }));
    expect((await screen.findByRole("alert")).textContent).toContain("limitato a 50000");
    expect(download.saveBlob).not.toHaveBeenCalled();
  });

  it("senza risultati il download è disabilitato", () => {
    renderWithProviders(<ExportMenu search={search} totalRecords={0} />);
    open();
    expect((screen.getByRole("button", { name: "Scarica" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
