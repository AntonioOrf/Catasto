import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function checkDB() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });

    console.log("Connecting to DB...");
    const [rows] = await pool.query("DESCRIBE particolarita_fuoco;");
    console.log("Columns:");
    console.log(rows);
    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkDB();
