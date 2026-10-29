import type { Readable, Writable } from "node:stream";
import ExcelJS from "exceljs";
import { formatCsvRow, type CsvSeparator } from "./csv.js";
import type { CellValue } from "./export-columns.js";

/**
 * Scrittura dei file di export sulla risposta HTTP, una riga alla volta.
 *
 * Lo stream delle righe di mysql2 va sempre consumato fino in fondo: se lo si
 * distrugge mentre la connessione è in pausa per backpressure, la connessione
 * resta in pausa e non torna più al pool. Per questo un errore di scrittura o
 * la chiusura anticipata del client non interrompono la lettura: le righe
 * restanti vengono scartate.
 */

export interface Sheet {
  name: string;
  header: string[];
  rows: Readable;
  toCells: (row: Record<string, unknown>) => CellValue[];
}

/** Coppie etichetta/valore dell'intestazione (fonte, data, query). */
export type Metadata = [string, string][];

const isGone = (out: Writable) => out.destroyed || out.writableEnded;

async function write(out: Writable, chunk: string): Promise<void> {
  if (isGone(out)) return;
  if (out.write(chunk)) return;
  // 'close' oltre a 'drain': un client che chiude non emette più 'drain'.
  // Entrambi i listener vanno tolti, qualunque arrivi per primo.
  await new Promise<void>((resolve) => {
    const done = () => {
      out.off("drain", done);
      out.off("close", done);
      resolve();
    };
    out.on("drain", done);
    out.on("close", done);
  });
}

/** Consuma tutte le righe; il primo errore di `onRow` viene rilanciato alla fine. */
async function consume(rows: Readable, onRow: (row: Record<string, unknown>) => Promise<void> | void): Promise<number> {
  let count = 0;
  let failure: unknown;
  for await (const row of rows) {
    if (failure !== undefined) continue;
    try {
      await onRow(row as Record<string, unknown>);
      count++;
    } catch (error) {
      failure = error;
    }
  }
  if (failure !== undefined) throw failure;
  return count;
}

const csvCell = (value: CellValue): string => (value === null ? "" : String(value));

/**
 * CSV UTF-8 con BOM (Excel altrimenti sbaglia gli accenti). L'intestazione con
 * fonte e query sta in righe iniziali che cominciano con `#`: R
 * (`comment.char = "#"`) e pandas (`comment = "#"`) le saltano, i fogli di
 * calcolo le mostrano in cima.
 */
export async function writeCsv(out: Writable, metadata: Metadata, sheet: Sheet, sep: CsvSeparator): Promise<number> {
  await write(out, "\uFEFF");
  // Mai fra virgolette: la riga deve cominciare con `#` per essere un commento.
  for (const [label, value] of metadata) {
    await write(out, `# ${label}: ${value.replace(/[\r\n]+/g, " ")}\r\n`);
  }
  await write(out, `${formatCsvRow(sheet.header, sep)}\r\n`);
  const count = await consume(sheet.rows, (row) => write(out, `${formatCsvRow(sheet.toCells(row).map(csvCell), sep)}\r\n`));
  if (!isGone(out)) out.end();
  return count;
}

/**
 * XLSX in streaming (exceljs WorkbookWriter): foglio "Info" con fonte e query,
 * poi un foglio per ogni insieme di righe. Ogni riga viene scritta e
 * rilasciata subito. I fogli arrivano come funzioni: la query di ciascuno
 * parte solo quando il precedente è finito, invece di tenere occupata una
 * seconda connessione del pool.
 */
export async function writeXlsx(
  out: Writable,
  metadata: Metadata,
  infoName: string,
  sheets: (() => Sheet)[],
): Promise<number[]> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: out, useStyles: true, useSharedStrings: false });

  const info = workbook.addWorksheet(infoName);
  info.columns = [{ width: 24 }, { width: 100 }];
  for (const [label, value] of metadata) info.addRow([label, value]).commit();
  info.commit();

  const counts: number[] = [];
  for (const makeSheet of sheets) {
    const sheet = makeSheet();
    const worksheet = workbook.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
    const header = worksheet.addRow(sheet.header);
    header.font = { bold: true };
    header.commit();
    counts.push(
      await consume(sheet.rows, (row) => {
        if (isGone(out)) return;
        worksheet.addRow(sheet.toCells(row)).commit();
      }),
    );
    worksheet.commit();
  }

  if (!isGone(out)) await workbook.commit();
  return counts;
}
