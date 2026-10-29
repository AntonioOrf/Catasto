// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { TourProvider } from "../features/tour/TourProvider";
import GlossarioPage from "./GlossarioPage";
import { GLOSSARY, glossaryAnchor } from "../i18n/glossary";

describe("pagina del glossario", () => {
  it("ha una voce con ancora per ogni termine e un indice che vi rimanda", () => {
    Element.prototype.scrollIntoView ??= () => {};
    renderWithProviders(
      <TourProvider>
        <GlossarioPage />
      </TourProvider>,
    );
    for (const entry of GLOSSARY) {
      expect(document.getElementById(glossaryAnchor(entry.id))).not.toBeNull();
    }
    const index = screen.getByRole("navigation", { name: "Indice dei termini" });
    expect(index.querySelectorAll("a")).toHaveLength(GLOSSARY.length);
  });
});
