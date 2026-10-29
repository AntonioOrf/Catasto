import { Request, Response } from "express";
import { z } from "zod";
import { CatastoService, type FuochiView } from "../services/catasto.service.js";
import { paginationSchema, parseNumericId, splitPaginationQuery, ValidationError } from "../utils/validation.js";
import { astSchema, buildQueryFromAst } from "../utils/query-ast-builder.js";
import { buildQuery } from "../utils/query-builder.js";
import { parseLang } from "../models/traduzioni.model.js";
import { describeQuery } from "@catasto/shared";
import { ExportService, type ExportOptions } from "../services/export.service.js";
import { describeSimpleFilters } from "../utils/describe-filters.js";
import { StatsService } from "../services/stats.service.js";

const advancedQuerySchema = z.object({
  ast: astSchema,
  view: z.enum(["table", "sidebar"]).catch("table"),
});

/**
 * Opzioni dell'export, uguali in query string (GET) e nel body (POST).
 * `parenti` accetta booleani o "true"/"1"; `sep` anche per nome, perché il
 * punto e virgola in una query string va codificato.
 */
const exportOptionsSchema = z.object({
  format: z.enum(["csv", "xlsx"], { message: "Formato non valido: usa csv o xlsx" }).default("csv"),
  parenti: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .default(false)
    .transform((v) => v === true || v === "true" || v === "1"),
  sep: z
    .enum([",", ";", "comma", "semicolon"], { message: "Separatore non valido: usa comma o semicolon" })
    .default(",")
    .transform((v) => (v === ";" || v === "semicolon" ? ";" : ",")),
});

const parseExportOptions = (input: unknown, lang: unknown): ExportOptions => {
  const parsed = exportOptionsSchema.safeParse(input ?? {});
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? "Opzioni di export non valide");
  return { ...parsed.data, lang: parseLang(lang) };
};

/** Body con il solo AST: export e statistiche della ricerca avanzata. */
const advancedExportSchema = z.object({ ast: astSchema });

/** L'indice laterale carica blocchi grandi: il default di pagina è diverso dalla tabella. */
const SIDEBAR_DEFAULT_LIMIT = "1000";

const search = (view: FuochiView) => async (req: Request, res: Response) => {
  // `lang` sceglie la lingua delle etichette, non e' un filtro.
  const { lang, ...query } = req.query;
  const { pagination, filters } = splitPaginationQuery(
    query,
    view === "sidebar" ? { limit: SIDEBAR_DEFAULT_LIMIT } : {},
  );
  res.json(await CatastoService.searchFuochi(filters, pagination, view, parseLang(lang)));
};

export const CatastoController = {
  getAll: search("table"),

  getSidebar: search("sidebar"),

  /**
   * POST perche' l'AST e' un oggetto annidato: infilarlo in una query string
   * lo renderebbe fragile e soggetto al limite di lunghezza degli URL.
   */
  async query(req: Request, res: Response) {
    const parsed = advancedQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        `Query non valida: ${parsed.error.issues[0]?.message ?? "formato non riconosciuto"}`,
      );
    }

    const pagination = paginationSchema.parse(req.body ?? {});
    res.json(
      await CatastoService.queryFuochi(parsed.data.ast, pagination, parsed.data.view, parseLang(req.query.lang)),
    );
  },

  /**
   * GET /api/catasto/export: stessi filtri e ordinamento della tabella, tutte
   * le pagine. Paginazione ignorata.
   */
  async exportSimple(req: Request, res: Response) {
    const { lang, format, parenti, sep, ...query } = req.query;
    const options = parseExportOptions({ format, parenti, sep }, lang);
    const { pagination, filters } = splitPaginationQuery(query);
    const compiled = buildQuery(filters);
    await ExportService.exportFuochi(
      res,
      compiled,
      pagination,
      (filterOptions) => describeSimpleFilters(filters, filterOptions, options.lang),
      options,
    );
  },

  /** POST /api/catasto/query/export: stesso AST della ricerca avanzata. */
  async exportAdvanced(req: Request, res: Response) {
    const parsed = advancedExportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        `Query non valida: ${parsed.error.issues[0]?.message ?? "formato non riconosciuto"}`,
      );
    }
    const { format, parenti, sep } = req.body;
    const options = parseExportOptions({ format, parenti, sep }, req.query.lang);
    const pagination = paginationSchema.parse(req.body ?? {});
    const ast = parsed.data.ast;
    await ExportService.exportFuochi(
      res,
      buildQueryFromAst(ast),
      pagination,
      (filterOptions) => describeQuery(ast, filterOptions, options.lang),
      options,
    );
  },

  /** GET /api/catasto/stats: aggregati sugli stessi filtri della tabella. */
  async stats(req: Request, res: Response) {
    const { lang, ...query } = req.query;
    // Paginazione e ordinamento non cambiano gli aggregati.
    const { filters } = splitPaginationQuery(query);
    res.json(await StatsService.searchStats(filters, parseLang(lang)));
  },

  /** POST /api/catasto/query/stats: aggregati sull'AST della ricerca avanzata. */
  async queryStats(req: Request, res: Response) {
    const parsed = advancedExportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        `Query non valida: ${parsed.error.issues[0]?.message ?? "formato non riconosciuto"}`,
      );
    }
    res.json(await StatsService.queryStats(parsed.data.ast, parseLang(req.query.lang)));
  },

  async getParenti(req: Request, res: Response) {
    const id = parseNumericId(req.params.id, "fuoco id");
    res.json(await CatastoService.getParenti(id, parseLang(req.query.lang)));
  },

  async getMestieri(req: Request, res: Response) {
    res.json(await CatastoService.getMestieri(parseLang(req.query.lang)));
  },

  async getManifest(req: Request, res: Response) {
    const id = parseNumericId(req.params.id, "archive id");
    // Il contenuto non cambia: anche il browser può tenerlo in cache.
    res.set("Cache-Control", "public, max-age=86400");
    res.json(await CatastoService.getManifest(id));
  },
};
