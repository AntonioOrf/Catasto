import { useMemo } from "react";
import { SELECTION_MAX_FUOCHI } from "@catasto/shared";
import { useCompare } from "../compare/compare-context";
import { normalizeIds } from "../compare/lib/compare-selection";
import { setCollectionIds } from "./collections";
import { useCollections } from "./useCollections";

/** Dove vanno i fuochi di «Trova e aggiungi» e delle caselle del Banco. */
export type TargetKey = { kind: "selezione" } | { kind: "raccolta"; id: string };

export const SELEZIONE: TargetKey = { kind: "selezione" };

export interface AddTarget {
  key: TargetKey;
  /** Nome della raccolta; null per la selezione. */
  nome: string | null;
  ids: number[];
  full: boolean;
  has: (id: number) => boolean;
  /** Aggiunge e restituisce gli id davvero entrati (non già presenti, nel limite). */
  add: (ids: readonly number[]) => number[];
  remove: (ids: readonly number[]) => void;
  /** Rimette la lista di prima, ordine compreso: è l'«Annulla». */
  restore: (ids: readonly number[]) => void;
}

/** Nuovi id che entrano davvero: senza doppioni e nel limite della selezione. */
export function idsToAdd(current: readonly number[], more: readonly number[]): number[] {
  const next = normalizeIds([...current, ...more]);
  return next.slice(current.length);
}

/**
 * La destinazione scelta, con le stesse operazioni per la selezione (condivisa
 * con la Consultazione) e per una raccolta salvata. Una raccolta eliminata
 * altrove fa tornare alla selezione.
 */
export function useAddTarget(key: TargetKey): AddTarget {
  const compare = useCompare();
  const collections = useCollections();
  const raccolta = key.kind === "raccolta" ? collections.find((r) => r.id === key.id) : undefined;

  return useMemo<AddTarget>(() => {
    if (!raccolta) {
      const ids = compare.ids;
      return {
        key: SELEZIONE,
        nome: null,
        ids,
        full: compare.full,
        has: (id) => ids.includes(id),
        add: (more) => {
          const added = idsToAdd(ids, more);
          if (added.length > 0) compare.add(added);
          return added;
        },
        remove: (gone) => gone.forEach((id) => compare.remove(id)),
        restore: (prev) => compare.replace([...prev]),
      };
    }
    const ids = raccolta.ids;
    return {
      key: { kind: "raccolta", id: raccolta.id },
      nome: raccolta.nome,
      ids,
      full: ids.length >= SELECTION_MAX_FUOCHI,
      has: (id) => ids.includes(id),
      add: (more) => {
        const added = idsToAdd(ids, more);
        if (added.length > 0) setCollectionIds(raccolta.id, [...ids, ...added]);
        return added;
      },
      remove: (gone) => setCollectionIds(raccolta.id, ids.filter((id) => !gone.includes(id))),
      restore: (prev) => setCollectionIds(raccolta.id, prev),
    };
  }, [raccolta, compare]);
}
