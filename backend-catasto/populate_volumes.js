const mysql = require("mysql2/promise");
const https = require("https");

// Configurazione DB
require('dotenv').config();
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
};

async function fetchVolumes() {
  return new Promise((resolve, reject) => {
    const url =
      "https://archiviodigitale-icar.cultura.gov.it/ajax.php?pageId=185&ajaxTarget=treeview&action=&controllerName=metafad.archive.controllers.ajax.GetTree&id=2722310";
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && parsed.length > 0 && parsed[0].children) {
              resolve(parsed[0].children);
            } else {
              reject(new Error("Formato JSON inatteso"));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function parseVolumeNumber(title) {
  // Es. "ASFI_CATASTO_15" -> "15"
  // "ASFI_CATASTO_18_I" -> "18" (per ora leghiamo al numero base primario che puÃ² essere in fuochi, ma fuochi di solito ha "18")
  // Facciamo una regex per prendere i numeri dopo ASFI_CATASTO_
  const match = title.match(/ASFI_CATASTO_(\d+)/i);
  if (match) {
    return match[1];
  }
  return null;
}

async function run() {
  console.log("Creazione della tabella e popolamento in corso...");
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Crea la tabella se non esiste
    const createTableSql = `
            CREATE TABLE IF NOT EXISTS t_archivio_volumi (
                volume VARCHAR(50) PRIMARY KEY,
                codice_archivio VARCHAR(255) NOT NULL
            );
        `;
    await connection.query(createTableSql);
    console.log("Tabella t_archivio_volumi verificata/creata.");

    // Fetch data
    console.log("Scaricamento dati dall'Archivio di Stato...");
    const items = await fetchVolumes();
    console.log(`Trovati ${items.length} volumi.`);

    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      const volStr = parseVolumeNumber(item.title);
      if (volStr) {
        const code = item.id;
        try {
          await connection.query(
            "INSERT INTO t_archivio_volumi (volume, codice_archivio) VALUES (?, ?) ON DUPLICATE KEY UPDATE codice_archivio = VALUES(codice_archivio)",
            [volStr, code],
          );
          inserted++;
        } catch (dbErr) {
          console.error(`Errore inserimento vol ${volStr}:`, dbErr.message);
        }
      } else {
        skipped++;
        console.log(`Skippato: ${item.title} (formato non riconosciuto)`);
      }
    }

    console.log(
      `Operazione completata. Inseriti/Aggiornati: ${inserted}. Ignorati: ${skipped}.`,
    );
  } catch (err) {
    console.error("Errore fatale:", err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();


