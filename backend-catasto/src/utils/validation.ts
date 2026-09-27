import { z } from "zod";

// Pagination is a UX control, not a resource identifier: an out-of-range or
// malformed value should fall back to a sane default instead of erroring.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  limit: z.coerce.number().int().min(1).max(2_000).catch(50),
  sort_by: z.coerce.string().max(50).catch("nome"),
  order: z.coerce.string().max(10).catch("ASC"),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** Chiavi di paginazione/ordinamento: tutto il resto della query string sono filtri. */
const PAGINATION_KEYS = new Set(Object.keys(paginationSchema.shape));

export function splitPaginationQuery(
  query: Record<string, unknown>,
  defaults: Partial<Record<keyof Pagination, string>> = {},
): { pagination: Pagination; filters: Record<string, unknown> } {
  const filters = Object.fromEntries(
    Object.entries(query).filter(([key]) => !PAGINATION_KEYS.has(key)),
  );
  return { pagination: paginationSchema.parse({ ...defaults, ...query }), filters };
}

// A :id path param identifies a specific resource - there's no sane default
// for "which one", so an invalid value is rejected outright.
export const numericIdSchema = z.coerce
  .string()
  .regex(/^\d{1,10}$/, "id must be numeric");

/**
 * Errore con status HTTP esplicito. L'error handler mostra il messaggio al
 * client solo per i 4xx: qui vanno testi scritti per l'utente, mai dettagli
 * interni.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export function parseNumericId(id: unknown, label = "id"): number {
  const result = numericIdSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError(`Invalid ${label}: must be numeric`);
  }
  return Number(result.data);
}
