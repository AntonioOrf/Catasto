require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true, // Mantiene viva la connessione TCP
  keepAliveInitialDelay: 0,
});

// Test connessione all'avvio
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Errore connessione iniziale DB:", err.message);
  } else {
    console.log("✅ Connesso al Database Cloud (Pool)");
    connection.release(); // Rilascia subito la connessione
  }
});

module.exports = pool;
