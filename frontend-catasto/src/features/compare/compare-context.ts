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
  full: boolean;
  isSelected: (id: number) => boolean;
  /** Aggiunge o toglie il fuoco; la riga della tabella resta come copia dei dati. */
  toggle: (row: Fuoco) => void;
  remove: (id: number) => void;
  clear: () => void;
  viewOpen: boolean;
  openView: () => void;
  closeView: () => void;
}

export const CompareContext = createContext<CompareState | null>(null);

/** Stato del confronto, o null fuori dalla home (le righe funzionano anche senza). */
export const useOptionalCompare = (): CompareState | null => useContext(CompareContext);

export function useCompare(): CompareState {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare va usato dentro CompareProvider");
  return context;
}
