const pool = require('../config/db');

exports.getByFuocoId = (req, res) => {
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
};
