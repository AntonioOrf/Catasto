import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Options } from "express-rate-limit";

const query = vi.fn();
vi.mock("../config/db.js", () => ({ default: { query } }));

const { MysqlRateLimitStore } = await import("./mysql-rate-limit-store.js");

describe("MysqlRateLimitStore", () => {
  let store: InstanceType<typeof MysqlRateLimitStore>;

  beforeEach(() => {
    query.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0.5); // niente pulizia casuale
    store = new MysqlRateLimitStore("api");
    store.init({ windowMs: 15 * 60 * 1000 } as Options);
  });

  it("increment: upsert con la finestra in microsecondi, poi legge il conteggio", async () => {
    query.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[{ hits: 3, ms_left: 60_000 }]]);
    const before = Date.now();

    const info = await store.increment("203.0.113.7");

    expect(query).toHaveBeenCalledTimes(2);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/ON DUPLICATE KEY UPDATE/);
    expect(params).toEqual(["api:203.0.113.7", 900_000_000, 900_000_000]);
    expect(query.mock.calls[1][1]).toEqual(["api:203.0.113.7"]);
    expect(info.totalHits).toBe(3);
    expect(info.resetTime!.getTime()).toBeGreaterThanOrEqual(before + 60_000);
  });

  it("increment: riga scaduta fra le due query = prima richiesta della finestra", async () => {
    query.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[]]);
    const info = await store.increment("203.0.113.7");
    expect(info.totalHits).toBe(1);
  });

  it("il prefisso separa i limiter sullo stesso IP", async () => {
    const other = new MysqlRateLimitStore("export");
    query.mockResolvedValue([[]]);
    await store.resetKey("203.0.113.7");
    await other.resetKey("203.0.113.7");
    expect(query.mock.calls[0][1]).toEqual(["api:203.0.113.7"]);
    expect(query.mock.calls[1][1]).toEqual(["export:203.0.113.7"]);
  });

  it("decrement non scende sotto zero", async () => {
    query.mockResolvedValue([{}]);
    await store.decrement("203.0.113.7");
    expect(query.mock.calls[0][0]).toMatch(/GREATEST\(hits - 1, 0\)/);
  });
});
