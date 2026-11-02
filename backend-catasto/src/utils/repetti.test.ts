import { describe, expect, it } from "vitest";
import {
  contestoNorm,
  costruisciLuoghi,
  distanzaKm,
  eRinvio,
  estraiDedicazione,
  estraiDistanza,
  estraiPiviere,
  estraiTipo,
  gradiDirezione,
  intestazione,
  leggiMiglia,
  MIGLIO_TOSCANO_KM,
  nomeDopo,
  normalizzaNome,
  pulisciTesto,
  spostaPunto,
  variantiTitolo,
} from "./repetti.js";

const MARCIALLA =
  "Villata che dà il suo nome al popolo di S. Maria presso il distrutto Castello di Pogna nel piviere di S. Pietro in Bossolo, " +
  "Comunità e circa 4 miglia toscane a grecale di Certaldo, Giurisdizione di Castel Fiorentino, Diocesi e Compartimento di Firenze.";

describe("testo", () => {
  it("pulisce HTML, correzioni ERRATA, apostrofi e spazi", () => {
    expect(pulisciTesto("Val  d’Elsa <a href='x'>qui</a> (ERRATA : vecchio) nuovo")).toBe("Val d'Elsa qui nuovo");
  });

  it("prende il primo paragrafo senza il trattino iniziale", () => {
    expect(intestazione("– Villata\nnel piviere.\n\nSecondo paragrafo")).toBe("Villata nel piviere.");
  });

  it("riconosce i rinvii", () => {
    expect(eRinvio("Vedere BERARDENGA (CASTELNUOVO DELLA).")).toBe(true);
    expect(eRinvio("Villata nel piviere di Nera")).toBe(false);
  });
});

describe("direzioni e distanze", () => {
  it("converte i venti in gradi, anche composti e a cavallo del nord", () => {
    expect(gradiDirezione("grecale")).toBe(45);
    expect(gradiDirezione("mezzodì")).toBe(180);
    expect(gradiDirezione("grecale-levante")).toBeCloseTo(67.5);
    expect(gradiDirezione("maestro tramontana")).toBeCloseTo(337.5);
    expect(gradiDirezione("altrove")).toBeNull();
  });

  it("legge le quantità in miglia", () => {
    expect(leggiMiglia("4")).toBe(4);
    expect(leggiMiglia("2 1/2")).toBe(2.5);
    expect(leggiMiglia("3 e mezzo")).toBe(3.5);
    expect(leggiMiglia("un")).toBe(1);
    expect(leggiMiglia("mezzo")).toBe(0.5);
    expect(leggiMiglia("un quarto di")).toBe(0.25);
    expect(leggiMiglia("3 in 4")).toBe(3.5);
    expect(leggiMiglia("molte")).toBeNull();
  });

  it("estrae distanza, direzione e riferimento esplicito", () => {
    expect(estraiDistanza(MARCIALLA)).toEqual({ miglia: 4, direzione: "grecale", gradi: 45, riferimento: "Certaldo" });
  });

  it("gestisce le forme 'un miglio o poco più', inversa e 'da cui'", () => {
    expect(estraiDistanza("Comunità un miglio o poco più a ponente di Empoli, Diocesi di Firenze.")?.riferimento).toBe("Empoli");
    const inversa = estraiDistanza("Comunità Giurisdizione a circa miglia 2 e 1/2 a levante del Bagno stesso di Ripoli, Diocesi");
    expect(inversa).toMatchObject({ miglia: 2.5, gradi: 90, riferimento: "Bagno di Ripoli" });
    const daCui = estraiDistanza("Giurisdizione Diocesi e Compartimento di Siena, da cui trovasi circa 4 miglia toscane a ostro.");
    expect(daCui).toMatchObject({ miglia: 4, gradi: 180, riferimento: "Siena" });
  });

  it("non si ferma all'abbreviazione S. nel nome del riferimento", () => {
    expect(estraiDistanza("Comunità e 3 miglia a levante di Borgo S. Lorenzo, Diocesi")?.riferimento).toBe("Borgo S. Lorenzo");
  });

  it("sposta un punto e ne misura la distanza", () => {
    const origine = { lat: 43.54, lng: 11.04 };
    const nord = spostaPunto(origine.lat, origine.lng, 10, 0);
    expect(nord.lng).toBeCloseTo(origine.lng, 10);
    expect(distanzaKm(origine, nord)).toBeCloseTo(10, 1);
    const est = spostaPunto(origine.lat, origine.lng, 4 * MIGLIO_TOSCANO_KM, 90);
    expect(distanzaKm(origine, est)).toBeCloseTo(4 * MIGLIO_TOSCANO_KM, 1);
  });
});

