export interface QueryFilters {
  q_persona?: string;
  q_localita?: string;
  mestiere?: string;
  bestiame?: string;
  immigrazione?: string;
  rapporto?: string;
  volume?: string;
  fortune_min?: string | number;
  fortune_max?: string | number;
  credito_min?: string | number;
  credito_max?: string | number;
  creditoM_min?: string | number;
  creditoM_max?: string | number;
  imponibile_min?: string | number;
  imponibile_max?: string | number;
  deduzioni_min?: string | number;
  deduzioni_max?: string | number;
  serie?: string;
  quartiere?: string;
  piviere?: string;
  popolo?: string;
  particolarita_parente?: string;
  casa?: string;
}

export const buildQuery = (filters: QueryFilters) => {
  const {
    q_persona,
    q_localita,
    mestiere,
    bestiame,
    immigrazione,
    rapporto,
    volume,
    fortune_min,
    fortune_max,
    credito_min,
    credito_max,
    creditoM_min,
    creditoM_max,
    imponibile_min,
    imponibile_max,
    deduzioni_min,
    deduzioni_max,
    serie,
    quartiere,
    piviere,
    popolo,
    particolarita_parente,
    casa,
  } = filters;

  let conditions = "WHERE 1=1";
  const params: any[] = [];
  const usedTables = new Set<string>(["f"]);

  if (q_persona) {
    conditions += ` AND (f.Nome_Fuoco LIKE ?)`;
    params.push(`%${q_persona}%`);
  }
  if (q_localita) {
    usedTables.add("tq").add("tp").add("tpi").add("tser");
    conditions += ` AND (tq.nome_quartiere LIKE ? OR tp.nome_popolo LIKE ? OR tpi.nome_piviere LIKE ? OR tser.nome_serie LIKE ?)`;
    params.push(
      `%${q_localita}%`,
      `%${q_localita}%`,
      `%${q_localita}%`,
      `%${q_localita}%`,
    );
  }
  if (volume) {
    conditions += ` AND TRIM(f.Volume_Fuoco) = ?`;
    params.push(volume);
  }

  if (mestiere && mestiere !== "") {
    conditions += " AND f.Mestiere_Fuoco = ?";
    params.push(mestiere);
  }
  if (bestiame && bestiame !== "") {
    conditions += " AND f.Bestiame_Fuoco = ?";
    params.push(bestiame);
  }
  if (immigrazione && immigrazione !== "") {
    conditions += " AND f.Immigrazione_Fuoco = ?";
    params.push(immigrazione);
  }
  if (rapporto && rapporto !== "") {
    conditions += " AND f.RapportoMestiere_Fuoco = ?";
    params.push(rapporto);
  }

  if (fortune_min) {
    conditions += " AND f.Fortune_Fuoco >= ?";
    params.push(fortune_min);
  }
  if (fortune_max) {
    conditions += " AND f.Fortune_Fuoco <= ?";
    params.push(fortune_max);
  }
  if (credito_min) {
    conditions += " AND f.Credito_Fuoco >= ?";
    params.push(credito_min);
  }
  if (credito_max) {
    conditions += " AND f.Credito_Fuoco <= ?";
    params.push(credito_max);
  }
  if (creditoM_min) {
    conditions += " AND f.CreditoM_Fuoco >= ?";
    params.push(creditoM_min);
  }
  if (creditoM_max) {
    conditions += " AND f.CreditoM_Fuoco <= ?";
    params.push(creditoM_max);
  }
  if (imponibile_min) {
    conditions += " AND f.Imponibile_Fuoco >= ?";
    params.push(imponibile_min);
  }
  if (imponibile_max) {
    conditions += " AND f.Imponibile_Fuoco <= ?";
    params.push(imponibile_max);
  }
  if (deduzioni_min) {
    conditions += " AND f.Deduzioni_Fuoco >= ?";
    params.push(deduzioni_min);
  }
  if (deduzioni_max) {
    conditions += " AND f.Deduzioni_Fuoco <= ?";
    params.push(deduzioni_max);
  }
  
  if (serie && serie !== "") {
    usedTables.add("tser");
    conditions += " AND tser.id_serie = ?";
    params.push(serie);
  }
  if (quartiere && quartiere !== "") {
    usedTables.add("tq");
    conditions += " AND tq.id_quartiere = ?";
    params.push(quartiere);
  }
  if (piviere && piviere !== "") {
    usedTables.add("tpi");
    conditions += " AND tpi.id_piviere = ?";
    params.push(piviere);
  }
  if (popolo && popolo !== "") {
    usedTables.add("tp");
    conditions += " AND tp.id_popolo = ?";
    params.push(popolo);
  }
  if (particolarita_parente && particolarita_parente !== "") {
    conditions += " AND EXISTS (SELECT 1 FROM parenti p_sub WHERE p_sub.ID_FUOCO = f.ID_Fuochi AND p_sub.Particolarita = ?)";
    params.push(particolarita_parente);
  }
  if (casa && casa !== "") {
    conditions += " AND f.Casa_Fuoco = ?";
    params.push(casa);
  }

  return { conditions, params, usedTables };
};

export const buildOrderBy = (sort_by: string | undefined, order: string | undefined) => {
  const safeOrder = order && order.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const usedTables = new Set<string>();

  switch (sort_by) {
    case "fortune":
      return { clause: `ORDER BY f.Fortune_Fuoco ${safeOrder}`, usedTables };
    case "credito":
      return { clause: `ORDER BY f.Credito_Fuoco ${safeOrder}`, usedTables };
    case "creditoM":
      return { clause: `ORDER BY f.CreditoM_Fuoco ${safeOrder}`, usedTables };
    case "imponibile":
      return { clause: `ORDER BY f.Imponibile_Fuoco ${safeOrder}`, usedTables };
    case "deduzioni":
      return { clause: `ORDER BY f.Deduzioni_Fuoco ${safeOrder}`, usedTables };
    case "localita":
      usedTables.add("tq").add("tp");
      return {
        clause: `ORDER BY tq.nome_quartiere ${safeOrder}, tp.nome_popolo ${safeOrder}`,
        usedTables,
      };
    default:
      return { clause: `ORDER BY f.Nome_Fuoco ${safeOrder}`, usedTables };
  }
};
