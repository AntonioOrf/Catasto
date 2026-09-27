import pool from "../config/db.js";
import type { FilterOption, FilterOptions } from "@catasto/shared";

/**
 * Traduzioni delle etichette delle tabelle di lookup del dump (mestieri,
 * casa, parentela, ...), lette da `traduzioni_lookup` (migrazione 002).
 *
 * La chiave e' l'etichetta italiana e non l'id: la tabella sta fuori dal dump,
 * sopravvive ai reimport (che fanno DROP TABLE e possono rinumerare) e si
 * popola senza conoscere gli id. Luoghi e nomi di persona sono nomi propri e
 * non si traducono. Un valore senza traduzione resta in italiano.
 */

export type Lingua = "it" | "en";

/** Tabelle del dump con etichette traducibili, e colonna che le contiene. */
export const LOOKUP_TABLES = [
  { tabella: "mestieri", colonna: "Mestiere" },
  { tabella: "bestiame", colonna: "Bestiame" },
  { tabella: "rapporto_mestiere", colonna: "RapportoLavoro" },
  { tabella: "immigrazione", colonna: "Immigrazione" },
  { tabella: "casa", colonna: "Casa" },
  { tabella: "particolarita_fuoco", colonna: "Particolarita" },
  { tabella: "particolarita_parenti", colonna: "ParticolaritaParenti" },
  { tabella: "rapporti_parentela", colonna: "Parentela" },
  { tabella: "sesso_parenti", colonna: "Sesso_Parenti" },
  { tabella: "statocivile_parenti", colonna: "StatoCivle" },
] as const;

export type TabellaLookup = (typeof LOOKUP_TABLES)[number]["tabella"];

export const TABELLE_LOOKUP: ReadonlySet<string> = new Set(LOOKUP_TABLES.map((t) => t.tabella));

/**
 * Lingua richiesta con `?lang=`: e' riconosciuto solo `en`, qualunque altro
 * valore (assente, ripetuto, sconosciuto) e' italiano. Mai un errore: la
 * lingua e' una preferenza di visualizzazione, non un filtro.
 */
export function parseLang(value: unknown): Lingua {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim().toLowerCase() === "en" ? "en" : "it";
}

/**
 * Forma di confronto delle etichette: senza spazi ai bordi (e con quelli
 * interni compattati), minuscola e senza accenti. Allinea il confronto in JS a
 * quello della collation utf8mb4_unicode_ci della tabella.
 */
export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export type MappaTraduzioni = ReadonlyMap<string, ReadonlyMap<string, string>>;

export class Traduttore {
  constructor(
    readonly lingua: Lingua,
    private readonly mappe: MappaTraduzioni = new Map(),
  ) {}

  /** Nessuna traduzione caricata: l'italiano, o la tabella mancante. */
  get vuoto(): boolean {
    return this.mappe.size === 0;
  }

  /** Traduzione del valore, o il valore stesso se manca (anche null/undefined). */
  t<T extends string | null | undefined>(tabella: TabellaLookup, value: T): T | string {
    if (typeof value !== "string" || value === "") return value;
    return this.mappe.get(tabella)?.get(normalizeLabel(value)) ?? value;
  }

  /**
   * Traduce in place i campi indicati di righe appena lette dal DB. Da non
   * usare su oggetti in cache: per quelli c'e' `translateFilters`.
   */
  translateRows<R extends object>(rows: R[], campi: Partial<Record<keyof R, TabellaLookup>>): R[] {
    if (this.vuoto) return rows;
    const entries = Object.entries(campi) as [keyof R, TabellaLookup][];
    for (const row of rows) {
      for (const [campo, tabella] of entries) {
        const value = row[campo];
        if (typeof value === "string") (row as Record<keyof R, unknown>)[campo] = this.t(tabella, value);
      }
    }
    return rows;
  }
}

const ITALIANO = new Traduttore("it");