describe("attributi dell'intestazione", () => {
  it("estrae piviere, comunità, giurisdizione e diocesi", () => {
    expect(estraiPiviere(MARCIALLA)).toBe("S. Pietro in Bossolo");
    expect(nomeDopo(MARCIALLA, "Comunità")).toBe("Certaldo");
    expect(nomeDopo(MARCIALLA, "Giurisdizione")).toBe("Castel Fiorentino");
    expect(nomeDopo(MARCIALLA, "Diocesi")).toBe("Firenze");
  });

  it("piviere implicito del capoluogo", () => {
    const testa = "Casale nel piviere, Comunità e circa 3 miglia a libeccio di Rignano, Giurisdizione del Pontassieve";
    expect(estraiPiviere(testa)).toBe("Rignano");
  });

  it("comunità con preposizione articolata nel nome", () => {
    expect(nomeDopo("Casale nella Comunità delle Masse di Città, Giurisdizione di Siena", "Comunità")).toBe("Masse di Città");
  });

  it("estrae la dedicazione dal testo, dalle parentesi o dal titolo", () => {
    expect(estraiDedicazione(MARCIALLA)).toBe("S. Maria");
    expect(estraiDedicazione("Borgata con chiesa parrocchiale (S. Martino) nel piviere di Nera")).toBe("S. Martino");
    expect(estraiDedicazione("Antica pieve nella Comunità", "BOSSOLO (S. PIETRO IN)")).toBe("S. PIETRO IN");
    expect(estraiDedicazione("Casale nel popolo di S. Lucia in Barbiano nell'anno 1551 non faceva")).toBe("S. Lucia in Barbiano");
  });

  it("estrae il tipo di luogo", () => {
    expect(estraiTipo(MARCIALLA)).toBe("Villata");
    expect(estraiTipo("Antica pieve nella Comunità")).toBe("Antica pieve");
  });
});

describe("nomi", () => {
  it("normalizza abbreviazioni, accenti e punteggiatura", () => {
    expect(normalizzaNome("S. Pietro in Bossolo")).toBe("SAN PIETRO IN BOSSOLO");
    expect(normalizzaNome("Santa Maria a Monte")).toBe(normalizzaNome("S. Maria a Monte"));
    expect(normalizzaNome("Barberino di Val d’Elsa")).toBe("BARBERINO DI VAL D ELSA");
    expect(normalizzaNome("Città")).toBe("CITTA");
  });

  it("ricava le varianti dei titoli", () => {
    expect(variantiTitolo("MONTAGUTO, o MONTAGUTOLO DI VICCHIO")).toEqual(["MONTAGUTO", "MONTAGUTOLO DI VICCHIO"]);
    expect(variantiTitolo("BOSSOLO (S. PIETRO IN)")).toEqual(["SAN PIETRO IN BOSSOLO"]);
    expect(variantiTitolo("CASCIANO (S.) DI MODIGLIANA")).toContain("SAN CASCIANO DI MODIGLIANA");
    expect(variantiTitolo("PRATO nella Valle del Bisenzio")).toEqual(["PRATO"]);
    expect(variantiTitolo("SAN CASCIANO fra la Val di Greve e la Val di Pesa")).toEqual(["SAN CASCIANO"]);
  });

  it("normalizza il contesto togliendo parentesi e preposizione iniziale", () => {
    expect(contestoNorm("(Jampereta) nel Val d'Arno casentinese.")).toBe("VAL D ARNO CASENTINESE");
  });
});

