const buildQuery = (filters) => {
    const {
        q_persona, q_localita, mestiere, bestiame, immigrazione, rapporto,
        fortune_min, fortune_max, credito_min, credito_max,
        creditoM_min, creditoM_max, imponibile_min, imponibile_max,
        deduzioni_min, deduzioni_max
    } = filters;

    let conditions = 'WHERE 1=1';
    const params = [];

    if (q_persona) { conditions += ` AND (f.Nome_Fuoco LIKE ?)`; params.push(`%${q_persona}%`); }
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
    const safeOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
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

module.exports = { buildQuery, buildOrderBy };
