// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import type { MappaLuoghi } from "@catasto/shared";
import { renderWithProviders } from "../test/render";
import { TourProvider } from "../features/tour/TourProvider";

// Leaflet ha bisogno di un browser vero: qui basta sapere quali luoghi riceve.
const ricevuti = vi.hoisted(() => ({ ids: [] as number[] }));
vi.mock("../features/mappa/MappaLeaflet", () => ({
  default: ({ luoghi }: { luoghi: { id: number }[] }) => {
    ricevuti.ids = luoghi.map((l) => l.id);
    return <div data-testid="mappa" />;
  },
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
});
