// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import type { MappaLuoghi } from "@catasto/shared";
import type { QueryGroup } from "@catasto/shared";
import { encodeAst } from "../features/catasto/lib/query-share";
import { renderWithProviders } from "../test/render";
import { TourProvider } from "../features/tour/TourProvider";

// Leaflet ha bisogno di un browser vero: qui basta sapere quali luoghi riceve.
const ricevuti = vi.hoisted(() => ({ ids: [] as number[], centraSu: null as unknown, selezionato: null as number | null }));
vi.mock("../features/mappa/MappaLeaflet", () => ({
  default: ({ luoghi, centraSu, selezionato }: { luoghi: { id: number }[]; centraSu?: unknown; selezionato: number | null }) => {
    ricevuti.ids = luoghi.map((l) => l.id);
    ricevuti.centraSu = centraSu ?? null;
    ricevuti.selezionato = selezionato;
    return <div data-testid="mappa" />;
  },
}));

// L'URL della pagina si decide nel test.
const url = vi.hoisted(() => ({ search: "", hash: "" }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useLocation: () => ({ pathname: "/mappa", search: url.search, hash: url.hash, state: null, key: "k" }),
}));

const DATI: MappaLuoghi = {
  fuochi: 120,
  disponibile: true,
  non_localizzati: { fuochi: 20, luoghi: 2 },
  luoghi: [
    { id: 1, lat: 43.5, lng: 11.1, certezza: "sicura", nome: "Pop. S. Maria a Marcialla", piviere: "Piv. di San Piero in Bossolo", serie: "Contado Fiorentino", nome_moderno: "MARCIALLA", fuochi: 60, imponibile_medio: 120, quota_mestiere: 0.5, quota_migrazione: 0.1, ampiezza_media: 4.2 },
    { id: 2, lat: 43.6, lng: 11.2, certezza: "approssimata", nome: "Pop. S. Donato a Luciana", piviere: "Piv. di Campoli", serie: "Contado Fiorentino", nome_moderno: "LUCIANA", fuochi: 30, imponibile_medio: 80, quota_mestiere: 0.2, quota_migrazione: 0, ampiezza_media: 3.1 },
    { id: 3, lat: 43.7, lng: 11.3, certezza: "solo_piviere", nome: "Pop. S. Lucia a Nulla", piviere: "Piv. di Campoli", serie: "Contado Fiorentino", nome_moderno: null, fuochi: 10, imponibile_medio: null, quota_mestiere: 0, quota_migrazione: 0, ampiezza_media: 2 },
  ],
};

vi.mock("../hooks/useMappaLuoghi", () => ({
  useMappaLuoghi: () => ({ dati: DATI, loading: false, error: null, unavailable: false, retry: () => {} }),
}));

const { default: MappaPage } = await import("./MappaPage");

const renderPagina = () =>
  renderWithProviders(
    <TourProvider>
      <MappaPage />
    </TourProvider>,
  );

describe("pagina della mappa", () => {
  beforeEach(() => {
    ricevuti.ids = [];
    ricevuti.centraSu = null;
    ricevuti.selezionato = null;
    url.search = "";
    url.hash = "";
  });

  it("mostra i luoghi, la quota in mappa e i non localizzati", () => {
    renderPagina();
    expect(ricevuti.ids).toEqual([1, 2, 3]);
    expect(screen.getByText("83% dei fuochi in mappa")).toBeTruthy();
    expect(screen.getByText(/Non in mappa: 20 fuochi in 2 luoghi/)).toBeTruthy();
  });

  it("filtra per certezza e per numero minimo di fuochi", () => {
    renderPagina();
    fireEvent.click(screen.getByLabelText(/Approssimata/));
    expect(ricevuti.ids).toEqual([1, 3]);
    fireEvent.change(screen.getByLabelText("Fuochi minimi per luogo"), { target: { value: "20" } });
    expect(ricevuti.ids).toEqual([1]);
  });

  it("dall'elenco si sceglie un luogo e se ne vedono i dati", () => {
    renderPagina();
    fireEvent.click(screen.getByRole("button", { name: /Pop. S. Maria a Marcialla/ }));
    expect(screen.getByText("MARCIALLA")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });

  it("senza filtri non mostra il riquadro dei filtri attivi", () => {
    renderPagina();
    expect(screen.queryByText("Ricerca avanzata attiva")).toBeNull();
    expect(screen.queryByText("Mostra tutti i fuochi")).toBeNull();
  });

  it("con una ricerca avanzata mostra il riquadro e il link per toglierla", () => {
    const ast: QueryGroup = {
      kind: "group",
      op: "AND",
      children: [{ kind: "condition", field: "nome", operator: "contains", value: "Rossi" }],
    };
    url.hash = `#q=${encodeAst(ast)}`;
    renderPagina();
    expect(screen.getByText("Ricerca avanzata attiva")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mostra tutti i fuochi" }).getAttribute("href")).toBe("/mappa");
  });

  it("con ?luogo= apre la scheda e centra la mappa sul luogo", () => {
    url.search = "?luogo=2";
    renderPagina();
    expect(ricevuti.selezionato).toBe(2);
    expect(ricevuti.centraSu).toEqual({ lat: 43.6, lng: 11.2 });
    expect(screen.getByText("LUCIANA")).toBeTruthy();
    expect(screen.queryByText("Il luogo richiesto non è localizzato sulla mappa")).toBeNull();
  });

  it("con ?luogo= lascia all'utente la scelta di un altro luogo", () => {
    url.search = "?luogo=2";
    renderPagina();
    fireEvent.click(screen.getByRole("button", { name: /Pop. S. Maria a Marcialla/ }));
    expect(ricevuti.selezionato).toBe(1);
  });

  it("con ?luogo= di un luogo non in mappa mostra una nota", () => {
    url.search = "?luogo=999";
    renderPagina();
    expect(screen.getByText("Il luogo richiesto non è localizzato sulla mappa")).toBeTruthy();
    expect(ricevuti.selezionato).toBeNull();
  });

  it("dalla scheda si apre la segnalazione di una localizzazione errata", () => {
    renderPagina();
    expect(screen.queryByRole("button", { name: "Segnala una localizzazione errata" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Pop. S. Maria a Marcialla/ }));
    fireEvent.click(screen.getByRole("button", { name: "Segnala una localizzazione errata" }));
    expect(screen.getByRole("dialog", { name: "Segnala una localizzazione errata" })).toBeTruthy();
    expect(screen.getByText("43.5000, 11.1000")).toBeTruthy();
  });
});
