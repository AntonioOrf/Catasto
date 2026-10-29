import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("../config/db.js", () => ({ default: { query } }));

const { CommonModel, parseCacheTtlMs, DEFAULT_FILTERS_CACHE_TTL_S } = await import("./common.model.js");

describe("parseCacheTtlMs", () => {
  it("legge secondi interi; vuoto o non valido è il default", () => {
    expect(parseCacheTtlMs("60")).toBe(60_000);
    expect(parseCacheTtlMs("0")).toBe(0);
    expect(parseCacheTtlMs(undefined)).toBe(DEFAULT_FILTERS_CACHE_TTL_S * 1000);
    expect(parseCacheTtlMs("un'ora")).toBe(DEFAULT_FILTERS_CACHE_TTL_S * 1000);
    expect(parseCacheTtlMs("-5")).toBe(DEFAULT_FILTERS_CACHE_TTL_S * 1000);
  });
});

describe("CommonModel.getFilters: cache delle opzioni", () => {
  // Dieci liste statiche: una query ciascuna per ogni caricamento.
  const QUERIES_PER_LOAD = 10;

  beforeEach(() => {
    vi.useFakeTimers();
    query.mockReset();
    query.mockResolvedValue([[]]);
    CommonModel.invalidateFilters();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.FILTERS_CACHE_TTL;
  });

  it("riusa la cache fino alla scadenza del TTL", async () => {
    process.env.FILTERS_CACHE_TTL = "60";
    await CommonModel.getFilters();
    await CommonModel.getFilters();
    expect(query).toHaveBeenCalledTimes(QUERIES_PER_LOAD);

    vi.advanceTimersByTime(61_000);
    await CommonModel.getFilters();
    expect(query).toHaveBeenCalledTimes(2 * QUERIES_PER_LOAD);
  });

  it("con TTL 0 non scade mai", async () => {
    process.env.FILTERS_CACHE_TTL = "0";
    await CommonModel.getFilters();
    vi.advanceTimersByTime(365 * 24 * 3600 * 1000);
    await CommonModel.getFilters();
    expect(query).toHaveBeenCalledTimes(QUERIES_PER_LOAD);
  });

  it("l'invalidazione forza una nuova lettura", async () => {
    await CommonModel.getFilters();
    CommonModel.invalidateFilters();
    await CommonModel.getFilters();
    expect(query).toHaveBeenCalledTimes(2 * QUERIES_PER_LOAD);
  });

  it("un errore del DB non resta in cache", async () => {
    query.mockRejectedValueOnce(new Error("DB giù"));
    await expect(CommonModel.getFilters()).rejects.toThrow("DB giù");
    await expect(CommonModel.getFilters()).resolves.toBeDefined();
  });
});
