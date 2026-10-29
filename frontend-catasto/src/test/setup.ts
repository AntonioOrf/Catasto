import { afterEach } from "vitest";

/**
 * Setup comune ai test. Nei file con `@vitest-environment jsdom` la lingua
 * parte in italiano (jsdom dichiara un browser inglese) e il DOM viene
 * smontato dopo ogni test: senza `globals` Testing Library non lo fa da sé.
 * `matchMedia` risponde come su desktop.
 */
if (typeof window !== "undefined") {
  window.localStorage.setItem("lang", "it");
  // jsdom non ha matchMedia: i test girano come su desktop.
  window.matchMedia ??= ((query: string) => ({
    matches: query.includes("min-width"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("lang", "it");
  });
}
