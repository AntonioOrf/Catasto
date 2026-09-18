import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  REPORTABLE_FIELD_KEYS,
  SEGNALAZIONE_LIMITS,
  STATI_SEGNALAZIONE,
  TIPI_SEGNALAZIONE,
} from "@catasto/shared";
import { SegnalazioneService } from "../services/segnalazione.service.js";
import { paginationSchema, parseNumericId, ValidationError } from "../utils/validation.js";

const trimmedText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const createSchema = z
  .object({
    id_fuoco: z.number().int().positive().nullable().default(null),
    tipo: z.enum(TIPI_SEGNALAZIONE),
    // `campo` non è testo libero: deve essere una chiave del registry, così la
    // moderazione sa esattamente quale colonna è contestata.
    campo: z
      .enum(REPORTABLE_FIELD_KEYS as [string, ...string[]])
      .nullable()
      .optional(),
    valore_attuale: trimmedText(SEGNALAZIONE_LIMITS.valore),
    valore_proposto: trimmedText(SEGNALAZIONE_LIMITS.valore),
    note: trimmedText(SEGNALAZIONE_LIMITS.note),
    email: z.string().trim().email().max(SEGNALAZIONE_LIMITS.email).nullable().optional(),
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "dato_errato" && !data.campo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["campo"],
        message: "Indica quale campo è errato",
      });
    }
    if (data.tipo === "segnatura" && !data.valore_proposto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valore_proposto"],
        message: "Indica la segnatura corretta",
      });
    }
    if (data.tipo !== "segnatura" && !data.valore_proposto && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Descrivi il problema o proponi un valore corretto",
      });
    }
  });

const updateSchema = z.object({ stato: z.enum(STATI_SEGNALAZIONE) });

export class SegnalazioneController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message ?? "Segnalazione non valida",
        );
      }

      const id = await SegnalazioneService.create(parsed.data, req.ip);

      // id === -1 è l'honeypot: risposta identica a quella di successo, così un
      // bot non può distinguere i campi trappola da quelli reali.
      res.status(201).json({ id: id > 0 ? id : null, stato: "nuova" });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const stato = z.enum(STATI_SEGNALAZIONE).optional().catch(undefined).parse(req.query.stato);

      const data = await SegnalazioneService.list(stato, page, limit);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async updateStato(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseNumericId(req.params.id, "segnalazione id");
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Stato non valido");
      }

      const data = await SegnalazioneService.updateStato(Number(id), parsed.data.stato);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
}
