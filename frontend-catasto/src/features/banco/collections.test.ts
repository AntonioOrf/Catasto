// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  COLLECTIONS_STORAGE_KEY,
  addToCollection,
  buildCollectionUrl,
  deleteCollection,
  loadCollections,
  readCollectionFromHash,
  removeFromCollection,
} from "./collections";

beforeEach(() => localStorage.clear());

describe("raccolte", () => {
  it("si creano, si arricchiscono senza duplicati e sopravvivono al ricaricamento", () => {
    addToCollection("Lanaioli", [3, 1]);
    const [r] = addToCollection("  Lanaioli ", [1, 7]);
    expect(r.ids).toEqual([3, 1, 7]);
    expect(loadCollections()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(COLLECTIONS_STORAGE_KEY)!)[0].nome).toBe("Lanaioli");
  });

  it("l'ultima toccata va in cima; si tolgono fuochi e raccolte", () => {
    addToCollection("A", [1]);
    addToCollection("B", [2]);
    const all = addToCollection("A", [3]);
    expect(all.map((r) => r.nome)).toEqual(["A", "B"]);
    expect(removeFromCollection(all[0].id, 1)[0].ids).toEqual([3]);
    expect(deleteCollection(all[1].id).map((r) => r.nome)).toEqual(["A"]);
  });

  it("un nome vuoto non crea nulla", () => {
    expect(addToCollection("   ", [1])).toEqual([]);
  });

  it("voci alterate a mano si scartano, id non validi si ripuliscono", () => {
    localStorage.setItem(
      COLLECTIONS_STORAGE_KEY,
      JSON.stringify([{ id: "x", nome: "Buona", ids: [1, "2", -3, "boh"] }, { id: 5, nome: "Rotta" }, null, "testo"]),
    );
    expect(loadCollections()).toEqual([{ id: "x", nome: "Buona", ids: [1, 2], createdAt: "" }]);
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, "{rotto");
    expect(loadCollections()).toEqual([]);
  });

  it("senza localStorage la pagina non si blocca", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloccato");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloccato");
    });
    expect(loadCollections()).toEqual([]);
    expect(addToCollection("A", [1])[0].ids).toEqual([1]);
    spy.mockRestore();
    set.mockRestore();
  });
});

describe("link della raccolta", () => {
  const location = { origin: "https://catasto.example.org" };

  it("porta nome e id e si rilegge uguale", () => {
    const url = buildCollectionUrl({ nome: "Speziali: Santo Spirito", ids: [12, 345] }, location);
    expect(url.startsWith("https://catasto.example.org/banco#raccolta=")).toBe(true);
    expect(readCollectionFromHash(new URL(url).hash)).toEqual({ nome: "Speziali: Santo Spirito", ids: [12, 345] });
  });

  it("link incompleti o alterati non aprono nulla", () => {
    expect(readCollectionFromHash("")).toBeNull();
    expect(readCollectionFromHash("#q=abc")).toBeNull();
    expect(readCollectionFromHash("#raccolta=senza-id")).toBeNull();
    expect(readCollectionFromHash("#raccolta=:1,2")).toBeNull();
    expect(readCollectionFromHash("#raccolta=Vuota:abc")).toBeNull();
    expect(readCollectionFromHash("#raccolta=A:1,x,2,2")).toEqual({ nome: "A", ids: [1, 2] });
  });
});
