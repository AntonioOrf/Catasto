/**
 * Importa in `luoghi_geo` (migrazione 005) le coordinate dei luoghi da un CSV
 * nel formato di `repetti:abbina`, anche rivisto a mano (colonne lat, lng,
 * certezza, ed eventualmente nome_moderno, fonte, note).
 *
 * npm run db:import-luoghi -w catasto-backend -- abbinamenti.csv            # righe revisionate
 * npm run db:import-luoghi -w catasto-backend -- abbinamenti.csv --automatico
 * npm run db:import-luoghi -w catasto-backend -- abbinamenti.csv --sql > migrations/006_....sql
 *
 * Di default le righe valgono come revisionate (revisionato = 1) e
 * sovrascrivono quelle presenti. Con --automatico non toccano le righe già
 * revisionate. Con --sql non si collega al database: scrive su stdout la
 * migrazione con gli abbinamenti automatici.
 */
import { readFile } from "node:fs/promises";
import { leggiCsvLuoghi, migrazioneSeedSql, parametriUpsert, upsertLuoghiSql } from "../utils/luoghi-geo.js";

const INTESTAZIONE_SEED = `
-- Coordinate proposte automaticamente per i luoghi del catasto: abbinamento
-- con il Dizionario del Repetti (repetti:abbina, docs/backend.md § 11.3) sul
-- dump di febbraio 2026, non ancora rivisto. Generata con
-- \`db:import-luoghi -- abbinamenti.csv --sql\`.
--
-- Le righe gia' revisionate a mano (revisionato = 1) non vengono toccate:
-- le correzioni si importano con \`db:import-luoghi\`.
`;

const BLOCCO = 200;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Uso: npm run db:import-luoghi -w catasto-backend -- abbinamenti.csv [--automatico] [--sql]");
    process.exit(2);
  }
  const righe = leggiCsvLuoghi(await readFile(file, "utf8"));

  if (args.includes("--sql")) {
    process.stdout.write(migrazioneSeedSql(righe, INTESTAZIONE_SEED, BLOCCO));
    console.error(`✅ ${righe.length} luoghi`);
    return;
  }

  const revisionato = !args.includes("--automatico");
  // config/db.ts stampa con console.log: qui stdout non serve, ma resta pulito.
  console.log = console.error;
  const { default: pool } = await import("../config/db.js");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (let i = 0; i < righe.length; i += BLOCCO) {
      const pezzo = righe.slice(i, i + BLOCCO);
      await connection.query(upsertLuoghiSql(pezzo.length, revisionato), parametriUpsert(pezzo, revisionato));
    }
    await connection.commit();
    console.error(`✅ ${righe.length} luoghi importati${revisionato ? " come revisionati" : ""}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