describe("costruisciLuoghi", () => {
  const coordinate = [
    { title: "CERTALDO", type: "place", point_source: "text", latitude: 43.55, longitude: 11.04 },
    { title: "SAN CASCIANO, o SANCASCIANO DE'BAGNI", type: "place", point_source: "manual", latitude: 42.87, longitude: 11.88 },
    { title: "SAN CASCIANO fra la Val di Greve e la Val di Pesa", type: "place", point_source: "manual", latitude: 43.66, longitude: 11.19 },
    { title: "CASTELNUOVO BERARDENGA", type: "reference", point_source: "none", latitude: null, longitude: null },
    { title: "BERARDENGA (CASTELNUOVO DELLA)", type: "place", point_source: "manual", latitude: 43.35, longitude: 11.5 },
  ];
  const articoli = [
    { title: "CERTALDO", context: "in Val d'Elsa.", body: "Castello famoso, Diocesi di Firenze." },
    { title: "SAN CASCIANO, o SANCASCIANO DE'BAGNI", context: "nella Val di Paglia.", body: "Castello ".repeat(400) },
    { title: "SAN CASCIANO fra la Val di Greve e la Val di Pesa", context: "", body: "Terra grossa." },
    { title: "CASTELNUOVO BERARDENGA", context: "", body: "– Vedere BERARDENGA (CASTELNUOVO DELLA)." },
    { title: "BERARDENGA (CASTELNUOVO DELLA)", context: "", body: "Terra." },
    { title: "MARCIALLA", context: "in Val d'Elsa.", body: `– ${MARCIALLA}` },
    { title: "FABBRICA in Val di Pesa", context: "", body: "– Villa nella Comunità e 5 miglia a scirocco di San Casciano, Diocesi di Firenze." },
    { title: "PIEVE", context: "", body: "– Casale nella Comunità e 2 miglia a ostro di Castelnuovo Berardenga, Diocesi di Arezzo." },
    { title: "BORGHETTO", context: "", body: "– Casale nella Comunità e 2 miglia a ostro di Luogo Inesistente." },
  ];
  const { luoghi, statistiche } = costruisciLuoghi([{ volume: "I", articoli }], coordinate);
  const per = (t: string) => luoghi.find((l) => l.titolo === t)!;

  it("esclude i rinvii e calcola la posizione dalla distanza", () => {
    expect(statistiche.rinvii).toBe(1);
    expect(luoghi.map((l) => l.titolo)).not.toContain("CASTELNUOVO BERARDENGA");
    const m = per("MARCIALLA");
    expect(m.fonte_coordinate).toBe("distanza");
    expect(m.riferimento_titolo).toBe("CERTALDO");
    expect(distanzaKm({ lat: 43.55, lng: 11.04 }, { lat: m.lat!, lng: m.lng! })).toBeCloseTo(4 * MIGLIO_TOSCANO_KM, 1);
    expect(m.lat!).toBeGreaterThan(43.55);
    expect(m.lng!).toBeGreaterThan(11.04);
  });

  it("fra omonimi sceglie quello della stessa valle, anche se la voce è più corta", () => {
    expect(per("FABBRICA in Val di Pesa").riferimento_titolo).toBe("SAN CASCIANO fra la Val di Greve e la Val di Pesa");
  });

  it("risolve i riferimenti attraverso i rinvii", () => {
    expect(per("PIEVE").riferimento_titolo).toBe("BERARDENGA (CASTELNUOVO DELLA)");
  });

  it("segnala i riferimenti non trovati e lascia vuote le coordinate", () => {
    const b = per("BORGHETTO");
    expect(b.note).toEqual(["riferimento_non_trovato"]);
    expect(b.lat).toBeNull();
    expect(b.fonte_coordinate).toBe("");
  });

  it("segnala le coordinate note in disaccordo con il testo", () => {
    const { luoghi: l2 } = costruisciLuoghi(
      [{ volume: "I", articoli: [articoli[0], articoli[5]] }],
      [coordinate[0], { title: "MARCIALLA", type: "place", point_source: "manual", latitude: 43.0, longitude: 11.04 }],
    );
    const m = l2.find((l) => l.titolo === "MARCIALLA")!;
    expect(m.fonte_coordinate).toBe("manual");
    expect(m.note).toContain("coordinate_incoerenti");
  });
});
