import { afterEach, describe, expect, it, vi } from "vitest";
import { generateId } from "./saved-queries";

describe("generateId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });
    expect(generateId()).toBe("uuid-1");
  });

  it("falls back outside secure contexts", () => {
    vi.stubGlobal("crypto", {});
    const a = generateId();
    const b = generateId();
    expect(a).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(a).not.toBe(b);
  });
});
