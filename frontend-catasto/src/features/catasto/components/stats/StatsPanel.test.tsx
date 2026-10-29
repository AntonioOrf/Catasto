// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { emptyGroup, type CatastoStats, type MetricSummary } from "@catasto/shared";
import { renderWithProviders } from "../../../../test/render";
import { EMPTY_SIMPLE_FILTERS, type SearchParams } from "../../lib/simple-filters";
import { distributionItems } from "./chart-items";
import { memberBars } from "./stats-bars";
import { statsMessages } from "./StatsPanel.messages";
import { translate } from "../../../../i18n";

const api = vi.hoisted(() => ({ fetchStats: vi.fn() }));
vi.mock("../../../../api/catastoService", () => api);

const { default: StatsPanel } = await import("./StatsPanel");

const metric = (over: Partial<MetricSummary> = {}): MetricSummary => ({
  presenti: 9, assenti: 1, somma: 16630, media: 1847.78, mediana: 450, q1: 120, q3: 1000, min: 0, max: 9000, ...over,
});
const empty = { voci: [], altro: 0, assenti: 0 };
const stats: CatastoStats = {
  fuochi: 10,
  parenti: 20,
  economia: { fortune: metric(), credito: metric({ presenti: 0, assenti: 10, somma: null, media: null, mediana: null, q1: null, q3: null, min: null, max: null }), credito_m: metric(), imponibile: metric(), deduzioni: metric() },
  mestieri: { voci: [{ label: "Lanaiolo", n: 3 }], altro: 2, assenti: 5 },
  quartieri: empty,
  serie: empty,
  membri: [{ membri: 0, fuochi: 1 }, { membri: 1, fuochi: 9 }],
  eta: { fasce: [{ da: 0, sesso: "Maschio", n: 3 }, { da: 90, sesso: "Femmina", n: 1 }, { da: 30, sesso: null, n: 2 }], assenti: 1 },
  statoCivile: empty,
  fasceImponibile: { fasce: [0, 1, 51, 201, 501, 1001].map((da) => ({ da, n: 1 })), assenti: 4 },
};
const search: SearchParams = { ...EMPTY_SIMPLE_FILTERS, sortBy: "nome", sortOrder: "ASC", advancedMode: false, ast: emptyGroup() };
const t = (key: keyof (typeof statsMessages)["it"], vars?: Record<string, string | number>) => translate(statsMessages, key, vars, "it");

describe("barre delle statistiche", () => {
  it("Altro e Non indicato in coda e marcati come voci di servizio", () => {
    expect(distributionItems(stats.mestieri, { other: t("other"), notStated: t("notStated") })).toEqual([
      { key: "v:Lanaiolo", label: "Lanaiolo", n: 3 },
      { key: "altro", label: "Altro", n: 2, other: true },
      { key: "na", label: "Non indicato", n: 5, missing: true },
    ]);
  });

  it("i fuochi con molti membri si raggruppano", () => {
    const bars = memberBars([{ membri: 1, fuochi: 2 }, { membri: 12, fuochi: 3 }, { membri: 20, fuochi: 1 }], t);
    expect(bars).toEqual([
      { key: "m1", label: "1 membro", n: 2 },
      { key: "over", label: "12 o più", n: 4 },
    ]);
  });
});

describe("StatsPanel", () => {
  beforeEach(() => { localStorage.clear(); api.fetchStats.mockReset(); api.fetchStats.mockResolvedValue(stats); });

  it("mostra totali, tabella economica con i valori non calcolabili e i grafici con tabella dei dati", async () => {
    renderWithProviders(<StatsPanel search={search} />);
    expect(await screen.findByText("Statistiche della ricerca")).toBeTruthy();
    expect(api.fetchStats.mock.calls[0][0]).toBe(search);

    const economy = screen.getByRole("table", { name: /Dati economici in fiorini/ });
    const credito = within(economy).getByRole("row", { name: /^Credito 0 10/ });
    expect(within(credito).getAllByText("non calcolabile: nessun valore presente")).toHaveLength(7);

    const mestieri = screen.getByRole("figure", { name: "Fuochi per mestiere" });
    expect(within(mestieri).getByRole("table").textContent).toContain("Non indicato");
    // Barre o torta per ogni grafico, ricordato sul dispositivo.
    expect(within(mestieri).queryByRole("img")).toBeNull();
    fireEvent.click(within(mestieri).getByRole("button", { name: "Torta" }));
    expect(within(mestieri).getByRole("img").getAttribute("aria-label")).toContain("Lanaiolo 30%");
    expect(JSON.parse(localStorage.getItem("catasto.statistiche.grafici.v1")!)).toEqual({ mestieri: "pie" });

    // Piramide: il sesso assente è riportato a parte, non perso.
    expect(screen.getByText(/Sesso non indicato o altro: 2/)).toBeTruthy();
    expect(screen.getByText(/Età non indicata: 1/)).toBeTruthy();
  });

  it("un errore del server compare con il pulsante Riprova", async () => {
    api.fetchStats.mockRejectedValue(new Error("Troppe richieste di statistiche."));
    renderWithProviders(<StatsPanel search={search} />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Troppe richieste");
    expect(screen.getByRole("button", { name: "Riprova" })).toBeTruthy();
  });

  it("con un backend senza l'endpoint (404) spiega che la funzione non è ancora disponibile", async () => {
    const { ApiError } = await import("../../../../api/client");
    api.fetchStats.mockRejectedValue(new ApiError("Risorsa non trovata", 404));
    renderWithProviders(<StatsPanel search={search} />);
    expect(await screen.findByText("Statistiche non ancora disponibili")).toBeTruthy();
    expect(screen.queryByText("Risorsa non trovata")).toBeNull();
  });
});
