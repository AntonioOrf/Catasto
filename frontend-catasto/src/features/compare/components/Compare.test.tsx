// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { Fuoco } from "@catasto/shared";
import { renderWithProviders } from "../../../test/render";
import { COMPARE_STORAGE_KEY } from "../lib/compare-selection";

const fuoco = (id: number, nome: string, fortune: number | null): Fuoco =>
  ({ id, nome, fortune, credito: 0, credito_m: 0, imponibile: 0, deduzioni: 0, volume: "81", foglio: "1r", mestiere: "Notaio" }) as Fuoco;
const DB: Record<number, Fuoco> = {
  1: fuoco(1, "RUCELLAI GIOVANNI", 1000),
  5: fuoco(5, "MEDICI COSIMO", 9000),
  7: fuoco(7, "GUASCONI BIAGIO", null),
};

const api = vi.hoisted(() => ({ fetchFuochiByIds: vi.fn(), fetchParentiData: vi.fn(), downloadExport: vi.fn() }));
vi.mock("../../catasto/lib/download", () => ({ saveBlob: vi.fn() }));
vi.mock("../../../api/catastoService", () => api);
// Il visore scarica manifest IIIF: qui basta che non si apra.
vi.mock("../../catasto/components/ArchivioViewerModal", () => ({ default: () => null }));

const { CompareProvider } = await import("../CompareProvider");
const { default: CompareBar } = await import("./CompareBar");
const { default: CompareView } = await import("./CompareView");
const { default: CatastoRow } = await import("../../catasto/components/CatastoRow");

const App = ({ rows = [] as Fuoco[] }) => (
  <CompareProvider>
    <table>
      <tbody>
        {rows.map((row) => (
          <CatastoRow key={row.id} row={row} expanded={false} onRowClick={vi.fn()} loadingParenti={false} parentiData={[]} />
        ))}
      </tbody>
    </table>
    <CompareBar />
    <CompareView />
  </CompareProvider>
);

describe("confronto tra fuochi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchFuochiByIds.mockImplementation(async (ids: number[]) => ids.flatMap((id) => DB[id] ?? []));
    api.fetchParentiData.mockResolvedValue([]);
    window.history.replaceState(null, "", "/");
  });

  it("le caselle delle righe riempiono la barra; il confronto si apre da due fuochi", async () => {
    renderWithProviders(<App rows={[DB[1], DB[5]]} />);
    expect(screen.queryByRole("region", { name: "Fuochi selezionati" })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Seleziona RUCELLAI GIOVANNI" }));
    const bar = await screen.findByRole("region", { name: "Fuochi selezionati" });
    expect((within(bar).getByRole("button", { name: "Confronta affiancati" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "Seleziona MEDICI COSIMO" }));
    await waitFor(() => expect(within(bar).getByText("MEDICI COSIMO")).toBeTruthy());
    expect(JSON.parse(sessionStorage.getItem(COMPARE_STORAGE_KEY)!)).toEqual([1, 5]);

    fireEvent.click(within(bar).getByRole("button", { name: "Confronta affiancati" }));
    const dialog = await screen.findByRole("dialog", { name: "Confronto tra fuochi" });
    // Una colonna per fuoco, differenza dal primo in parole.
    expect(within(dialog).getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      "Dato",
      "RUCELLAI GIOVANNI",
      "MEDICI COSIMO",
    ]);
    expect(within(dialog).getByText(/▲ \+8000 fiorini rispetto al primo/)).toBeTruthy();
  });

  it("il link #confronta riapre il confronto e scarta gli id inesistenti", async () => {
    window.history.replaceState(null, "", "/#confronta=5,999,7&q=abc");
    renderWithProviders(<App />);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getAllByRole("columnheader")).toHaveLength(3));
    expect(within(dialog).getByText("MEDICI COSIMO")).toBeTruthy();
    // Valore assente: nessuna differenza inventata.
    expect(within(dialog).getAllByText("Non indicato").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByText(/Un fuoco del link non esiste/).length).toBeGreaterThan(0));
    // Il resto del fragment resta per la ricerca condivisa.
    expect(window.location.hash).toBe("#q=abc");
  });

  it("selezione fino a 500; il confronto affiancato solo da 2 a 5 fuochi", async () => {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([11, 12, 13, 14, 15]));
    api.fetchFuochiByIds.mockImplementation(async (ids: number[]) => ids.map((id) => fuoco(id, `F${id}`, 1)));
    renderWithProviders(<App rows={[DB[1]]} />);
    const bar = await screen.findByRole("region", { name: "Fuochi selezionati" });
    expect((within(bar).getByRole("button", { name: "Confronta affiancati" }) as HTMLButtonElement).disabled).toBe(false);
    const box = screen.getByRole("checkbox", { name: "Seleziona RUCELLAI GIOVANNI" }) as HTMLInputElement;
    expect(box.disabled).toBe(false);
    fireEvent.click(box);
    await waitFor(() => expect(within(bar).getByText("6 fuochi selezionati")).toBeTruthy());
    // Tre nomi scritti, gli altri contati.
    expect(within(bar).getByText("e altri 3")).toBeTruthy();
    expect((within(bar).getByRole("button", { name: "Confronta affiancati" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("i selezionati vanno in una raccolta e si esportano con il filtro ids", async () => {
    localStorage.clear();
    api.downloadExport.mockResolvedValue({ blob: new Blob(["x"]), filename: "catasto1427-fuochi.csv" });
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([1, 5]));
    renderWithProviders(<App />);
    const bar = await screen.findByRole("region", { name: "Fuochi selezionati" });
    fireEvent.click(within(bar).getByRole("button", { name: "Aggiungi a una raccolta" }));
    fireEvent.change(within(bar).getByLabelText("Nuova raccolta"), { target: { value: "Medici e Rucellai" } });
    fireEvent.click(within(bar).getByRole("button", { name: "Aggiungi" }));
    const { loadCollections } = await import("../../banco/collections");
    expect(loadCollections()).toMatchObject([{ nome: "Medici e Rucellai", ids: [1, 5] }]);

    fireEvent.click(within(bar).getByRole("button", { name: "Esporta i selezionati" }));
    await waitFor(() => expect(api.downloadExport).toHaveBeenCalledTimes(1));
    expect(api.downloadExport.mock.calls[0][0]).toMatchObject({ ids: "1,5", advancedMode: false });
    await waitFor(() => expect(screen.getAllByText(/Scaricato catasto1427-fuochi.csv/).length).toBeGreaterThan(0));
  });

  it("Esc chiude la vista, Svuota toglie tutto", async () => {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([1, 5]));
    renderWithProviders(<App />);
    const bar = await screen.findByRole("region", { name: "Fuochi selezionati" });
    fireEvent.click(within(bar).getByRole("button", { name: "Confronta affiancati" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(within(bar).getByRole("button", { name: "Deseleziona" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Fuochi selezionati" })).toBeNull());
  });

  it("senza l'endpoint (404) il confronto usa i dati delle righe scelte", async () => {
    const { ApiError } = await import("../../../api/client");
    api.fetchFuochiByIds.mockRejectedValue(new ApiError("Risorsa non trovata", 404));
    renderWithProviders(<App rows={[DB[1], DB[5]]} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleziona RUCELLAI GIOVANNI" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleziona MEDICI COSIMO" }));
    const bar = await screen.findByRole("region", { name: "Fuochi selezionati" });
    expect(within(bar).getByText("MEDICI COSIMO")).toBeTruthy();
    fireEvent.click(within(bar).getByRole("button", { name: "Confronta affiancati" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(within(dialog).getAllByRole("columnheader")).toHaveLength(3);
  });
});
