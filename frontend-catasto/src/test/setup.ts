import { afterEach } from "vitest";

/**
 * Setup comune ai test. Nei file con `@vitest-environment jsdom` la lingua
 * parte in italiano (jsdom dichiara un browser inglese) e il DOM viene
 * smontato dopo ogni test: senza `globals` Testing Library non lo fa da sé.
 */
if (typeof window !== "undefined") {
  window.localStorage.setItem("lang", "it");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("lang", "it");
  });
}
