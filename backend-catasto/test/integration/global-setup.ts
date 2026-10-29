import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { applyTestDbEnv } from "./env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Ricrea da zero il database di test: tutte le tabelle vengono eliminate, poi
 * si carica il dump di prova e si applicano le migrazioni con lo stesso
 * runner della produzione. Il database viene solo dalle variabili TEST_DB_*
 * (vedi env.ts), mai dalle DB_* del backend: cancellerebbe dati veri.
 */
export default async function setup() {
  applyTestDbEnv();
  const database = process.env.DB_NAME;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    database,
    multipleStatements: true,
  });
  try {
    const [tables]: any = await connection.query(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?",
      [database],
    );
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const { name } of tables) await connection.query(`DROP TABLE \`${name}\``);
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    await connection.query(await readFile(path.join(root, "test/fixtures/catasto-fixture.sql"), "utf8"));
  } finally {
    await connection.end();
  }

  execFileSync("npx", ["tsx", "src/scripts/migrate.ts"], { cwd: root, stdio: "inherit", env: process.env });
}
