// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { CatastoStats, Fuoco, MetricSummary } from "@catasto/shared";
import { renderWithProviders } from "../test/render";
import { COLLECTIONS_STORAGE_KEY } from "../features/banco/collections";
import { COLUMNS_STORAGE_KEY } from "../features/banco/columns";

const fuoco = (id: number, nome: string, imponibile: number, bocche: number, mestiere?: string): Fuoco =>
  ({ id, nome, imponibile, fortune: imponibile * 2, credito: 0, credito_m: 0, deduzioni: 0, volume: "81", foglio: "1r", mestiere, quartiere: "San Giovanni", popolo: "San Lorenzo", bocche, eta_media: 30 }) as Fuoco;
const ROWS = [fuoco(1, "RUCELLAI GIOVANNI", 300, 4, "Lanaiolo"), fuoco(5, "MEDICI COSIMO", 2000, 12, "Banchiere")];
const metric = (media: number, mediana: number): MetricSummary => ({ presenti: 2, assenti: 0, somma: 0, media, mediana, q1: 0, q3: 0, min: 0, max: 0 });
const STATS: CatastoStats = {
  fuochi: 2,
  parenti: 16,
  economia: { fortune: metric(2300, 2300), credito: metric(0, 0), credito_m: metric(0, 0), imponibile: metric(1150, 1150), deduzioni: metric(0, 0) },
  mestieri: { voci: [{ label: "Lanaiolo", n: 1 }, { label: "Banchiere", n: 1 }], altro: 0, assenti: 0 },
  quartieri: { voci: [], altro: 0, assenti: 0 },
  serie: { voci: [], altro: 0, assenti: 0 },
  membri: [{ membri: 4, fuochi: 1 }, { membri: 12, fuochi: 1 }],
  eta: { fasce: [], assenti: 0 },
  statoCivile: { voci: [], altro: 0, assenti: 0 },
  fasceImponibile: { fasce: [{ da: 0, n: 0 }, { da: 1, n: 0 }, { da: 51, n: 0 }, { da: 201, n: 1 }, { da: 501, n: 0 }, { da: 1001, n: 1 }], assenti: 0 },
};

const api = vi.hoisted(() => ({
  fetchFuochi: vi.fn(),
  fetchStats: vi.fn(),
  fetchFilterOptions: vi.fn(),
  fetchFuochiByIds: vi.fn(),
  fetchParentiData: vi.fn(),
  downloadExport: vi.fn(),
  fetchSuggest: vi.fn(),
}));
vi.mock("../api/catastoService", () => api);
vi.mock("../features/catasto/components/ArchivioViewerModal", () => ({ default: () => null }));

const { FilterProvider } = await import("../context/FilterContext");
const { TourProvider } = await import("../features/tour/TourProvider");
const { CompareProvider } = await import("../features/compare/CompareProvider");
const { default: BancoPage } = await import("./BancoPage");

const renderPage = () =>
  renderWithProviders(
    <FilterProvider>
      <TourProvider>
        <CompareProvider>
          <BancoPage />
        </CompareProvider>
      </TourProvider>
    </FilterProvider>,
  );

