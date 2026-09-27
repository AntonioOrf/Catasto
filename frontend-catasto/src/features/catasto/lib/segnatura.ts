import { SEGNATURA_PREFISSO } from "@catasto/shared";

export interface SegnaturaPortata {
  /** Fondo archivistico, solo se diverso da ASFi, Catasto (il caso di quasi tutte le portate). */
  fondo: string | null;
  volume: string | null;
  carta: string | null;
  /** Testo da mostrare quando la segnatura non si scompone in volume e carta. */
  testo: string;
}

const PREFISSO_CATASTO = new RegExp(`^${SEGNATURA_PREFISSO.replace(/,\s*/, ",\\s*")}\\b[\\s,]*`, "i");

/**
 * "ASFi, Catasto 125, c. 306" → volume 125, carta 306, senza fondo: accanto
 * al campione il prefisso è ripetitivo e si mostra solo quando è un altro
 * fondo ("ASFi, Estimo 12, c. 3r"). La segnatura è testo libero delle
 * segnalazioni: se non ha la forma attesa si mostra com'è.
 */
export function parseSegnaturaPortata(raw: string): SegnaturaPortata {
  const trimmed = raw.trim();
  const prefisso = trimmed.match(PREFISSO_CATASTO);
  const resto = prefisso ? trimmed.slice(prefisso[0].length) : trimmed;

  const m = resto.match(/^(.*?)[\s,]*(?:vol\.?\s*)?(\d[\w/-]*)\s*,\s*(?:cc?\.|carta|carte)\s*(.+)$/i);
  if (m) {
    const fondo = m[1].trim();
    return { fondo: prefisso || !fondo ? null : fondo, volume: m[2], carta: m[3].trim(), testo: resto };
  }

  // Non scomponibile: il numero di volume resta comunque preceduto da "Vol.".
  const testo = prefisso && /^\d/.test(resto) ? `Vol. ${resto}` : resto || trimmed;
  return { fondo: null, volume: null, carta: null, testo };
}
