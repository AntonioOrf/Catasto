import { describe, expect, it } from "vitest";
import { HttpError, paginationSchema, parseNumericId, splitPaginationQuery, ValidationError } from "./validation.js";

describe("paginationSchema", () => {
  it("valori validi passano convertiti in numero", () => {
    expect(paginationSchema.parse({ page: "3", limit: "20", sort_by: "fortune", order: "DESC" })).toEqual({
      page: 3,
      limit: 20,
      sort_by: "fortune",
      order: "DESC",
    });
  });

  it("valori fuori intervallo o malformati tornano ai default invece di dare errore", () => {
    expect(paginationSchema.parse({ page: "0", limit: "99999", sort_by: "x".repeat(60), order: "x".repeat(20) })).toEqual({
      page: 1,
      limit: 50,
      sort_by: "nome",
      order: "ASC",
    });
    expect(paginationSchema.parse({ page: "abc", limit: "2.5" })).toMatchObject({ page: 1, limit: 50 });
  });
});

describe("splitPaginationQuery", () => {
  it("separa paginazione e filtri, applicando i default dati", () => {
    const { pagination, filters } = splitPaginationQuery({ page: "2", mestiere: "4", q_persona: "Nuto" }, { limit: "1000" });
    expect(pagination).toMatchObject({ page: 2, limit: 1000 });
    expect(filters).toEqual({ mestiere: "4", q_persona: "Nuto" });
  });

  it("un limit esplicito vince sul default", () => {
    expect(splitPaginationQuery({ limit: "10" }, { limit: "1000" }).pagination.limit).toBe(10);
  });
});

describe("parseNumericId", () => {
  it("accetta solo cifre, fino a 10", () => {
    expect(parseNumericId("42")).toBe(42);
    expect(() => parseNumericId("4a")).toThrow(ValidationError);
    expect(() => parseNumericId("-1")).toThrow(ValidationError);
    expect(() => parseNumericId("12345678901")).toThrow(/numeric/);
    expect(() => parseNumericId(undefined, "fuoco id")).toThrow(/fuoco id/);
  });
});

describe("HttpError", () => {
  it("porta lo status; ValidationError è sempre 400", () => {
    expect(new HttpError(502, "x").status).toBe(502);
    expect(new ValidationError("x").status).toBe(400);
    expect(new ValidationError("x")).toBeInstanceOf(HttpError);
  });
});
