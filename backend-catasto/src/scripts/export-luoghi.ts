/**
 * Esporta in CSV i luoghi del catasto (una riga per id_registrazione) con il
 * numero di fuochi, ordinati per fuochi decrescenti: base per la
 * localizzazione dei luoghi sulla mappa.
 *
 * npm run db:export-luoghi -w catasto-backend [-- file.csv]
 *
 * Senza file il CSV va su stdout; i messaggi vanno su stderr.
 */
import { writeFile } from "node:fs/promises";

// config/db.ts annuncia la connessione con console.log: su stdout
// sporcherebbe il CSV. Import dinamici perche' questo venga prima.
console.log = console.error;
const { default: pool } = await import("../config/db.js");
const { buildLuoghiCsv, buildLuoghiQuery } = await import("../utils/luoghi-csv.js");

/** `t_mappa_conversione` (codici originali) non c'e' in tutte le copie del dump. */
async function haConversione(): Promise<boolean> {
  const [rows]: any = await pool.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 't_mappa_conversione'",
  );
  return Number(rows[0]?.n) > 0;
}

async function main(): Promise<void> {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));

  const conversione = await haConversione();
  if (!conversione) console.error("⚠️  t_mappa_conversione assente: colonne old_* vuote");

  const [rows]: any = await pool.query(buildLuoghiQuery(conversione));
  const csv = buildLuoghiCsv(rows, conversione);
  const fuochi = (rows as { fuochi: unknown }[]).reduce((tot, r) => tot + Number(r.fuochi), 0);
  const messaggio = `${rows.length} luoghi, ${fuochi} fuochi`;

  if (file) {
    await writeFile(file, csv, "utf8");
    console.error(`✅ ${messaggio} scritti in ${file}`);
  } else {
    process.stdout.write(csv);
    console.error(`✅ ${messaggio}`);
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
