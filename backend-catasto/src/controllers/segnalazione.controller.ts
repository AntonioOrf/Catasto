import { Request, Response } from "express";
import { z } from "zod";
import {
  REPORTABLE_FIELD_KEYS,
  SEGNALAZIONE_LIMITS,
  STATI_SEGNALAZIONE,
  TIPI_SEGNALAZIONE,
} from "@catasto/shared";
import { SegnalazioneService } from "../services/segnalazione.service.js";
import { HttpError, paginationSchema, parseNumericId, ValidationError } from "../utils/validation.js";
import { ModerazioneToken } from "../utils/moderazione-token.js";
import { ModerazionePage } from "../views/moderazione.page.js";

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

/**
 * Le rotte dei link si aprono in un browser dall'email: gli errori diventano
 * una pagina HTML leggibile invece del JSON dell'error handler.
 */
const renderHtml = async (res: Response, work: () => Promise<string>) => {
  // Il token è nell'URL: niente cache né indicizzazione.
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex");
  try {
    res.type("html").send(await work());
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error("❌ Error:", (err as Error)?.stack ?? err);
    const message = status >= 500 ? "Errore interno, riprova più tardi." : (err as Error).message;
    res.status(status).type("html").send(ModerazionePage.errore(status, message));
  }
};

export const SegnalazioneController = {
  async create(req: Request, res: Response) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Segnalazione non valida");
    }

    const id = await SegnalazioneService.create(parsed.data, req.ip);

    // id === null è l'honeypot: risposta identica a quella di successo, così un
    // bot non può distinguere i campi trappola da quelli reali.
    res.status(201).json({ id, stato: "nuova" });
  },

  async list(req: Request, res: Response) {
    const { page, limit } = paginationSchema.parse(req.query);
    const stato = z.enum(STATI_SEGNALAZIONE).optional().catch(undefined).parse(req.query.stato);

    const data = await SegnalazioneService.list(stato, page, limit);
    res.json({ data });
  },

  async updateStato(req: Request, res: Response) {
    const id = parseNumericId(req.params.id, "segnalazione id");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Stato non valido");
    }

    const data = await SegnalazioneService.updateStato(id, parsed.data.stato);
    res.json({ data });
  },

  /** GET dal link dell'email: mostra la proposta e chiede conferma, senza modificare nulla. */
  async linkConferma(req: Request, res: Response) {
    await renderHtml(res, async () => {
      const token = String(req.query.t ?? "");
      const { id, azione } = ModerazioneToken.verify(token);
      const segnalazione = await SegnalazioneService.findById(id);
      return ModerazionePage.conferma(
        segnalazione,
        azione,
        token,
        SegnalazioneService.isDaModerare(segnalazione.stato),
      );
    });
  },

  /** POST dal pulsante di conferma: applica la decisione firmata nel token. */
  async linkApplica(req: Request, res: Response) {
    await renderHtml(res, async () => {
      const { id, azione } = ModerazioneToken.verify(req.body?.t);
      await SegnalazioneService.updateStato(id, azione, { soloSeDaModerare: true });
      return ModerazionePage.esito(await SegnalazioneService.findById(id));
    });
  },
};