/** Opzioni statiche dei filtri con etichetta traducibile. */
const FILTER_TABLES: Partial<Record<keyof FilterOptions, TabellaLookup>> = {
  bestiame: "bestiame",
  rapporto: "rapporto_mestiere",
  immigrazione: "immigrazione",
  mestieri: "mestieri",
  particolaritaParente: "particolarita_parenti",
  casa: "casa",
};

/** Liste che la query ordina per etichetta: tradotte vanno riordinate. */
const FILTER_SORTED = new Set<keyof FilterOptions>(["mestieri", "casa", "particolaritaParente"]);

/**
 * Copia delle opzioni dei filtri con le etichette tradotte. Non modifica mai
 * l'oggetto ricevuto, che e' la copia italiana in cache in CommonModel. Id e
 * semantica restano identici: cambiano solo le etichette.
 */
export function translateFilters(filters: FilterOptions, traduttore: Traduttore): FilterOptions {
  if (traduttore.vuoto) return filters;
  const out: FilterOptions = { ...filters };
  const collator = new Intl.Collator(traduttore.lingua, { sensitivity: "base" });
  for (const [key, tabella] of Object.entries(FILTER_TABLES) as [keyof FilterOptions, TabellaLookup][]) {
    const options = filters[key];
    if (!Array.isArray(options)) continue;
    const translated: FilterOption[] = options.map((o) => ({ ...o, label: traduttore.t(tabella, o.label) }));
    if (FILTER_SORTED.has(key)) translated.sort((a, b) => collator.compare(a.label ?? "", b.label ?? ""));
    out[key] = translated;
  }
  return out;
}

/** Le traduzioni cambiano solo per import redazionale: dieci minuti bastano. */
export const TRADUZIONI_TTL_MS = 10 * 60 * 1000;

export async function loadMappe(lingua: Lingua): Promise<MappaTraduzioni> {
  try {
    const [rows]: any = await pool.query(
      "SELECT tabella, valore_it, valore FROM traduzioni_lookup WHERE lingua = ?",
      [lingua],
    );
    const mappe = new Map<string, Map<string, string>>();
    for (const row of rows as { tabella: string; valore_it: string; valore: string | null }[]) {
      if (!row.valore || !row.valore.trim()) continue;
      let mappa = mappe.get(row.tabella);
      if (!mappa) mappe.set(row.tabella, (mappa = new Map()));
      mappa.set(normalizeLabel(row.valore_it), row.valore.trim());
    }
    return mappe;
  } catch (error) {
    // Migrazione non ancora applicata: il sito resta in italiano, non va in 500.
    if ((error as { code?: string })?.code === "ER_NO_SUCH_TABLE") return new Map();
    throw error;
  }
}

export class TraduzioniModel {
  // Promise e non valore, come in CommonModel: le richieste concorrenti a
  // freddo condividono un solo caricamento.
  private static cache = new Map<Lingua, { promise: Promise<Traduttore>; expiresAt: number }>();

  /** Non rifiuta mai: in caso di problemi restituisce un traduttore vuoto. */
  static forLang(lingua: Lingua): Promise<Traduttore> {
    if (lingua === "it") return Promise.resolve(ITALIANO);

    const cached = this.cache.get(lingua);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;

    const promise = loadMappe(lingua)
      .then((mappe) => new Traduttore(lingua, mappe))
      .catch((error: unknown) => {
        // Un errore transitorio del DB non deve restare in cache, ne' far
        // fallire la risposta: le etichette sono cosmetiche, si ripiega
        // sull'italiano e si riprova alla richiesta successiva.
        if (this.cache.get(lingua)?.promise === promise) this.cache.delete(lingua);
        console.error("Traduzioni non disponibili:", (error as Error)?.message ?? error);
        return new Traduttore(lingua);
      });
    this.cache.set(lingua, { promise, expiresAt: Date.now() + TRADUZIONI_TTL_MS });
    return promise;
  }

  /** Per i test e per gli script di import. */
  static clearCache(): void {
    this.cache.clear();
  }
}
