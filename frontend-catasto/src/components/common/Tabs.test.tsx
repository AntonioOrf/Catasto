// @vitest-environment jsdom
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Tabs from "./Tabs";

function Demo() {
  const [selected, setSelected] = useState<"a" | "b" | "c">("a");
  return (
    <Tabs
      idPrefix="t"
      label="Viste"
      tabs={[{ key: "a", label: "Uno" }, { key: "b", label: "Due" }, { key: "c", label: "Tre" }]}
      selected={selected}
      onSelect={setSelected}
    />
  );
}

describe("Tabs", () => {
  it("una sola scheda tabulabile, frecce e Home/Fine spostano selezione e focus", () => {
    render(<Demo />);
    const [uno, due, tre] = screen.getAllByRole("tab");
    expect([uno.tabIndex, due.tabIndex]).toEqual([0, -1]);
    expect(uno.getAttribute("aria-controls")).toBe("t-panel-a");

    uno.focus();
    fireEvent.keyDown(uno, { key: "ArrowRight" });
    expect(due.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(due);

    fireEvent.keyDown(due, { key: "End" });
    expect(document.activeElement).toBe(tre);
    fireEvent.keyDown(tre, { key: "ArrowRight" });
    expect(uno.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(uno, { key: "ArrowLeft" });
    expect(tre.getAttribute("aria-selected")).toBe("true");
  });
});