describe("Banco di lavoro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/banco");
    api.fetchFuochi.mockResolvedValue({ data: ROWS, pagination: { total: 2, page: 1, limit: 50, totalPages: 1 } });
    api.fetchStats.mockResolvedValue(STATS);
    api.fetchFilterOptions.mockResolvedValue({});
    api.fetchFuochiByIds.mockImplementation(async (ids: number[]) => ROWS.filter((r) => ids.includes(r.id)));
    api.fetchSuggest.mockImplementation(async (q: string) => {
      const data = ROWS.filter((r) => r.nome.toLowerCase().includes(q.toLowerCase()));
      return { data, total: data.length, mode: "testo" };
    });
  });

  it("chiede la vista banco con la query avanzata; colonne di partenza, media e mediana in fondo", async () => {
    renderPage();
    const table = await screen.findByRole("table", { name: /Risultati della query/ });
    await within(table).findByText("RUCELLAI GIOVANNI");
    const [search, view, page, limit] = api.fetchFuochi.mock.calls.at(-1)!;
    expect(view).toBe("banco");
    expect(search.advancedMode).toBe(true);
    expect([page, limit]).toEqual([1, 50]);

    const headers = within(table).getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toEqual(["Seleziona", "Capofamiglia", "Mestiere", "Quartiere » popolo", "Imponibile", "Fortune", "Bocche", "Campione"]);
    expect(within(table).getAllByText("San Giovanni » San Lorenzo", { selector: "td" })).toHaveLength(2);

    const footer = await within(table).findByRole("rowheader", { name: "mediana su 2 fuochi" });
    const cells = within(footer.closest("tr")!).getAllByRole("cell").map((td) => td.textContent);
    // Imponibile, fortune, bocche (mediana di 4 e 12 = 8).
    expect(cells.slice(2, 5)).toEqual(["1.150", "2.300", "8"]);
  });

  it("le colonne si accendono, si spostano e si ricordano; «ripristina» torna alla partenza", async () => {
    renderPage();
    const table = await screen.findByRole("table", { name: /Risultati della query/ });
    fireEvent.click(screen.getByRole("button", { name: "Colonne" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Età media" }));
    fireEvent.click(screen.getByRole("button", { name: "Sposta Bocche prima" }));
    const headers = within(table).getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toContain("Età media");
    expect(headers.indexOf("Bocche")).toBeLessThan(headers.indexOf("Fortune"));
    expect(JSON.parse(localStorage.getItem(COLUMNS_STORAGE_KEY)!).hidden).not.toContain("eta_media");

    fireEvent.click(screen.getByRole("button", { name: "ripristina" }));
    expect(within(table).getAllByRole("columnheader").map((th) => th.textContent)).not.toContain("Età media");
  });

  it("i grafici evidenziano la voce della riga attiva", async () => {
    renderPage();
    const row = (await screen.findByText("MEDICI COSIMO", { selector: "td" })).closest("tr")!;
    const charts = screen.getByRole("region", { name: "Grafici sui risultati" });
    await within(charts).findByRole("figure", { name: "Fuochi per numero di bocche" });
    fireEvent.mouseEnter(row);
    const active = within(charts).getAllByText("(contiene la riga attiva)");
    expect(active).toHaveLength(3);
    expect(active.map((el) => el.parentElement!.textContent)).toEqual([
      "oltre 1.000 (contiene la riga attiva)",
      "12 o più (contiene la riga attiva)",
      "Banchiere (contiene la riga attiva)",
    ]);
  });

  it("un link #raccolta apre i fuochi della raccolta e la salva sul dispositivo", async () => {
    window.history.replaceState(null, "", "/banco#raccolta=Grandi%20famiglie:5,1");
    renderPage();
    expect(await screen.findByText("Raccolta «Grandi famiglie» aperta dal link.")).toBeTruthy();
    await waitFor(() => expect(api.fetchFuochi.mock.calls.some(([s]) => s.ids === "5,1")).toBe(true));
    expect(JSON.parse(localStorage.getItem(COLLECTIONS_STORAGE_KEY)!)[0]).toMatchObject({ nome: "Grandi famiglie", ids: [5, 1] });
    expect(window.location.hash).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Torna alla query" }));
    await waitFor(() => expect(api.fetchFuochi.mock.calls.at(-1)![0].ids).toBeUndefined());
  });

  it("trova e aggiungi: Invio mette il fuoco nella selezione, Annulla lo toglie", async () => {
    renderPage();
    const finder = screen.getByRole("region", { name: "Trova e aggiungi fuochi" });
    const box = within(finder).getByRole("combobox", { name: "Cerca un fuoco" });
    fireEvent.change(box, { target: { value: "medici" } });
    await within(finder).findByRole("option", { name: "MEDICI COSIMO" });
    expect(api.fetchSuggest).toHaveBeenLastCalledWith("medici", expect.anything());

    fireEvent.keyDown(box, { key: "Enter" });
    expect(await within(finder).findByText("Aggiunto MEDICI COSIMO alla selezione.")).toBeTruthy();
    const row = (await screen.findByText("MEDICI COSIMO", { selector: "td" })).closest("tr")!;
    expect(within(row).getByRole("checkbox")).toHaveProperty("checked", true);
    expect(within(finder).getByRole("option", { name: "MEDICI COSIMO, Già dentro" })).toBeTruthy();

    fireEvent.keyDown(box, { key: "Enter" });
    expect(await within(finder).findByText("MEDICI COSIMO è già nella selezione.")).toBeTruthy();

    fireEvent.change(box, { target: { value: "" } });
    fireEvent.change(box, { target: { value: "medici" } });
    fireEvent.click(await within(finder).findByRole("option", { name: "MEDICI COSIMO, Già dentro" }));
    fireEvent.click(within(finder).getByRole("button", { name: "Annulla" }));
    expect(within(row).getByRole("checkbox")).toHaveProperty("checked", true);
  });

  it("una nuova raccolta diventa la destinazione; la casella della riga aggiunge e toglie; si rinomina", async () => {
    renderPage();
    const finder = screen.getByRole("region", { name: "Trova e aggiungi fuochi" });
    fireEvent.change(within(finder).getByRole("combobox", { name: "Destinazione" }), { target: { value: "new" } });
    const name = within(finder).getByRole("textbox", { name: "Nome della raccolta" });
    fireEvent.change(name, { target: { value: "Lanaioli" } });
    fireEvent.submit(name.closest("form")!);
    expect(await within(finder).findByText("Raccolta «Lanaioli» creata: i fuochi trovati ora vanno lì.")).toBeTruthy();

    const row = (await screen.findByText("RUCELLAI GIOVANNI", { selector: "td" })).closest("tr")!;
    const box = within(row).getByRole("checkbox", { name: "RUCELLAI GIOVANNI nella raccolta «Lanaioli»" });
    fireEvent.click(box);
    expect(JSON.parse(localStorage.getItem(COLLECTIONS_STORAGE_KEY)!)[0]).toMatchObject({ nome: "Lanaioli", ids: [1] });
    fireEvent.click(box);
    expect(JSON.parse(localStorage.getItem(COLLECTIONS_STORAGE_KEY)!)[0].ids).toEqual([]);

    fireEvent.click(within(finder).getByRole("button", { name: "Rinomina la raccolta Lanaioli" }));
    const rename = within(finder).getByRole("textbox", { name: "Nome della raccolta" });
    fireEvent.change(rename, { target: { value: "  " } });
    fireEvent.submit(rename.closest("form")!);
    expect(within(finder).getByRole("alert").textContent).toBe("Il nome non può essere vuoto.");
    fireEvent.change(rename, { target: { value: "Lanaioli di Oltrarno" } });
    fireEvent.submit(rename.closest("form")!);
    expect(await within(finder).findByText("Raccolta rinominata in «Lanaioli di Oltrarno».")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Raccolte" }).textContent).toContain("Lanaioli di Oltrarno");
  });

  it("incolla un elenco: conta nuovi, ripetuti e inesistenti prima di aggiungere", async () => {
    renderPage();
    const finder = screen.getByRole("region", { name: "Trova e aggiungi fuochi" });
    fireEvent.click(within(finder).getByRole("tab", { name: "Incolla un elenco" }));
    fireEvent.change(within(finder).getByRole("textbox", { name: /Numeri dei fuochi/ }), { target: { value: "1, 5\n999 1" } });
    expect(await within(finder).findByText("non esistono: 999")).toBeTruthy();
    expect(within(finder).getByText("2 da aggiungere")).toBeTruthy();
    expect(within(finder).getByText("1 ripetuto, contato una volta")).toBeTruthy();
    fireEvent.click(within(finder).getByRole("button", { name: "Aggiungi 2 fuochi" }));
    expect(await within(finder).findByText("Aggiunti 2 fuochi alla selezione.")).toBeTruthy();
    expect(within(finder).getByText("2 già dentro")).toBeTruthy();
  });
});
