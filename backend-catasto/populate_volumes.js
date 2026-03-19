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
    const urlString = "https://archiviodigitale-icar.cultura.gov.it/ajax.php?pageId=185&ajaxTarget=treeview&action=&controllerName=metafad.archive.controllers.ajax.GetTree&id=2722310";
    const url = new URL(urlString);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 10000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive'
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.length > 0 && parsed[0].children) {
            resolve(parsed[0].children);
          } else {
            reject(new Error("Formato JSON inatteso o risposta vuota dall'Archivio"));
          }
        } catch (e) {
          reject(new Error(`Errore nel parsing JSON: ${e.message}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy(new Error("Timeout di 10 secondi superato: il firewall dell'Archivio di Stato sta bloccando la connessione o il server è lento."));
    });

    req.end();
  });
} 


function parseVolumeNumber(title) {
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

    const createTableSql = `
            CREATE TABLE IF NOT EXISTS t_archivio_volumi (
                volume VARCHAR(50) PRIMARY KEY,
                codice_archivio VARCHAR(255) NOT NULL
            );
        `;
    await connection.query(createTableSql);
    console.log("Tabella t_archivio_volumi verificata/creata.");

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


