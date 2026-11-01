import "./env.js";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Options } from "express-rate-limit";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import pool from "../../src/config/db.js";
import { MysqlRateLimitStore } from "../../src/utils/mysql-rate-limit-store.js";
import { createLimiter } from "../../src/utils/rate-limit.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

afterAll(() => pool.end());
beforeEach(async () => {
  await pool.query("DELETE FROM rate_limit_hits");
});

const storeWith = (prefix: string, windowMs: number) => {
  const store = new MysqlRateLimitStore(prefix);
  store.init({ windowMs } as Options);
  return store;
};

describe("rate limit su MySQL (SHARED_STATE=mysql)", () => {
  it("due istanze dello store contano sulla stessa riga", async () => {
    const a = storeWith("api", 60_000);
    const b = storeWith("api", 60_000);
    expect((await a.increment("203.0.113.7")).totalHits).toBe(1);
    expect((await b.increment("203.0.113.7")).totalHits).toBe(2);
    expect((await a.increment("203.0.113.7")).totalHits).toBe(3);
    // Altro limiter, stesso IP: conteggio separato.
    expect((await storeWith("export", 60_000).increment("203.0.113.7")).totalHits).toBe(1);
  });

  it("incrementi concorrenti non si perdono", async () => {
    const store = storeWith("api", 60_000);
    await Promise.all(Array.from({ length: 20 }, () => store.increment("198.51.100.1")));
    expect((await store.get("198.51.100.1"))?.totalHits).toBe(20);
  });

  it("a finestra scaduta il conteggio riparte da 1", async () => {
    const store = storeWith("api", 200);
    await store.increment("192.0.2.1");
    await store.increment("192.0.2.1");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await store.get("192.0.2.1")).toBeUndefined();
    const info = await store.increment("192.0.2.1");
    expect(info.totalHits).toBe(1);
    expect(info.resetTime!.getTime()).toBeGreaterThan(Date.now());
  });

  it("decrement e resetKey", async () => {
    const store = storeWith("api", 60_000);
    await store.increment("192.0.2.2");
    await store.increment("192.0.2.2");
    await store.decrement("192.0.2.2");
    expect((await store.get("192.0.2.2"))?.totalHits).toBe(1);
    await store.resetKey("192.0.2.2");
    expect(await store.get("192.0.2.2")).toBeUndefined();
  });

  it("due app con lo stesso limiter condiviso sommano le richieste", async () => {
    process.env.SHARED_STATE = "mysql";
    const servers = [0, 1].map(() => {
      const app = express();
      app.use(createLimiter("prova", { windowMs: 60_000, limit: 3 }));
      app.get("/", (_req, res) => res.send("ok"));
      return app.listen(0);
    });
    delete process.env.SHARED_STATE;
    try {
      await Promise.all(servers.map((s) => new Promise((r) => (s.listening ? r(null) : s.once("listening", r)))));
      const urls = servers.map((s) => `http://127.0.0.1:${(s.address() as AddressInfo).port}/`);
      const statuses: number[] = [];
      for (const url of [urls[0], urls[1], urls[0], urls[1]]) statuses.push((await fetch(url)).status);
      expect(statuses).toEqual([200, 200, 200, 429]);
    } finally {
      await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
    }
  });
});

describe("migrazioni concorrenti", () => {
  it("più runner avviati insieme terminano tutti senza errori", async () => {
    // 005 torna "da applicare": senza lock ogni runner la applicherebbe e
    // l'INSERT in schema_migrations fallirebbe per chiave duplicata.
    await pool.query("DELETE FROM schema_migrations WHERE name = '005_stato_condiviso.sql'");
    const run = () =>
      promisify(execFile)("npx", ["tsx", "src/scripts/migrate.ts"], { cwd: root, env: process.env });
    const results = await Promise.allSettled([run(), run(), run()]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled", "fulfilled"]);
    const [rows]: any = await pool.query("SELECT COUNT(*) AS n FROM schema_migrations WHERE name = '005_stato_condiviso.sql'");
    expect(Number(rows[0].n)).toBe(1);
  }, 60_000);
});
