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

const api = vi.hoisted(() => ({ fetchFuochiByIds: vi.fn(), fetchParentiData: vi.fn() }));
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
    expect(screen.queryByRole("region", { name: "Confronto tra fuochi" })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Confronta RUCELLAI GIOVANNI" }));
    const bar = await screen.findByRole("region", { name: "Confronto tra fuochi" });
    expect((within(bar).getByRole("button", { name: "Confronta" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "Confronta MEDICI COSIMO" }));
    await waitFor(() => expect(within(bar).getByText("MEDICI COSIMO")).toBeTruthy());
    expect(JSON.parse(sessionStorage.getItem(COMPARE_STORAGE_KEY)!)).toEqual([1, 5]);

    fireEvent.click(within(bar).getByRole("button", { name: "Confronta" }));
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

  it("al massimo cinque fuochi: le altre caselle si disattivano", async () => {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([11, 12, 13, 14, 15]));
    api.fetchFuochiByIds.mockImplementation(async (ids: number[]) => ids.map((id) => fuoco(id, `F${id}`, 1)));
    renderWithProviders(<App rows={[DB[1]]} />);
    expect((screen.getByRole("checkbox", { name: "Confronta RUCELLAI GIOVANNI" }) as HTMLInputElement).disabled).toBe(true);
  });

  it("Esc chiude la vista, Svuota toglie tutto", async () => {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([1, 5]));
    renderWithProviders(<App />);
    const bar = await screen.findByRole("region", { name: "Confronto tra fuochi" });
    fireEvent.click(within(bar).getByRole("button", { name: "Confronta" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(within(bar).getByRole("button", { name: "Svuota" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Confronto tra fuochi" })).toBeNull());
  });
});
