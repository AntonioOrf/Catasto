import { formatCsvRow } from "./csv.js";

/**
 * Luoghi del catasto per la mappa: una riga per `id_registrazione`, cioè per
 * combinazione completa serie/quartiere/piviere/popolo. I nomi restano quelli
 * del dump, senza unire le voci omonime che differiscono per numero romano
 * (come fanno invece i filtri della ricerca): sulla mappa sono luoghi distinti.
 */

export const COLONNE_LUOGHI = [
  "id_registrazione",
  "id_serie",
  "nome_serie",
  "id_quartiere",
  "nome_quartiere",
  "id_piviere",
  "nome_piviere",
  "id_popolo",
  "nome_popolo",
  "old_serie",
  "old_quartiere",
  "old_piviere",
  "old_popolo",
  "fuochi",
  "avvisi",
] as const;

export type RigaLuogo = Partial<Record<Exclude<(typeof COLONNE_LUOGHI)[number], "avvisi">, unknown>>;

/** Serie della città di Firenze: `id_piviere` contiene il gonfalone, `id_popolo` è sempre NULL. */
export const SERIE_FIRENZE = [1, 2, 7] as const;

/**
 * Anomalie note dei dati geografici, gestite dalla mappa senza correggere il
 * dump (vedi docs/backend.md, "Luoghi e anomalie dei dati geografici"):
 *
 * - `quartiere_mancante`: gonfalone di Firenze senza quartiere (serie 1,
 *   Santo Spirito); la mappa lo colloca tramite il gonfalone.
 * - `codici_originali_incoerenti`: la serie di `t_mappa_conversione` non è
 *   quella del luogo (righe slittate ai confini fra serie); i codici
 *   originali non vanno usati per collegare fonti esterne.
 * - `codici_originali_assenti`: luogo aggiunto dopo la conversione.
 * - `luogo_aggregato`: né piviere né popolo (città con un solo record):
 *   tutti i fuochi cadono su un unico punto.
 * - `senza_fuochi`: nessun fuoco registrato; la mappa non lo mostra.
 */
export type AvvisoLuogo =
  | "quartiere_mancante"
  | "codici_originali_incoerenti"
  | "codici_originali_assenti"
  | "luogo_aggregato"
  | "senza_fuochi";

function presente(valore: unknown): boolean {
  return valore !== null && valore !== undefined && valore !== "";
}

/** `conversione`: false se `t_mappa_conversione` manca (codici originali non verificabili). */
export function avvisiLuogo(riga: RigaLuogo, conversione = true): AvvisoLuogo[] {
  const avvisi: AvvisoLuogo[] = [];
  const serie = Number(riga.id_serie);
  if ((SERIE_FIRENZE as readonly number[]).includes(serie) && !presente(riga.id_quartiere)) {
    avvisi.push("quartiere_mancante");
  }
  if (conversione) {
    if (!presente(riga.old_serie)) avvisi.push("codici_originali_assenti");
    else if (Number(riga.old_serie) !== serie) avvisi.push("codici_originali_incoerenti");
  }
  if (!presente(riga.id_piviere) && !presente(riga.id_popolo)) avvisi.push("luogo_aggregato");
  if (Number(riga.fuochi) === 0) avvisi.push("senza_fuochi");
  return avvisi;
}

/** Colonne dei codici originali, presenti solo se esiste `t_mappa_conversione`. */
const COLONNE_CONVERSIONE = "m.old_serie, m.old_quartiere, m.old_piviere, m.old_popolo";

/**
 * Query dei luoghi, ordinati per numero di fuochi decrescente. Con
 * `conversione` aggiunge i codici originali (serie, quartiere, piviere,
 * popolo numerati dentro l'unità superiore) da `t_mappa_conversione`.
 */
export function buildLuoghiQuery(conversione: boolean): string {
  return `
    SELECT ts.id_registrazione,
           ts.id_serie, s.nome_serie,
           ts.id_quartiere, q.nome_quartiere,
           ts.id_piviere, pv.nome_piviere,
           ts.id_popolo, po.nome_popolo,
           ${conversione ? COLONNE_CONVERSIONE : "NULL AS old_serie, NULL AS old_quartiere, NULL AS old_piviere, NULL AS old_popolo"},
           (SELECT COUNT(*) FROM fuochi f WHERE f.id_registrazione = ts.id_registrazione) AS fuochi
    FROM t_struttura_catastale ts
    LEFT JOIN t_serie s ON s.id_serie = ts.id_serie
    LEFT JOIN t_quartieri q ON q.id_quartiere = ts.id_quartiere
    LEFT JOIN t_pivieri pv ON pv.id_piviere = ts.id_piviere
    LEFT JOIN t_popoli po ON po.id_popolo = ts.id_popolo
    ${conversione ? "LEFT JOIN t_mappa_conversione m ON m.new_id_registrazione = ts.id_registrazione" : ""}
    ORDER BY fuochi DESC, ts.id_registrazione`;
}

function campo(valore: unknown): string {
  if (valore === null || valore === undefined) return "";
  return String(valore).trim();
}

/**
 * CSV con intestazione; NULL diventa campo vuoto, i nomi restano invariati.
 * L'ultima colonna elenca gli avvisi del luogo separati da punto e virgola.
 */
export function buildLuoghiCsv(righe: RigaLuogo[], conversione = true): string {
  const lines = [formatCsvRow([...COLONNE_LUOGHI])];
  for (const riga of righe) {
    lines.push(
      formatCsvRow(
        COLONNE_LUOGHI.map((c) => (c === "avvisi" ? avvisiLuogo(riga, conversione).join(";") : campo(riga[c]))),
      ),
    );
  }
  return `${lines.join("\n")}\n`;
}
