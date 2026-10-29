import { COMPARE_MAX_FUOCHI } from "@catasto/shared";

/**
 * Selezione dei fuochi da confrontare: una lista di id, al massimo
 * COMPARE_MAX_FUOCHI, nell'ordine in cui sono stati scelti (il primo è il
 * termine di paragone delle differenze). Vive in sessionStorage per la durata
 * della scheda del browser e si condivide con un link `#confronta=12,345`.
 */

export const COMPARE_STORAGE_KEY = "catasto.compare.v1";
const FRAGMENT_KEY = "confronta";

/** Id validi (interi positivi), senza duplicati e nel limite; il resto si scarta senza errori. */
export function normalizeIds(values: readonly unknown[]): number[] {
  const ids: number[] = [];
  for (const value of values) {
    const n = typeof value === "number" ? value : typeof value === "string" && /^\d{1,10}$/.test(value.trim()) ? Number(value) : NaN;
    if (Number.isSafeInteger(n) && n > 0 && !ids.includes(n)) ids.push(n);
    if (ids.length === COMPARE_MAX_FUOCHI) break;
  }
  return ids;
}

/** `"12,345,678"` → `[12, 345, 678]`, ignorando le parti non valide. */
export const parseIdsParam = (value: string): number[] => normalizeIds(value.split(","));

export const serializeIds = (ids: readonly number[]): string => normalizeIds(ids).join(",");

/** Aggiunge o toglie un id; oltre il massimo la selezione non cambia. */
export function toggleId(ids: readonly number[], id: number): number[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= COMPARE_MAX_FUOCHI ? [...ids] : [...ids, id];
}

/** Id del confronto nel fragment (`#confronta=…`), o null se non c'è. */
export function readCompareFromHash(hash: string): number[] | null {
  const fragment = hash.replace(/^#/, "");
  if (!fragment) return null;
  const value = new URLSearchParams(fragment).get(FRAGMENT_KEY);
  return value === null ? null : parseIdsParam(value);
}

/** Nel fragment, come i link `#q=`: gli id non finiscono nei log dei server. */
export function buildCompareUrl(ids: readonly number[], location: Pick<Location, "origin" | "pathname" | "search"> = window.location): string {
  return `${location.origin}${location.pathname}${location.search}#${FRAGMENT_KEY}=${serializeIds(ids)}`;
}

// sessionStorage può lanciare (storage bloccato, modalità private): la
// selezione resta valida in memoria anche senza.
export function loadSelection(): number[] {
  try {
    const raw = sessionStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalizeIds(parsed) : [];
  } catch {
    return [];
  }
}

export function storeSelection(ids: readonly number[]): void {
  try {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // selezione non persistita: resta valida finché la pagina è aperta
  }
}
