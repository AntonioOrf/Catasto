import type { Response } from "express";
import { fieldLabelIn, type Lingua, type OptionsByKey } from "@catasto/shared";
import { FuocoModel } from "../models/fuoco.model.js";
import { CommonModel } from "../models/common.model.js";
import { TraduzioniModel, translateFilters } from "../models/traduzioni.model.js";
import { buildOrderBy } from "../utils/query-builder.js";
import { ValidationError } from "../utils/validation.js";
import type { CsvSeparator } from "../utils/csv.js";
import { FUOCHI_COLUMNS, PARENTI_COLUMNS, columnLabels, toCells } from "../utils/export-columns.js";
import { writeCsv, writeXlsx, type Metadata, type Sheet } from "../utils/export-writers.js";

export type ExportFormat = "csv" | "xlsx";

export interface ExportOptions {
  format: ExportFormat;
  /** CSV: il file dei parenti al posto di quello dei fuochi. XLSX: un foglio in più. */
  parenti: boolean;
  sep: CsvSeparator;
  lang: Lingua;
}

export interface CompiledFilters {
  conditions: string;
  params: unknown[];
  usedTables: Set<string>;
}

/**
 * Tetto di righe (fuochi) di un export, da `EXPORT_MAX_ROWS`. Il default copre
 * l'intero dataset (~61.000 fuochi): il limite serve contro un uso abusivo,
 * non a impedire l'export completo.
 */
export const DEFAULT_EXPORT_MAX_ROWS = 100_000;

export function exportMaxRows(value = process.env.EXPORT_MAX_ROWS): number {
  const trimmed = value?.trim();
  return trimmed && /^\d+$/.test(trimmed) && Number(trimmed) > 0 ? Number(trimmed) : DEFAULT_EXPORT_MAX_ROWS;
}

const TEXT = {
  it: {
    source: "Fonte",
    sourceValue:
      "Catasto fiorentino del 1427/30. Dati della ricerca di Christiane Klapisch-Zuber, digitalizzati da ACRH (https://journals.openedition.org/acrh/7458)",
    date: "Data dell'export",
    search: "Ricerca",
    sort: "Ordinamento",
    households: "Fuochi",
    content: "Contenuto",
    contentFuochi: "Un fuoco per riga",
    contentParenti: "Parenti dei fuochi della ricerca, una riga per parente",
    missing: "Le celle vuote sono dati assenti nella fonte, non zeri",
    notes: "Note",
    asc: "crescente",
    desc: "decrescente",
    place: "Località",
    info: "Info",
    fuochi: "Fuochi",
    parenti: "Parenti",
    tooMany: "La ricerca restituisce {total} fuochi: l'export è limitato a {max}. Restringi i filtri e riprova.",
  },
  en: {
    source: "Source",
    sourceValue:
      "Florentine Catasto of 1427/30. Data from Christiane Klapisch-Zuber's research, digitised by ACRH (https://journals.openedition.org/acrh/7458)",
    date: "Exported on",
    search: "Search",
    sort: "Sort order",
    households: "Households",
    content: "Content",
    contentFuochi: "One household per row",
    contentParenti: "Relatives of the households in the search, one relative per row",
    missing: "Empty cells are data missing from the source, not zeros",
    notes: "Notes",
    asc: "ascending",
    desc: "descending",
    place: "Place",
    info: "Info",
    fuochi: "Households",
    parenti: "Relatives",
    tooMany: "The search returns {total} households: exports are limited to {max}. Narrow the filters and try again.",
  },
} as const;

/** Etichetta leggibile dell'ordinamento, con le chiavi accettate da `buildOrderBy`. */
function describeSort(sortBy: string | undefined, order: string | undefined, lang: Lingua): string {
  const keys: Record<string, string> = { creditoM: "credito_m" };
  const key = sortBy && ["fortune", "credito", "creditoM", "imponibile", "deduzioni", "localita"].includes(sortBy) ? sortBy : "nome";
  const label = key === "localita" ? TEXT[lang].place : fieldLabelIn(keys[key] ?? key, lang);
  const verso = order?.toUpperCase() === "DESC" ? TEXT[lang].desc : TEXT[lang].asc;
  return `${label}, ${verso}`;
}

