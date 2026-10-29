// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { useEffect } from "react";
import { renderWithProviders } from "../../test/render";
import { TourProvider } from "./TourProvider";
import { useTour } from "./tour-context";
import { TOUR_STORAGE_KEY } from "./tour-storage";

function Page() {
  const tour = useTour();
  useEffect(() => tour.startIfFirstVisit(), [tour]);
  return (
    <button type="button" onClick={tour.start}>
      Guida
    </button>
  );
}

const renderPage = () =>
  renderWithProviders(
    <TourProvider>
      <Page />
    </TourProvider>,
  );

describe("percorso guidato", () => {
  it("alla prima visita si apre e si percorre fino alla fine", () => {
    renderPage();
    expect(screen.getByRole("dialog", { name: "Cerca un fuoco" })).toBeTruthy();
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    expect(screen.getByText(/Passo 5 di 5/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ho capito" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe("visto");
  });

  it("saltato non ricompare, ma si riapre dal pulsante dal primo passo", () => {
    const { unmount } = renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: "Salta la guida" })[0]);
    unmount();

    renderPage();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Guida" }));
    expect(screen.getByRole("dialog", { name: "Cerca un fuoco" })).toBeTruthy();
  });

  it("Esc chiude e conta come visto", () => {
    renderPage();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe("visto");
  });
});
