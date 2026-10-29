import type { Fuoco } from "@catasto/shared";
import type { RiferimentoArchivio } from "./archivio";
import { parseSegnaturaPortata } from "./segnatura";

/**
 * Volume e carta da aprire nel visore. La portata ha volume e carta solo
 * nella segnatura accettata, e un codice d'archivio solo se il suo volume è
 * fra quelli digitalizzati del fondo Catasto: altrimenti non si apre.
 */
export function viewerVolume(row: Fuoco, riferimento: RiferimentoArchivio) {
  if (riferimento === "campione") {
    return { codiceArchivio: row.codice_archivio ?? "", volume: row.volume ?? "", foglio: row.foglio ?? "" };
  }
  if (!row.codice_archivio_portata || !row.segnatura_portata) return null;
  const { volume, carta } = parseSegnaturaPortata(row.segnatura_portata);
  if (!volume || !carta) return null;
  return { codiceArchivio: row.codice_archivio_portata, volume, foglio: carta };
}
