import { createContext, useContext } from "react";
import type { Fuoco } from "@catasto/shared";

export interface CompareState {
  ids: number[];
  /** Dati dei fuochi selezionati, nell'ordine della selezione (quelli già caricati). */
  fuochi: Fuoco[];
  loading: boolean;
  error: string | null;
  /** Id tolti perché inesistenti (link condiviso con id non validi). */
  removedCount: number;
  /** Selezione al limite (SELECTION_MAX_FUOCHI): le altre caselle si disattivano. */
  full: boolean;
  /** Il confronto affiancato vuole da COMPARE_MIN_FUOCHI a COMPARE_MAX_FUOCHI fuochi. */
  canCompare: boolean;
  isSelected: (id: number) => boolean;
  /** Aggiunge o toglie il fuoco; la riga della tabella resta come copia dei dati. */
  toggle: (row: Fuoco) => void;
  remove: (id: number) => void;
  /** Aggiunge fuochi in coda, senza doppioni e fino al limite; i dati si chiedono al server. */
  add: (ids: readonly number[]) => void;
  /** Sostituisce la selezione, per esempio con i fuochi di una raccolta. */
  replace: (ids: number[]) => void;
  clear: () => void;
  viewOpen: boolean;
  openView: () => void;
  closeView: () => void;
}

export const CompareContext = createContext<CompareState | null>(null);

/** Stato della selezione, o null fuori dal provider (le righe funzionano anche senza). */
export const useOptionalCompare = (): CompareState | null => useContext(CompareContext);

export function useCompare(): CompareState {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare va usato dentro CompareProvider");
  return context;
}
