import { describe, expect, it } from "vitest";
import { FIELDS_WITHOUT_GLOSSARY_DECISION, FIELD_TERMS, GLOSSARY, getGlossaryEntry } from "./glossary";

describe("glossario", () => {
  it("ogni campo del registry ha una decisione, e ogni termine indicato esiste", () => {
    expect(FIELDS_WITHOUT_GLOSSARY_DECISION).toEqual([]);
    for (const [field, id] of Object.entries(FIELD_TERMS)) {
      if (id) expect(getGlossaryEntry(id), `${field} → ${id}`).toBeDefined();
    }
  });

  it("i termini tecnici dei campi economici e geografici hanno una voce", () => {
    for (const field of ["nome", "volume", "foglio", "fortune", "credito", "credito_m", "imponibile", "deduzioni", "serie", "quartiere", "piviere", "popolo", "segnatura_portata"]) {
      expect(FIELD_TERMS[field], field).toBeTruthy();
    }
  });

  it("ogni voce è completa in italiano e in inglese, con id unici", () => {
    expect(new Set(GLOSSARY.map((e) => e.id)).size).toBe(GLOSSARY.length);
    for (const entry of GLOSSARY) {
      for (const text of [entry.term, entry.short, ...(entry.long ? [entry.long] : [])]) {
        expect(text.it.trim(), entry.id).not.toBe("");
        expect(text.en.trim(), entry.id).not.toBe("");
      }
    }
  });
});
