import { describe, expect, it } from "vitest";
import { findFoglioIndex, iiifImageUrl, resolveArchiveId } from "./archivio";

const page = (label: string) => ({ label, image: `https://iiif.example/${label}.jpg` });

describe("resolveArchiveId", () => {
  it("sceglie la parte del volume diviso in base alla carta", () => {
    expect(resolveArchiveId("100", "18", "1187")).toBe("2722381");
    expect(resolveArchiveId("100", "18", "1188r")).toBe("2722382");
  });

  it("lascia invariato l'id dei volumi non divisi", () => {
    expect(resolveArchiveId("100", "81", "12")).toBe("100");
  });
});

describe("findFoglioIndex", () => {
  it("trova la carta anche con zeri iniziali e preferisce il registro", () => {
    const pages = [page("Indice_0130"), page("Registro_0130.jpg"), page("Registro_0131")];
    expect(findFoglioIndex(pages, "130")).toBe(1);
  });

  it("per le carte con recto/verso ripiega sul solo numero", () => {
    const pages = [page("Registro_0244"), page("Registro_0245")];
    expect(findFoglioIndex(pages, "245r")).toBe(1);
    expect(findFoglioIndex([page("Registro_0245v")], "245v")).toBe(0);
  });

  it("restituisce -1 se la carta non c'è", () => {
    expect(findFoglioIndex([page("Registro_0001")], "999")).toBe(-1);
    expect(findFoglioIndex([page("Registro_0001")], "")).toBe(-1);
  });
});

describe("iiifImageUrl", () => {
  it("chiede la larghezza ridotta solo agli URL IIIF a piena risoluzione", () => {
    expect(iiifImageUrl("https://x/full/full/0/default.jpg", 1600)).toBe("https://x/full/1600,/0/default.jpg");
    expect(iiifImageUrl("https://x/img.jpg", 1600)).toBe("https://x/img.jpg");
  });
});
