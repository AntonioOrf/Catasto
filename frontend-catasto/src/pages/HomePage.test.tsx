// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { useFilters } from "../context/FilterContext";

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
// Il pannello vero è pesante: qui basta un pulsante che imposti il mestiere.
vi.mock("../features/catasto/components/FilterPanel", () => ({
  default: function FilterPanelStub() {
    const { setFilter } = useFilters();
    return (
      <button type="button" onClick={() => setFilter("filterMestiere", "3")}>
        imposta mestiere
      </button>
    );
  },
}));

const { FilterProvider } = await import("../context/FilterContext");
const { TourProvider } = await import("../features/tour/TourProvider");
const { CompareProvider } = await import("../features/compare/CompareProvider");
const { default: HomePage } = await import("./HomePage");

describe("Consultazione: link alla mappa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/");
    api.fetchFuochi.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } });
    api.fetchFilterOptions.mockResolvedValue({});
  });

  const renderPage = () =>
    renderWithProviders(
      <FilterProvider>
        <TourProvider>
          <CompareProvider>
            <HomePage />
          </CompareProvider>
        </TourProvider>
      </FilterProvider>,
    );

  it("senza filtri apre la mappa di tutto il catasto; con un filtro lo porta con sé", async () => {
    renderPage();
    const link = await screen.findByRole("link", { name: "Vedi sulla mappa" });
    expect(link.getAttribute("href")).toBe("/mappa");

    fireEvent.click(screen.getByRole("button", { name: "imposta mestiere" }));
    // La ricerca arriva con un breve ritardo (debounce).
    await vi.waitFor(() => expect(screen.getByRole("link", { name: "Vedi sulla mappa" }).getAttribute("href")).toBe("/mappa?mestiere=3"));
  });
});
