import { defineConfig } from "vitest/config";

/**
 * Test contro un MySQL vero (in CI il servizio `mysql:8`): il setup globale
 * ricrea il database dal dump di prova e applica le migrazioni. Le variabili
 * DB_* sono le stesse del backend.
 */
export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    globalSetup: ["test/integration/global-setup.ts"],
    // Un solo processo: i test condividono lo stesso database.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
