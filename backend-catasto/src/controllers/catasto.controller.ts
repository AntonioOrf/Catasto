import { Request, Response, NextFunction } from "express";
import { CatastoService } from "../services/catasto.service.js";

export class CatastoController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        page = "1", 
        limit = "50", 
        sort_by = "nome", 
        order = "ASC",
        ...filters 
      } = req.query;

      const result = await CatastoService.getAllFuochi(
        filters as any,
        parseInt(page as string),
        parseInt(limit as string),
        sort_by as string,
        order as string
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSidebar(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        page = "1", 
        limit = "1000", 
        sort_by = "nome", 
        order = "ASC",
        ...filters 
      } = req.query;

      const data = await CatastoService.getSidebar(
        filters as any,
        parseInt(page as string),
        parseInt(limit as string),
        sort_by as string,
        order as string
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getParenti(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await CatastoService.getParenti(parseInt(id));
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
      const { id } = req.params;
      const data = await CatastoService.getManifest(id);
      
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
