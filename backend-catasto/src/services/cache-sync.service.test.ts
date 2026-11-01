import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("../config/db.js", () => ({ default: { query } }));

const { CommonModel } = await import("../models/common.model.js");
const { TraduzioniModel } = await import("../models/traduzioni.model.js");
const { invalidateCaches, syncCaches, resetCacheSyncState, SYNC_INTERVAL_MS } = await import(
  "./cache-sync.service.js"
);

const generation = (n: number) => [[{ generazione: n }]];

describe("cache-sync", () => {
  let clearFilters: ReturnType<typeof vi.spyOn>;
  let clearTraduzioni: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    query.mockReset();
    resetCacheSyncState();
    clearFilters = vi.spyOn(CommonModel, "invalidateFilters");
    clearTraduzioni = vi.spyOn(TraduzioniModel, "clearCache");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SHARED_STATE;
  });

  it("senza stato condiviso l'invalidazione resta locale e non tocca il DB", async () => {
    await invalidateCaches();
    expect(clearFilters).toHaveBeenCalledTimes(1);
    expect(clearTraduzioni).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });

  it("con SHARED_STATE=mysql l'invalidazione incrementa la generazione", async () => {
    process.env.SHARED_STATE = "mysql";
    query.mockResolvedValueOnce([{}]).mockResolvedValueOnce(generation(4));
    await invalidateCaches();
    expect(query.mock.calls[0][0]).toMatch(/generazione = generazione \+ 1/);
    expect(clearFilters).toHaveBeenCalledTimes(1);
  });

  it("svuota le cache locali quando un'altra istanza cambia la generazione", async () => {
    const t0 = 1_000_000;
    query.mockResolvedValueOnce(generation(1));
    await syncCaches(t0); // primo controllo: memorizza e basta
    expect(clearFilters).not.toHaveBeenCalled();

    await syncCaches(t0 + 1000); // dentro l'intervallo: nessuna query
    expect(query).toHaveBeenCalledTimes(1);

    query.mockResolvedValueOnce(generation(1));
    await syncCaches(t0 + SYNC_INTERVAL_MS);
    expect(clearFilters).not.toHaveBeenCalled();

    query.mockResolvedValueOnce(generation(2));
    await syncCaches(t0 + 2 * SYNC_INTERVAL_MS);
    expect(clearFilters).toHaveBeenCalledTimes(1);
    expect(clearTraduzioni).toHaveBeenCalledTimes(1);
  });

  it("richieste concorrenti condividono la stessa query", async () => {
    query.mockResolvedValueOnce(generation(1));
    await Promise.all([syncCaches(5_000_000), syncCaches(5_000_000), syncCaches(5_000_000)]);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
