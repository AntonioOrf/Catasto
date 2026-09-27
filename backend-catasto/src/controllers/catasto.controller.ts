import { Request, Response } from "express";
import { z } from "zod";
import { CatastoService, type FuochiView } from "../services/catasto.service.js";
import { paginationSchema, parseNumericId, splitPaginationQuery, ValidationError } from "../utils/validation.js";
import { astSchema } from "../utils/query-ast-builder.js";
import { parseLang } from "../models/traduzioni.model.js";

const advancedQuerySchema = z.object({
  ast: astSchema,
  view: z.enum(["table", "sidebar"]).catch("table"),
});

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
