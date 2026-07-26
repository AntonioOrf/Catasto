import { Request, Response, NextFunction } from "express";
import { CatastoService } from "../services/catasto.service.js";
import { paginationSchema, parseNumericId } from "../utils/validation.js";

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
