import { formatCsvRow, parseCsv } from "./csv.js";
import { normalizeLabel, TABELLE_LOOKUP, type MappaTraduzioni } from "../models/traduzioni.model.js";

/**
 * Formato dei file scambiati con la redazione:
 *
 *   tabella,valore_it,valore_en
 *   mestieri,Lanaiolo,Wool manufacturer
 *
 * La lingua e' il suffisso della terza colonna (`valore_en`).
 */

export interface RigaTraduzione {
  tabella: string;
  valore_it: string;
  lingua: string;
  valore: string;
}

/**
 * CSV dei valori distinti del dump: di default solo quelli ancora senza
 * traduzione (colonna vuota da compilare), con `tutte` anche quelli tradotti,
 * per una revisione. I valori che differiscono solo per maiuscole/accenti
 * compaiono una volta sola, come li confronta il backend.
 */
export function buildExportCsv(
  valori: { tabella: string; valori: unknown[] }[],
  mappe: MappaTraduzioni,
  lingua: string,
  tutte = false,
): string {
  const lines = [formatCsvRow(["tabella", "valore_it", `valore_${lingua}`])];
  for (const { tabella, valori: lista } of valori) {
    const visti = new Set<string>();
    const mappa = mappe.get(tabella);
    const ordinati = lista
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .map((v) => v.trim())
      .sort((a, b) => a.localeCompare(b, "it"));
    for (const valore of ordinati) {
      const key = normalizeLabel(valore);
      if (visti.has(key)) continue;
      visti.add(key);
      const traduzione = mappa?.get(key);
      if (traduzione && !tutte) continue;
      lines.push(formatCsvRow([tabella, valore, traduzione ?? ""]));
    }
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Righe da importare. Le righe con traduzione vuota sono ignorate (sono
 * quelle che la redazione non ha ancora compilato); una tabella sconosciuta
 * o un'intestazione sbagliata sono errori, con il numero di riga.
 */
export function parseImportCsv(text: string): RigaTraduzione[] {
  const [header, ...records] = parseCsv(text);
  if (!header) throw new Error("CSV vuoto");
  const cols = header.map((h) => h.trim().toLowerCase());
  const lingua = /^valore_([a-z]{2})$/.exec(cols[2] ?? "")?.[1];
  if (cols[0] !== "tabella" || cols[1] !== "valore_it" || !lingua || lingua === "it") {
    throw new Error("Intestazione attesa: tabella,valore_it,valore_<lingua> (es. valore_en)");
  }

  const righe: RigaTraduzione[] = [];
  records.forEach((record, index) => {
    const riga = index + 2;
    const [tabella = "", valoreIt = "", valore = ""] = record.map((f) => f.trim());
    if (!valore) return;
    if (!TABELLE_LOOKUP.has(tabella)) {
      throw new Error(`Riga ${riga}: tabella sconosciuta "${tabella}"`);
    }
    if (!valoreIt) throw new Error(`Riga ${riga}: valore_it mancante`);
    if (valoreIt.length > 255 || valore.length > 255) {
      throw new Error(`Riga ${riga}: valore oltre 255 caratteri`);
    }
    righe.push({ tabella, valore_it: valoreIt, lingua, valore });
  });
  return righe;
}
