/**
 * Segnalazioni degli utenti su dati errati o mancanti.
 *
 * Il caso principale è la "segnatura della portata": un dato che il DB
 * dell'Archivio non contiene e che viene raccolto dalle segnalazioni,
 * validato dalla redazione e infine mostrato nella scheda del fuoco.
 */

export const TIPI_SEGNALAZIONE = ["dato_errato", "segnatura", "altro"] as const;
export type TipoSegnalazione = (typeof TIPI_SEGNALAZIONE)[number];

export const STATI_SEGNALAZIONE = ["nuova", "in_esame", "accettata", "respinta"] as const;
export type StatoSegnalazione = (typeof STATI_SEGNALAZIONE)[number];

export const TIPO_SEGNALAZIONE_LABELS: Record<TipoSegnalazione, string> = {
  dato_errato: "Dato errato",
  segnatura: "Segnatura della portata",
  altro: "Altro",
};

export const STATO_SEGNALAZIONE_LABELS: Record<StatoSegnalazione, string> = {
  nuova: "Nuova",
  in_esame: "In esame",
  accettata: "Accettata",
  respinta: "Respinta",
};

/** Limiti di lunghezza: replicati nello schema zod del backend e negli input. */
export const SEGNALAZIONE_LIMITS = {
  campo: 64,
  valore: 500,
  note: 2000,
  email: 255,
} as const;

export interface SegnalazioneInput {
  id_fuoco: number | null;
  tipo: TipoSegnalazione;
  /** Chiave del FIELD_REGISTRY. Obbligatoria per `dato_errato`. */
  campo?: string | null;
  valore_attuale?: string | null;
  valore_proposto?: string | null;
  note?: string | null;
  email?: string | null;
  /** Honeypot: compilato solo dai bot, deve restare vuoto. */
  website?: string;
}

export interface Segnalazione {
  id: number;
  id_fuoco: number | null;
  nome_fuoco?: string | null;
  tipo: TipoSegnalazione;
  campo: string | null;
  valore_attuale: string | null;
  valore_proposto: string | null;
  note: string | null;
  email: string | null;
  stato: StatoSegnalazione;
  created_at: string;
}
