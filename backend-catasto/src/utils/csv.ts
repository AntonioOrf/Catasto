/**
 * CSV minimale (RFC 4180) per l'export dei risultati e per gli script delle
 * traduzioni: separatore virgola (o punto e virgola, per Excel in italiano),
 * campi fra doppi apici quando contengono separatore, apici o a capo, apice
 * raddoppiato come escape. Niente dipendenze esterne.
 */

export type CsvSeparator = "," | ";";

export function formatCsvField(value: string, sep: CsvSeparator = ","): string {
  const special = sep === "," ? /[",\r\n]/ : /[";\r\n]/;
  return special.test(value) || value !== value.trim() ? `"${value.replace(/"/g, '""')}"` : value;
}

export function formatCsvRow(fields: string[], sep: CsvSeparator = ","): string {
  return fields.map((field) => formatCsvField(field, sep)).join(sep);
}

/** Righe del CSV come array di campi. Tollera BOM, CRLF e l'ultima riga senza a capo. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    // Le righe vuote (anche in fondo al file) non sono record.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === ",") {
      endField();
    } else if (c === "\n") {
      endRow();
    } else if (c === "\r") {
      if (text[i + 1] !== "\n") endRow();
    } else {
      field += c;
    }
  }
  if (quoted) throw new Error("CSV non valido: apice non chiuso");
  if (field !== "" || row.length > 0) endRow();
  return rows;
}
