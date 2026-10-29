import { SELECTION_MAX_FUOCHI } from "@catasto/shared";
import { generateId } from "../catasto/lib/saved-queries";
import { normalizeIds } from "../compare/lib/compare-selection";

/**
 * Raccolte del Banco di lavoro: insiemi di fuochi scelti a mano con le
 * caselle, salvati sul dispositivo come le query (`saved-queries.ts`).
 * Nessun account e nessun backend: si condividono con un link che porta
 * nome e id nel fragment (`#raccolta=…`), quindi non finiscono nei log.
 *
 * La chiave è versionata: se la forma cambierà, le raccolte vecchie vanno
 * migrate o ignorate esplicitamente.
 */
export const COLLECTIONS_STORAGE_KEY = "catasto.raccolte.v1";

const MAX_COLLECTIONS = 50;
const MAX_NAME = 60;
const FRAGMENT_KEY = "raccolta";

export interface Raccolta {
  id: string;
  nome: string;
  /** Id dei fuochi, nell'ordine in cui sono stati aggiunti. */
  ids: number[];
  createdAt: string;
}

const cleanName = (nome: string) => nome.trim().slice(0, MAX_NAME);

// Il localStorage è modificabile a mano: una voce malformata si scarta qui.
function toRaccolta(value: unknown): Raccolta | null {
  if (typeof value !== "object" || value === null) return null;
  const r = value as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.nome !== "string" || !cleanName(r.nome) || !Array.isArray(r.ids)) return null;
  return {
    id: r.id,
    nome: cleanName(r.nome),
    ids: normalizeIds(r.ids),
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
  };
}

export function loadCollections(): Raccolta[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLECTIONS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.flatMap((v) => toRaccolta(v) ?? []) : [];
  } catch {
    // localStorage disabilitato o alterato: il Banco funziona lo stesso, senza raccolte.
    return [];
  }
}

/** Evento sulla finestra a ogni modifica: la barra della selezione e il Banco restano allineati. */
export const COLLECTIONS_EVENT = "catasto:raccolte";

function persist(collections: Raccolta[]): Raccolta[] {
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  } catch {
    // non salvate: restano valide finché la pagina è aperta
  }
  window.dispatchEvent(new CustomEvent(COLLECTIONS_EVENT, { detail: collections }));
  return collections;
}

/**
 * Aggiunge i fuochi alla raccolta con quel nome, creandola se non c'è. Gli id
 * già presenti non si ripetono; oltre SELECTION_MAX_FUOCHI non si aggiunge.
 * La raccolta toccata va in cima alla lista.
 */
export function addToCollection(nome: string, ids: readonly number[]): Raccolta[] {
  const name = cleanName(nome);
  if (!name) return loadCollections();
  const all = loadCollections();
  const existing = all.find((r) => r.nome === name);
  const entry: Raccolta = existing
    ? { ...existing, ids: normalizeIds([...existing.ids, ...ids]) }
    : { id: generateId(), nome: name, ids: normalizeIds(ids), createdAt: new Date().toISOString() };
  return persist([entry, ...all.filter((r) => r !== existing)].slice(0, MAX_COLLECTIONS));
}

export function removeFromCollection(id: string, fuocoId: number): Raccolta[] {
  return persist(loadCollections().map((r) => (r.id === id ? { ...r, ids: r.ids.filter((x) => x !== fuocoId) } : r)));
}

export function deleteCollection(id: string): Raccolta[] {
  return persist(loadCollections().filter((r) => r.id !== id));
}

/** Link della raccolta: `#raccolta=<nome>:<id,id,…>`, leggibile e senza codifiche opache. */
export function buildCollectionUrl(
  raccolta: Pick<Raccolta, "nome" | "ids">,
  location: Pick<Location, "origin"> = window.location,
): string {
  const params = new URLSearchParams({ [FRAGMENT_KEY]: `${raccolta.nome}:${raccolta.ids.join(",")}` });
  return `${location.origin}/banco#${params}`;
}

/** Raccolta nel fragment, o null se manca o è illeggibile. Il limite degli id vale anche qui. */
export function readCollectionFromHash(hash: string): Pick<Raccolta, "nome" | "ids"> | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get(FRAGMENT_KEY);
  if (!value) return null;
  const sep = value.lastIndexOf(":");
  if (sep <= 0) return null;
  const nome = cleanName(value.slice(0, sep));
  const ids = normalizeIds(value.slice(sep + 1).split(",")).slice(0, SELECTION_MAX_FUOCHI);
  return nome && ids.length > 0 ? { nome, ids } : null;
}
