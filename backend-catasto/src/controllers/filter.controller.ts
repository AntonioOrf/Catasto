import { Request, Response, NextFunction } from "express";
import { CommonModel } from "../models/common.model.js";

export class FilterController {
  static async getFilters(_req: Request, res: Response, next: NextFunction) {
    try {
      const filters = await CommonModel.getFilters();
      res.json(filters);
    } catch (error) {
      next(error);
    }
  }
}
