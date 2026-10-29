import { createContext, useContext } from "react";

export interface TourState {
  open: boolean;
  /** Apre il percorso dal primo passo (pulsante "Guida"). */
  start: () => void;
  /** Lo apre solo se non è mai stato chiuso su questo dispositivo. */
  startIfFirstVisit: () => void;
  /** Chiude e ricorda che è stato visto. */
  finish: () => void;
}

export const TourContext = createContext<TourState | null>(null);

export function useTour(): TourState {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour va usato dentro TourProvider");
  return context;
}
