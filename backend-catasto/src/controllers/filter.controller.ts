import { Request, Response } from "express";
import { CommonModel } from "../models/common.model.js";
import { parseLang, translateFilters, TraduzioniModel } from "../models/traduzioni.model.js";

export const FilterController = {
  async getFilters(req: Request, res: Response) {
    const { serie, quartiere, piviere } = req.query;
    // La cache di CommonModel resta italiana: la traduzione ne fa una copia.
    const [filters, traduttore] = await Promise.all([
      CommonModel.getFilters({ serie, quartiere, piviere }),
      TraduzioniModel.forLang(parseLang(req.query.lang)),
    ]);
    res.json(translateFilters(filters, traduttore));
  },
};