const today = () => new Date().toISOString().slice(0, 10);

export function exportFilename(options: Pick<ExportOptions, "format" | "parenti">, date = today()): string {
  if (options.format === "xlsx") return `catasto1427-${date}.xlsx`;
  return `catasto1427-${options.parenti ? "parenti" : "fuochi"}-${date}.csv`;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export class ExportService {
  /**
   * Scrive l'export della ricerca sulla risposta. Gli errori di validazione e
   * il tetto di righe arrivano prima di qualunque byte: il client riceve un
   * 400 in JSON, mai un file troncato.
   */
  static async exportFuochi(
    res: Response,
    filters: CompiledFilters,
    sort: { sort_by?: string; order?: string },
    describe: (options: OptionsByKey) => string,
    options: ExportOptions,
  ): Promise<void> {
    const { lang } = options;
    const text = TEXT[lang];
    const max = exportMaxRows();

    const total = await FuocoModel.count(filters.conditions, filters.params, filters.usedTables);
    if (total > max) {
      throw new ValidationError(text.tooMany.replace("{total}", String(total)).replace("{max}", String(max)));
    }

    const [traduttore, filterOptions] = await Promise.all([TraduzioniModel.forLang(lang), CommonModel.getFilters()]);
    const { clause, usedTables: orderTables } = buildOrderBy(sort.sort_by, sort.order);
    const query = {
      conditions: filters.conditions,
      params: filters.params,
      orderByClause: clause,
      usedTables: new Set([...filters.usedTables, ...orderTables]),
    };

    const parentiOnly = options.format === "csv" && options.parenti;
    const metadata: Metadata = [
      [text.source, text.sourceValue],
      [text.date, new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC"],
      [text.search, describe(translateFilters(filterOptions, traduttore) as unknown as OptionsByKey)],
      [text.sort, describeSort(sort.sort_by, sort.order, lang)],
      [text.households, String(total)],
      [text.content, parentiOnly ? text.contentParenti : text.contentFuochi],
      [text.notes, text.missing],
    ];

    const fuochiSheet = (): Sheet => ({
      name: text.fuochi,
      header: columnLabels(FUOCHI_COLUMNS, lang),
      rows: FuocoModel.streamAll(query),
      toCells: (row) => toCells(row, FUOCHI_COLUMNS, traduttore),
    });
    const parentiSheet = (): Sheet => ({
      name: text.parenti,
      header: columnLabels(PARENTI_COLUMNS, lang),
      rows: FuocoModel.streamParenti(query),
      toCells: (row) => toCells(row, PARENTI_COLUMNS, traduttore),
    });

    res.status(200);
    res.set({
      "Content-Type": CONTENT_TYPES[options.format],
      "Content-Disposition": `attachment; filename="${exportFilename(options)}"`,
      "Cache-Control": "no-store",
      "X-Export-Total": String(total),
    });
    // Da qui in poi gli errori non possono più diventare un 400: li gestisce
    // l'error handler chiudendo la connessione. Un client che se ne va a metà
    // non deve far cadere il processo per un errore di scrittura.
    res.on("error", (error) => console.warn("⚠️  Export interrotto:", error.message));

    if (options.format === "csv") {
      // Lo stream va creato solo quando serve: ognuno occupa una connessione del pool.
      await writeCsv(res, metadata, parentiOnly ? parentiSheet() : fuochiSheet(), options.sep);
    } else {
      const sheets = options.parenti ? [fuochiSheet, parentiSheet] : [fuochiSheet];
      await writeXlsx(res, metadata, text.info, sheets);
    }
  }
}
