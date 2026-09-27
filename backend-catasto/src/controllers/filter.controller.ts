import { Request, Response } from "express";
import { CommonModel } from "../models/common.model.js";

export const FilterController = {
  async getFilters(req: Request, res: Response) {
    const { serie, quartiere, piviere } = req.query;
    res.json(await CommonModel.getFilters({ serie, quartiere, piviere }));
  },
};
