import type { CertezzaLuogo, LuogoMappa } from "@catasto/shared";
import { SIMPLE_FILTER_PARAMS } from "../../catasto/lib/simple-filters";

/**
 * Logica pura della mappa: raggio dei cerchi, colori per certezza e per
 * indicatore, filtri dalla query string. Niente Leaflet qui, così si testa
 * senza browser.
 */

export type CertezzaMappa = Exclude<CertezzaLuogo, "non_trovata">;
export const CERTEZZE_MAPPA: CertezzaMappa[] = ["sicura", "approssimata", "solo_piviere"];

/** Variabili CSS del tema (index.css) per ogni certezza. */
export const COLORE_CERTEZZA: Record<CertezzaMappa, string> = {
  sicura: "--chart-3",
  approssimata: "--chart-5",
  solo_piviere: "--chart-4",
};

export type Indicatore = "certezza" | "imponibile_medio" | "quota_mestiere" | "quota_migrazione" | "ampiezza_media";
export const INDICATORI: Indicatore[] = ["certezza", "imponibile_medio", "quota_mestiere", "quota_migrazione", "ampiezza_media"];

/** Valore dell'indicatore per un luogo (null = non disponibile). */
export function valoreIndicatore(l: LuogoMappa, indicatore: Exclude<Indicatore, "certezza">): number | null {
  return l[indicatore];
}

/** Raggio in pixel: area proporzionale ai fuochi, con un minimo leggibile. */
export const raggio = (fuochi: number): number => Math.max(3, Math.sqrt(fuochi) * 1.1);

/** Cinque classi a quantili: soglie superiori delle prime quattro. */
export function soglieQuantili(valori: number[], classi = 5): number[] {
  const ordinati = valori.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (ordinati.length === 0) return [];
  const soglie: number[] = [];
  for (let i = 1; i < classi; i++) {
    soglie.push(ordinati[Math.min(ordinati.length - 1, Math.floor((i / classi) * ordinati.length))]);
  }
  return [...new Set(soglie)];
}

/** Indice della classe (0 = più bassa) di un valore rispetto alle soglie. */
export function classe(valore: number, soglie: number[]): number {
  let i = 0;
  while (i < soglie.length && valore >= soglie[i]) i++;
  return i;
}

/** Peso (20–100%) del colore pieno per la classe `i` di `n`: dal più chiaro al pieno. */
export function pesoClasse(i: number, n: number): number {
  return n <= 1 ? 100 : Math.round(20 + (80 * i) / (n - 1));
}

/** Mescola due colori `#rrggbb` (peso = percentuale del primo). Leaflet disegna su canvas: servono colori concreti. */
export function mescola(a: string, b: string, peso: number): string {
  const rgb = (hex: string) => {
    const h = hex.trim().replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const [x, y] = [rgb(a), rgb(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a;
  const p = peso / 100;
  return `#${x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, "0")).join("")}`;
}

const PARAMETRI_FILTRO: ReadonlySet<string> = new Set(Object.values(SIMPLE_FILTER_PARAMS));

/**
 * Filtri della ricerca semplice dalla query string (/mappa?mestiere=3&serie=4):
 * solo i parametri dell'API della ricerca semplice, gli altri si ignorano.
 */
export function filtriDaQuery(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const filtri: Record<string, string> = {};
  for (const [k, v] of params) {
    if (v.trim() !== "" && PARAMETRI_FILTRO.has(k)) filtri[k] = v;
  }
  return filtri;
}
