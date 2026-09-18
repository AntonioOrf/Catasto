import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CatastoService } from "../services/catasto.service.js";
import { paginationSchema, parseNumericId, ValidationError } from "../utils/validation.js";
import { astSchema } from "../utils/query-ast-builder.js";

const advancedQuerySchema = z.object({
  ast: astSchema,
  view: z.enum(["table", "sidebar"]).catch("table"),
});

export class CatastoController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort_by, order } = paginationSchema.parse(req.query);
      const { page: _p, limit: _l, sort_by: _s, order: _o, ...filters } = req.query;

      const result = await CatastoService.getAllFuochi(
        filters as any,
        page,
        limit,
        sort_by,
        order
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSidebar(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort_by, order } = paginationSchema.parse({
        limit: "1000",
        ...req.query,
      });
      const { page: _p, limit: _l, sort_by: _s, order: _o, ...filters } = req.query;

      const data = await CatastoService.getSidebar(
        filters as any,
        page,
        limit,
        sort_by,
        order
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST perche' l'AST e' un oggetto annidato: infilarlo in una query string
   * lo renderebbe fragile e soggetto al limite di lunghezza degli URL.
   */
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = advancedQuerySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          `Query non valida: ${parsed.error.issues[0]?.message ?? "formato non riconosciuto"}`
        );
      }

      const { page, limit, sort_by, order } = paginationSchema.parse(req.body ?? {});
      const result = await CatastoService.queryFuochi(
        parsed.data.ast,
        page,
        limit,
        sort_by,
        order,
        parsed.data.view
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getParenti(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseNumericId(req.params.id, "fuoco id");
      const data = await CatastoService.getParenti(parseInt(id, 10));
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getMestieri(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CatastoService.getMestieri();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseNumericId(req.params.id, "archive id");
      const data = await CatastoService.getManifest(id);

      res.setHeader("Content-Type", "application/json");
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
