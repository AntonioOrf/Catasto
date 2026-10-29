/** Il percorso guidato si mostra da solo una volta per dispositivo. */
export const TOUR_STORAGE_KEY = "catasto.tour.v1";

// localStorage può lanciare o mancare (modalità private, policy): in quel
// caso il percorso conta come già visto, per non riproporlo a ogni pagina.
export function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "visto";
  } catch {
    return true;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "visto");
  } catch {
    // non persistito: alla prossima visita potrà ricomparire
  }
}
