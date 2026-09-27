/**
 * Esporta in CSV (tabella,valore_it,valore_en) i valori distinti delle tabelle
 * di lookup del dump che non hanno ancora una traduzione inglese, da far
 * compilare alla redazione e reimportare con `db:import-traduzioni`.
 *
 * npm run db:export-traduzioni -w catasto-backend [-- file.csv] [-- --tutte]
 *
 * Senza file il CSV va su stdout; i messaggi vanno su stderr.
 */
import { writeFile } from "node:fs/promises";

// config/db.ts annuncia la connessione con console.log: su stdout
// sporcherebbe il CSV. Import dinamici perche' questo venga prima.
console.log = console.error;
const { default: pool } = await import("../config/db.js");
const { LOOKUP_TABLES, loadMappe } = await import("../models/traduzioni.model.js");
const { buildExportCsv } = await import("../utils/traduzioni-csv.js");

const LINGUA = "en";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const tutte = args.includes("--tutte");
  const file = args.find((a) => !a.startsWith("--"));

  const valori: { tabella: string; valori: unknown[] }[] = [];
  for (const { tabella, colonna } of LOOKUP_TABLES) {
    try {
      // Identificatori da whitelist (LOOKUP_TABLES), nessun input utente.
      const [rows]: any = await pool.query(`SELECT DISTINCT \`${colonna}\` AS valore FROM \`${tabella}\``);
      valori.push({ tabella, valori: (rows as { valore: unknown }[]).map((r) => r.valore) });
    } catch (error) {
      console.error(`⚠️  ${tabella} saltata:`, (error as Error).message);
    }
  }

  const csv = buildExportCsv(valori, await loadMappe(LINGUA), LINGUA, tutte);
  const righe = csv.trimEnd().split("\n").length - 1;
  if (file) {
    await writeFile(file, csv, "utf8");
    console.error(`✅ ${righe} valori scritti in ${file}`);
  } else {
    process.stdout.write(csv);
    console.error(`✅ ${righe} valori`);
  }
}

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    await pool.end().catch(() => {});
    process.exit(1);
  });
