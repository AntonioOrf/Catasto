// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import Pagination from "./Pagination";
import { renderWithProviders } from "../../../test/render";

const setup = (page: number, totalPages: number, loading = false) => {
  const handlePageChange = vi.fn();
  renderWithProviders(
    <Pagination page={page} totalPages={totalPages} loading={loading} handlePageChange={handlePageChange} />,
  );
  return handlePageChange;
};

describe("Pagination", () => {
  it("disabilita Precedente sulla prima pagina e Successivo sull'ultima", () => {
    setup(1, 1);
    expect((screen.getByRole("button", { name: "Pagina precedente" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Pagina successiva" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("durante il caricamento i comandi sono disabilitati", () => {
    setup(2, 5, true);
    expect((screen.getByRole("button", { name: "Pagina successiva" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("il campo cambia pagina solo su Invio, e ignora valori fuori intervallo", () => {
    const handlePageChange = setup(2, 5);
    const input = screen.getByLabelText("Pagina") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "4" } });
    expect(handlePageChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(handlePageChange).toHaveBeenCalledWith(4);

    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(handlePageChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("2");
  });
});
