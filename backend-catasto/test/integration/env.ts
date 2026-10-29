import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Il database dei test di integrazione si indica solo con variabili TEST_DB_*
 * (anche da `backend-catasto/.env.test`), mai con le DB_* del backend: il
 * setup cancella tutte le tabelle, e le DB_* dell'ambiente possono puntare a
 * un database vero. Qui le TEST_DB_* sostituiscono le DB_* prima che
 * config/db.ts crei il pool, per cui questo modulo va importato per primo.
 */
export function applyTestDbEnv(): void {
  dotenv.config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env.test"),
    quiet: true,
  });
  const name = process.env.TEST_DB_NAME;
  if (!name || !/test/i.test(name) || !process.env.TEST_DB_HOST) {
    throw new Error(
      "Test di integrazione: imposta TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASSWORD e un TEST_DB_NAME che contenga 'test'",
    );
  }
  process.env.DB_HOST = process.env.TEST_DB_HOST;
  process.env.DB_PORT = process.env.TEST_DB_PORT ?? "3306";
  process.env.DB_USER = process.env.TEST_DB_USER ?? "";
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? "";
  process.env.DB_NAME = name;
  process.env.DB_SSL = process.env.TEST_DB_SSL ?? "false";
}

applyTestDbEnv();
