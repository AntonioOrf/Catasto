import type { QueryGroup, SavedQuery } from "@catasto/shared";
import { isQueryGroup } from "./query-ast-validate";

/**
 * Preset di ricerca salvati localmente. Nessun account, nessun backend: sono
 * dati dell'utente sul suo dispositivo.
 *
 * La chiave è versionata: quando la forma dell'AST cambierà, i preset della
 * versione precedente vanno migrati o ignorati esplicitamente, non letti alla
 * cieca con una forma che non esiste più.
 */
export const SAVED_QUERIES_STORAGE_KEY = "catasto.savedQueries.v1";

const MAX_SAVED = 50;

// Il localStorage è modificabile a mano: un preset con AST malformato va
// scartato qui, altrimenti romperebbe il render quando viene caricato.
const isSavedQuery = (value: unknown): value is SavedQuery => {
  if (typeof value !== "object" || value === null) return false;
  const q = value as Record<string, unknown>;
  return typeof q.id === "string" && typeof q.nome === "string" && isQueryGroup(q.ast);
};

/**
 * crypto.randomUUID esiste solo nei contesti sicuri (https, localhost): su
 * http://<ip> serve un fallback. L'id è solo una chiave locale, non un segreto.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // alcuni browser espongono la funzione ma la rifiutano fuori da https
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadSavedQueries(): SavedQuery[] {
  try {
    const raw = localStorage.getItem(SAVED_QUERIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedQuery) : [];
  } catch {
    // localStorage può essere disabilitato (modalità privata, policy aziendali):
    // la ricerca avanzata deve continuare a funzionare senza i preset.
    return [];
  }
}

function persist(queries: SavedQuery[]): SavedQuery[] {
  try {
    localStorage.setItem(SAVED_QUERIES_STORAGE_KEY, JSON.stringify(queries));
  } catch (error) {
    console.error("Impossibile salvare i filtri in locale", error);
  }
  return queries;
}

export function saveQuery(nome: string, ast: QueryGroup): SavedQuery[] {
  const queries = loadSavedQueries();
  const trimmed = nome.trim();

  const entry: SavedQuery = {
    id: generateId(),
    nome: trimmed,
    ast,
    createdAt: new Date().toISOString(),
  };

  // Stesso nome = sovrascrittura: l'utente si aspetta di aggiornare il preset,
  // non di ritrovarsi due voci identiche nella lista.
  const next = [entry, ...queries.filter((q) => q.nome !== trimmed)].slice(0, MAX_SAVED);
  return persist(next);
}

export function deleteQuery(id: string): SavedQuery[] {
  return persist(loadSavedQueries().filter((q) => q.id !== id));
}

/** Import di un preset ricevuto da un altro utente (link condiviso). */
export function importQuery(nome: string, ast: QueryGroup): SavedQuery[] {
  return saveQuery(nome, ast);
}
