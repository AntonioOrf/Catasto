import { z } from "zod";

// Pagination is a UX control, not a resource identifier: an out-of-range or
// malformed value should fall back to a sane default instead of erroring.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  limit: z.coerce.number().int().min(1).max(2_000).catch(50),
  sort_by: z.coerce.string().max(50).catch("nome"),
  order: z.coerce.string().max(10).catch("ASC"),
});

// A :id path param identifies a specific resource - there's no sane default
// for "which one", so an invalid value is rejected outright.
export const numericIdSchema = z.coerce
  .string()
  .regex(/^\d+$/, "id must be numeric");

export class ValidationError extends Error {
  status = 400;
}

export function parseNumericId(id: unknown, label = "id"): string {
  const result = numericIdSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError(`Invalid ${label}: must be numeric`);
  }
  return result.data;
}
