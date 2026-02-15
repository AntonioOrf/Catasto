const pool = require('../config/db');
const { buildQuery, buildOrderBy } = require('../utils/queryHelpers');

exports.getAll = (req, res) => {
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
};

exports.getSidebar = (req, res) => {
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
};
