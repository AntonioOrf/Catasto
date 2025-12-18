require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true, // Mantiene viva la connessione TCP
  keepAliveInitialDelay: 0
});

// Test connessione all'avvio
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Errore connessione iniziale DB:', err.message);
  } else {
    console.log('✅ Connesso al Database Cloud (Pool)');
    connection.release(); // Rilascia subito la connessione
  }
});

// --- MODIFICA 2: Rotta "Ping" per tenere sveglio il server ---
app.get('/api/ping', (req, res) => {
  res.status(200).send('Pong! Server is awake.');
});

const dbQuery = (sql, params, res, callback) => {
  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error("Errore SQL:", err.message);
      return res.status(500).json({ error: "Errore Database o Connessione persa." });
    }
    callback(results);
  });
};

const buildQuery = (filters) => {
  const { 
    q_persona, q_localita, mestiere, bestiame, immigrazione, rapporto, 
    fortune_min, fortune_max, credito_min, credito_max,
    creditoM_min, creditoM_max, imponibile_min, imponibile_max,
    deduzioni_min, deduzioni_max
  } = filters;
  
  let conditions = 'WHERE 1=1';
  const params = [];

  if (q_persona) { conditions += ` AND (f.Nome_Fuoco LIKE ? OR m.Mestiere LIKE ?)`; params.push(`%${q_persona}%`, `%${q_persona}%`); }
  if (q_localita) { conditions += ` AND (tq.nome_quartiere LIKE ? OR tp.nome_popolo LIKE ? OR tpi.nome_piviere LIKE ? OR tser.nome_serie LIKE ?)`; params.push(`%${q_localita}%`, `%${q_localita}%`, `%${q_localita}%`, `%${q_localita}%`); }
  
  if (mestiere) { conditions += ' AND m.Mestiere LIKE ?'; params.push(`%${mestiere}%`); }
  if (bestiame && bestiame !== '') { conditions += ' AND f.Bestiame_Fuoco = ?'; params.push(bestiame); }
  if (immigrazione && immigrazione !== '') { conditions += ' AND f.Immigrazione_Fuoco = ?'; params.push(immigrazione); }
  if (rapporto && rapporto !== '') { conditions += ' AND f.RapportoMestiere_Fuoco = ?'; params.push(rapporto); }
  
  if (fortune_min) { conditions += ' AND f.Fortune_Fuoco >= ?'; params.push(fortune_min); }
  if (fortune_max) { conditions += ' AND f.Fortune_Fuoco <= ?'; params.push(fortune_max); }
  if (credito_min) { conditions += ' AND f.Credito_Fuoco >= ?'; params.push(credito_min); }
  if (credito_max) { conditions += ' AND f.Credito_Fuoco <= ?'; params.push(credito_max); }
  if (creditoM_min) { conditions += ' AND f.CreditoM_Fuoco >= ?'; params.push(creditoM_min); }
  if (creditoM_max) { conditions += ' AND f.CreditoM_Fuoco <= ?'; params.push(creditoM_max); }
  if (imponibile_min) { conditions += ' AND f.Imponibile_Fuoco >= ?'; params.push(imponibile_min); }
  if (imponibile_max) { conditions += ' AND f.Imponibile_Fuoco <= ?'; params.push(imponibile_max); }
  if (deduzioni_min) { conditions += ' AND f.Deduzioni_Fuoco >= ?'; params.push(deduzioni_min); }
  if (deduzioni_max) { conditions += ' AND f.Deduzioni_Fuoco <= ?'; params.push(deduzioni_max); }

  return { conditions, params };
};

const buildOrderBy = (sort_by, order) => {
  const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  switch (sort_by) {
    case 'fortune': return `ORDER BY f.Fortune_Fuoco ${safeOrder}`;
    case 'credito': return `ORDER BY f.Credito_Fuoco ${safeOrder}`;
    case 'creditoM': return `ORDER BY f.CreditoM_Fuoco ${safeOrder}`;
    case 'imponibile': return `ORDER BY f.Imponibile_Fuoco ${safeOrder}`;
    case 'deduzioni': return `ORDER BY f.Deduzioni_Fuoco ${safeOrder}`;
    case 'localita': return `ORDER BY tq.nome_quartiere ${safeOrder}, tp.nome_popolo ${safeOrder}`;
    default: return `ORDER BY f.Nome_Fuoco ${safeOrder}`;
  }
};

