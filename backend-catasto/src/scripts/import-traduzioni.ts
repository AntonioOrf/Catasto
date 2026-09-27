/**
 * Importa un CSV tabella,valore_it,valore_en (quello prodotto da
 * `db:export-traduzioni`, compilato dalla redazione) in `traduzioni_lookup`.
 * Le righe con traduzione vuota sono ignorate; quelle gia' presenti vengono
 * aggiornate. Tutto il file in una transazione: o entra tutto o niente.
 *
 * npm run db:import-traduzioni -w catasto-backend -- file.csv
 *
 * Il backend rilegge le traduzioni entro 10 minuti (TTL della cache).
 */
import { readFile } from "node:fs/promises";
import pool from "../config/db.js";
import { parseImportCsv } from "../utils/traduzioni-csv.js";

const BATCH = 500;

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) throw new Error("Uso: db:import-traduzioni <file.csv>");

  const righe = parseImportCsv(await readFile(file, "utf8"));
  if (righe.length === 0) {
    console.log("Nessuna traduzione da importare.");
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (let i = 0; i < righe.length; i += BATCH) {
      const batch = righe.slice(i, i + BATCH);
      await connection.query(
        `INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES ?
         ON DUPLICATE KEY UPDATE valore = VALUES(valore)`,
        [batch.map((r) => [r.tabella, r.valore_it, r.lingua, r.valore])],
      );
    }
    await connection.commit();
    console.log(`✅ ${righe.length} traduzioni importate da ${file}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("❌", (error as Error).message ?? error);
    await pool.end().catch(() => {});
    process.exit(1);
  });
