import { Request, Response, NextFunction } from "express";
import { CommonModel } from "../models/common.model.js";

export class FilterController {
  static async getFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const serieId = req.query.serie as string;
      const quartiereId = req.query.quartiere as string;
      const piviereId = req.query.piviere as string;

      const filters = await CommonModel.getFilters(serieId, quartiereId, piviereId);
      res.json(filters);
    } catch (error) {
      next(error);
    }
  }
}
