import { describe, expect, it } from "vitest";
import { parseSegnaturaPortata, volumeCatastoPortata } from "./segnatura";

describe("parseSegnaturaPortata", () => {
  it("toglie il prefisso ASFi, Catasto e separa volume e carta", () => {
    expect(parseSegnaturaPortata("ASFi, Catasto 125, c. 306")).toMatchObject({ fondo: null, volume: "125", carta: "306" });
    expect(parseSegnaturaPortata("asfi,catasto vol. 81, c. 245r")).toMatchObject({ fondo: null, volume: "81", carta: "245r" });
  });

  it("mostra il fondo quando non è il Catasto", () => {
    expect(parseSegnaturaPortata("ASFi, Estimo 12, c. 3r")).toMatchObject({ fondo: "ASFi, Estimo", volume: "12", carta: "3r" });
  });

  it("accetta volume e carta senza fondo", () => {
    expect(parseSegnaturaPortata("125, c. 306")).toMatchObject({ fondo: null, volume: "125", carta: "306" });
  });

  it("lascia il testo com'è se non riconosce la forma, con Vol. davanti al numero", () => {
    expect(parseSegnaturaPortata("ASFi, Catasto 125")).toMatchObject({ volume: null, testo: "Vol. 125" });
    expect(parseSegnaturaPortata("Carte Strozziane I, 5")).toMatchObject({ volume: null, testo: "Carte Strozziane I, 5" });
  });
});

describe("volumeCatastoPortata", () => {
  it("restituisce il volume del fondo Catasto", () => {
    expect(volumeCatastoPortata("ASFi, Catasto 125, c. 306")).toBe(125);
    expect(volumeCatastoPortata("125, c. 306")).toBe(125);
  });

  it("è null per altri fondi, segnature incomplete o assenti", () => {
    expect(volumeCatastoPortata("ASFi, Estimo 12, c. 3r")).toBeNull();
    expect(volumeCatastoPortata("ASFi, Catasto 125")).toBeNull();
    expect(volumeCatastoPortata("ASFi, Catasto 12bis, c. 3")).toBeNull();
    expect(volumeCatastoPortata(null)).toBeNull();
  });
});
