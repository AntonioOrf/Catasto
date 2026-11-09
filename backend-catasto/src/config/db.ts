import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Su Vercel ogni istanza della funzione ha il suo pool e le istanze possono
// essere molte: poche connessioni a testa per non esaurire quelle concesse
// dal database (TiDB Serverless ne limita il numero). Sovrascrivibile con
// DB_CONNECTION_LIMIT.
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || (process.env.VERCEL ? 5 : 50);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit,
  // Le connessioni inattive di una funzione congelata vengono chiuse lato
  // server: meglio scartarle prima che riusarle già morte.
  maxIdle: process.env.VERCEL ? 1 : undefined,
  idleTimeout: 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connesso al Database (Pool)");
    connection.release();
  } catch (err: any) {
    // Host, porta e SSL effettivi (mai utente o password): con un timeout è
    // l'unico modo di vedere dai log dove la funzione sta provando a
    // collegarsi, perché su Vercel le variabili sensibili non si rileggono.
    const host = JSON.stringify(process.env.DB_HOST ?? null);
    const port = Number(process.env.DB_PORT) || 3306;
    const ssl = process.env.DB_SSL === "true";
    console.error(
      `❌ Errore connessione iniziale DB: ${err.code ?? ""} ${err.message} (host=${host} porta=${port} ssl=${ssl})`,
    );
  }
})();

export default pool;
