import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { serveFrontend } from "./static.js";
import { notFoundHandler } from "./middlewares/error.middleware.js";

describe("serveFrontend", () => {
  let dir: string;
  let server: Server;
  let base: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "catasto-static-"));
    await mkdir(path.join(dir, "assets"));
    await writeFile(path.join(dir, "index.html"), "<!doctype html><title>Catasto</title>");
    await writeFile(path.join(dir, "assets", "index-abc123.js"), "console.log(1)");
    await writeFile(path.join(dir, "favicon.svg"), "<svg/>");

    const app = express();
    app.get("/api/ping", (_req, res) => {
      res.json({ ok: true });
    });
    serveFrontend(app, dir);
    app.use(notFoundHandler);
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
    await rm(dir, { recursive: true, force: true });
  });

  it("serve index.html sulla radice e sulle rotte del client, senza cache", async () => {
    for (const p of ["/", "/banco", "/fuoco/42"]) {
      const res = await fetch(base + p);
      expect(res.status, p).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
      expect(res.headers.get("cache-control")).toBe("no-cache");
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(res.headers.get("content-security-policy")).not.toContain("upgrade-insecure-requests");
      expect(await res.text()).toContain("<title>Catasto</title>");
    }
  });

  it("serve gli asset con cache immutabile e un 404 per quelli mancanti", async () => {
    const ok = await fetch(`${base}/assets/index-abc123.js`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toContain("immutable");

    const missing = await fetch(`${base}/assets/index-vecchio.js`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Risorsa non trovata" });
  });

  it("serve gli altri file statici senza cache", async () => {
    const res = await fetch(`${base}/favicon.svg`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("lascia le rotte /api al backend: niente index.html né header della SPA", async () => {
    const ping = await fetch(`${base}/api/ping`);
    expect(await ping.json()).toEqual({ ok: true });
    expect(ping.headers.get("content-security-policy")).toBeNull();

    const unknown = await fetch(`${base}/api/inesistente`);
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: "Risorsa non trovata" });
  });
});