// --- API 1: LISTA PRINCIPALE ---
app.get('/api/catasto', (req, res) => {
  const { sort_by = 'nome', order = 'ASC', page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const limitVal = parseInt(limit);

  const { conditions, params } = buildQuery(req.query);
  const orderByClause = buildOrderBy(sort_by, order);

  const baseJoins = `
    FROM fuochi f
    LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id
    LEFT JOIN casa c ON f.Casa_Fuoco = c.Id_casa
    LEFT JOIN particolarita_fuoco pf ON f.Particolarita_Fuoco = pf.Id
    LEFT JOIN bestiame b ON f.Bestiame_Fuoco = b.ID_Bestiame
    LEFT JOIN immigrazione i ON f.Immigrazione_Fuoco = i.Id
    LEFT JOIN rapporto_mestiere rm ON f.RapportoMestiere_Fuoco = rm.ID_Rapporto
    LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione
    LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
    LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
    LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
    LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
  `;

  // Usa pool.query direttamente
  const countSql = `SELECT COUNT(*) as total ${baseJoins} ${conditions}`;
  const dataSql = `
    SELECT 
      f.ID_Fuochi as id, f.Nome_Fuoco as nome, 
      f.Imponibile_Fuoco as imponibile, f.Credito_Fuoco as credito, 
      f.CreditoM_Fuoco as credito_m, f.Fortune_Fuoco as fortune, f.Deduzioni_Fuoco as deduzioni,
      f.Volume_Fuoco as volume, f.Foglio_Fuoco as foglio, 
      pf.Particolarità as particolarita_fuoco,
      b.Bestiame as bestiame, i.Immigrazione as immigrazione, rm.RapportoLavoro as rapporto_mestiere,
      m.Mestiere as mestiere, c.Casa as casa, 
      tq.nome_quartiere as quartiere, tp.nome_popolo as popolo, 
      tpi.nome_piviere as piviere, tser.nome_serie as serie
    ${baseJoins} ${conditions} ${orderByClause} LIMIT ? OFFSET ?
  `;

  // Esecuzione query con gestione errori pool integrata
  pool.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalRecords = countResult[0].total;
    
    pool.query(dataSql, [...params, limitVal, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        pagination: { total: totalRecords, page: parseInt(page), limit: limitVal, totalPages: Math.ceil(totalRecords / limitVal) }
      });
    });
  });
});

// --- API 2: SIDEBAR ---
app.get('/api/catasto/sidebar', (req, res) => {
  const { sort_by = 'nome', order = 'ASC' } = req.query;
  const { conditions, params } = buildQuery(req.query);
  let orderByClause = buildOrderBy(sort_by, order);

  const sidebarJoins = `
    FROM fuochi f
    LEFT JOIN mestieri m ON f.Mestiere_Fuoco = m.id
    LEFT JOIN t_struttura_catastale ts ON f.id_registrazione = ts.id_registrazione
    LEFT JOIN t_quartieri tq ON ts.id_quartiere = tq.id_quartiere
    LEFT JOIN t_popoli tp ON ts.id_popolo = tp.id_popolo
    LEFT JOIN t_pivieri tpi ON ts.id_piviere = tpi.id_piviere
    LEFT JOIN t_serie tser ON ts.id_serie = tser.id_serie
    LEFT JOIN bestiame b ON f.Bestiame_Fuoco = b.ID_Bestiame
    LEFT JOIN immigrazione i ON f.Immigrazione_Fuoco = i.Id
    LEFT JOIN rapporto_mestiere rm ON f.RapportoMestiere_Fuoco = rm.ID_Rapporto
  `;

  const sql = `SELECT f.ID_Fuochi as id, f.Nome_Fuoco as nome, m.Mestiere as mestiere ${sidebarJoins} ${conditions} ${orderByClause} LIMIT 5000`;

  pool.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- API 3: PARENTI ---
app.get('/api/parenti/:id', (req, res) => {
  const sql = `
    SELECT p.Eta as eta, rp.Parentela as parentela_desc, sp.Sesso_Parenti as sesso,
      scp.StatoCivle as stato_civile, pp.ParticolaritàParenti as particolarita
    FROM parenti p
    LEFT JOIN rapporti_parentela rp ON p.Parentela = rp.ID_Parentela
    LEFT JOIN sesso_parenti sp ON p.Sesso = sp.ID_Sesso_Parenti
    LEFT JOIN statocivile_parenti scp ON p.StatoCivile = scp.ID_StatoCivile
    LEFT JOIN particolarita_parenti pp ON p.Particolarita = pp.ID_ParticolaritàParenti
    WHERE p.ID_FUOCO = ?
  `;
  pool.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});