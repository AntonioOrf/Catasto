/**
 * Mappa dei luoghi del catasto (/mappa): un punto per luogo
 * (`id_registrazione`), con gli aggregati dei fuochi della ricerca.
 */

export const CERTEZZE_LUOGO = ["sicura", "approssimata", "solo_piviere", "non_trovata"] as const;
export type CertezzaLuogo = (typeof CERTEZZE_LUOGO)[number];

export interface LuogoMappa {
  id: number;
  lat: number;
  lng: number;
  certezza: Exclude<CertezzaLuogo, "non_trovata">;
  /** Nome del luogo nel catasto (popolo, comune, piviere o città). */
  nome: string;
  piviere: string | null;
  serie: string | null;
  /** Voce del Repetti o nome attuale del luogo. */
  nome_moderno: string | null;
  fuochi: number;
  imponibile_medio: number | null;
  /** Quota dei fuochi con un mestiere indicato (0–1). */
  quota_mestiere: number;
  /** Quota dei fuochi con un'indicazione di migrazione o residenza altrove (0–1). */
  quota_migrazione: number;
  /** Membri registrati per fuoco, in media. */
  ampiezza_media: number;
}

export interface MappaLuoghi {
  luoghi: LuogoMappa[];
  /** Tutti i fuochi della ricerca, localizzati e no. */
  fuochi: number;
  /** Fuochi della ricerca in luoghi senza coordinate (non mostrati). */
  non_localizzati: { fuochi: number; luoghi: number };
  /** false se la tabella delle coordinate manca (migrazioni 006–007 non applicate). */
  disponibile: boolean;
}
