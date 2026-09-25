/**
 * Runner di migrazioni minimale: applica in ordine alfabetico i .sql di
 * `migrations/` non ancora registrati in `schema_migrations`.
 *
 * `npm run db:migrate -w catasto-backend`
 *
 * Volutamente senza dipendenze esterne: lo schema del progetto e' governato dal
 * dump dell'Archivio, qui servono solo le poche tabelle applicative aggiuntive.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../config/db.js";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);

// Una migrazione puo' contenere piu' statement: mysql2 li esegue solo con
// multipleStatements attivo (che non vogliamo sul pool applicativo), quindi
// splittiamo qui. I nostri file non contengono `;` dentro stringhe letterali.
const splitStatements = (sql: string): string[] =>
  sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);

async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [applied]: any = await pool.query("SELECT name FROM schema_migrations");
  const done = new Set<string>(applied.map((r: any) => r.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`↩️  ${file} (già applicata)`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const connection = await pool.getConnection();
    try {
      // I DDL MySQL fanno commit implicito: la transazione non rende atomico il
      // file, serve solo a non lasciare la connessione in stato sporco.
      await connection.beginTransaction();
      for (const statement of splitStatements(sql)) {
        await connection.query(statement);
      }
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      await connection.commit();
      console.log(`✅ ${file}`);
    } catch (error) {
      await connection.rollback();
      console.error(`❌ ${file} fallita:`, (error as Error).message);
      throw error;
    } finally {
      connection.release();
    }
  }
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    await pool.end().catch(() => {});
    process.exit(1);
  });
