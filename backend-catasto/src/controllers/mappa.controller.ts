import { Request, Response } from "express";
import { z } from "zod";
import { MappaService } from "../services/mappa.service.js";
import { astSchema } from "../utils/query-ast-builder.js";
import { splitPaginationQuery, ValidationError } from "../utils/validation.js";

const astBodySchema = z.object({ ast: astSchema });

export const MappaController = {
  /** GET /api/mappa/luoghi: un punto per luogo, sugli stessi filtri della ricerca semplice. */
  async luoghi(req: Request, res: Response) {
    const { lang: _lang, ...query } = req.query;
    // Paginazione e ordinamento non cambiano i luoghi.
    const { filters } = splitPaginationQuery(query);
    res.json(await MappaService.searchLuoghi(filters));
  },

  /** POST /api/mappa/query: come sopra, sull'AST della ricerca avanzata. */
  async query(req: Request, res: Response) {
    const parsed = astBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(`Query non valida: ${parsed.error.issues[0]?.message ?? "formato non riconosciuto"}`);
    }
    res.json(await MappaService.queryLuoghi(parsed.data.ast));
  },
};
