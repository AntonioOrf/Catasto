import { AST_MAX_TEXT_LENGTH, type SuggestMode } from "@catasto/shared";
import { LIKE_SQL, likePattern, nameTerms } from "./query-builder.js";
import { ValidationError } from "./validation.js";

/** Oltre queste parole la ricerca non diventa più precisa, solo più lenta. */
const MAX_TERMS = 6;

export type SuggestQuery =
  | { mode: "id"; id: number }
  | { mode: "carta"; volume: number; foglio: string | null }
  | { mode: "testo"; terms: string[] };

/** «#10342» o «10342»: il numero del fuoco. */
const ID_RE = /^#?\s*(\d{1,10})$/;
/** «vol. 79 c. 12», «vol 79, c 12r», «volume 79 carta 12v», o solo «vol. 79». */
const CARTA_RE = /^vol(?:ume)?\.?\s*(\d{1,5})(?:\s*,?\s*(?:c|carta|f|foglio)\.?\s*(\d{1,5}\s*[rv]?))?$/i;

/**
 * Legge quello che si scrive nella casella «Trova e aggiungi». Null se non
 * resta niente da cercare (solo spazi, solo «di»).
 */
export function parseSuggestQuery(raw: unknown): SuggestQuery | null {
  if (typeof raw !== "string") throw new ValidationError("Parametro q non valido");
  const q = raw.trim().replace(/\s+/g, " ");
  if (q.length > AST_MAX_TEXT_LENGTH) throw new ValidationError(`Parametro q troppo lungo (max ${AST_MAX_TEXT_LENGTH})`);
  if (!q) return null;

  const id = ID_RE.exec(q);
  if (id) return { mode: "id", id: Number(id[1]) };

  const carta = CARTA_RE.exec(q);
  if (carta) return { mode: "carta", volume: Number(carta[1]), foglio: carta[2] ? carta[2].replace(/\s+/g, "").toLowerCase() : null };

  // Come la ricerca per persona il «di» si scarta; le parole di una lettera
  // («s.» di «s. Felicita») restano solo se non c'è altro.
  const words = nameTerms(q).filter((w) => w.toLowerCase() !== "di");
  if (words.length === 0) return null;
  const long = words.filter((w) => w.replace(/\.$/, "").length > 1);
  return { mode: "testo", terms: (long.length > 0 ? long : words).slice(0, MAX_TERMS) };
}

/** Campi in cui cerca ogni parola: basta che compaia in uno di questi. */
const TEXT_COLUMNS = ["f.Nome_Fuoco", "m.Mestiere", "tp.nome_popolo", "tq.nome_quartiere", "tpi.nome_piviere"];

/** Condizioni SQL della ricerca, con gli alias delle tabelle che usano. */
export function buildSuggestFilters(q: SuggestQuery): { mode: SuggestMode; conditions: string; params: unknown[]; usedTables: Set<string> } {
  if (q.mode === "id") {
    return { mode: q.mode, conditions: "WHERE f.ID_Fuochi = ?", params: [q.id], usedTables: new Set(["f"]) };
  }
  if (q.mode === "carta") {
    // Il volume si confronta come numero («079» e «79» sono lo stesso); una
    // carta senza r/v trova recto e verso.
    let conditions = "WHERE CAST(f.Volume_Fuoco AS UNSIGNED) = ?";
    const params: unknown[] = [q.volume];
    if (q.foglio) {
      const fogli = /[rv]$/.test(q.foglio) ? [q.foglio] : [q.foglio, `${q.foglio}r`, `${q.foglio}v`];
      conditions += ` AND LOWER(TRIM(f.Foglio_Fuoco)) IN (${fogli.map(() => "?").join(",")})`;
      params.push(...fogli);
    }
    return { mode: q.mode, conditions, params, usedTables: new Set(["f"]) };
  }
  const any = `(${TEXT_COLUMNS.map((c) => `${c} ${LIKE_SQL}`).join(" OR ")})`;
  return {
    mode: q.mode,
    conditions: `WHERE ${q.terms.map(() => any).join(" AND ")}`,
    params: q.terms.flatMap((t) => TEXT_COLUMNS.map(() => likePattern(t))),
    usedTables: new Set(["m", "tq", "tp", "tpi"]),
  };
}
