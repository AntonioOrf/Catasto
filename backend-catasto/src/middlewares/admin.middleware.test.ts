import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAdmin } from "./admin.middleware.js";

const request = (authorization?: string) =>
  ({ get: (name: string) => (name.toLowerCase() === "authorization" ? authorization : undefined) }) as Request;

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe("requireAdmin", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn();
    process.env.ADMIN_TOKEN = "segreto";
  });
  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
  });

  it("senza ADMIN_TOKEN configurato l'area resta chiusa (403)", () => {
    delete process.env.ADMIN_TOKEN;
    const res = response();
    requireAdmin(request("Bearer qualunque"), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ["header assente", undefined],
    ["token errato", "Bearer sbagliato"],
    ["prefisso mancante", "segreto"],
    ["prefisso in minuscolo", "bearer segreto"],
    ["token vuoto", "Bearer "],
  ])("%s: 401", (_caso, header) => {
    const res = response();
    requireAdmin(request(header), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("con il token corretto passa al controller", () => {
    const res = response();
    requireAdmin(request("Bearer segreto"), res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
