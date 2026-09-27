import type { IiifPage } from "@catasto/shared";

/**
 * Volumi digitalizzati in due parti con id d'archivio distinti: la carta
 * decide quale delle due aprire.
 */
const SPLIT_VOLUMES: Record<string, { part1: { max: number; id: string }; part2: { min: number; id: string } }> = {
  "18": { part1: { max: 1187, id: "2722381" }, part2: { min: 1188, id: "2722382" } },
  "29": { part1: { max: 354, id: "2722355" }, part2: { min: 355, id: "2722356" } },
  "35": { part1: { max: 1088, id: "2722362" }, part2: { min: 1089, id: "2722363" } },
  "41": { part1: { max: 388, id: "2722369" }, part2: { min: 389, id: "2722370" } },
  "46": { part1: { max: 463, id: "2722375" }, part2: { min: 464, id: "2722376" } },
  "78": { part1: { max: 304, id: "2722319" }, part2: { min: 305, id: "2722320" } },
  "80": { part1: { max: 337, id: "2722322" }, part2: { min: 338, id: "2722323" } },
  "125": { part1: { max: 508, id: "2722410" }, part2: { min: 509, id: "2722411" } },
  "193": { part1: { max: 328, id: "2722408" }, part2: { min: 329, id: "2722409" } },
};

/** Volume aperto nel visore: il campione del fuoco o la sua portata. */
export type RiferimentoArchivio = "campione" | "portata";

/** Carte mostrate nel visore a partire da quella del fuoco. */
export const PAGES_TO_SHOW = 4;

export function resolveArchiveId(codiceArchivio: string, volume: string | number, foglio: string | number): string {
  const rules = SPLIT_VOLUMES[String(volume).trim()];
  if (!rules || !foglio) return codiceArchivio;

  const foglioNum = parseInt(String(foglio).replace(/\D/g, ""), 10);
  if (Number.isNaN(foglioNum)) return codiceArchivio;
  if (foglioNum <= rules.part1.max) return rules.part1.id;
  if (foglioNum >= rules.part2.min) return rules.part2.id;
  return codiceArchivio;
}

const normalizeLabel = (label: string) =>
  label.toLowerCase().replace(/\.[a-z]{3,4}$/, "").trim();

/**
 * Indice della carta del fuoco nel volume, o -1 se non individuata. Le
 * etichette dell'Archivio finiscono con il numero di carta, spesso con zeri
 * iniziali ("..._0130"); a parità di numero si preferisce il registro al
 * repertorio o all'indice.
 */
export function findFoglioIndex(pages: IiifPage[], foglio: string | number): number {
  const foglioStr = String(foglio ?? "").trim();
  if (!foglioStr) return -1;
  const padded = foglioStr.padStart(4, "0");

  const labels = pages.map((page, index) => ({ label: normalizeLabel(page.label), index }));
  let matches = labels.filter(({ label }) => label.endsWith(padded) || label.endsWith(foglioStr));

  // Le carte delle portate hanno spesso recto/verso ("245r"), le etichette
  // dell'Archivio quasi mai: in mancanza si cerca il solo numero.
  const numero = foglioStr.match(/^(\d+)\s*[rv]$/i)?.[1];
  if (matches.length === 0 && numero) {
    const paddedNumero = numero.padStart(4, "0");
    matches = labels.filter(({ label }) => label.endsWith(paddedNumero) || label.endsWith(numero));
  }

  if (matches.length === 0) return -1;

  const preferred =
    matches.find(({ label }) => label.includes("registro")) ??
    matches.find(({ label }) => !label.includes("repertorio") && !label.includes("indice")) ??
    matches[0];
  return preferred.index;
}

/** Variante ridotta dell'immagine IIIF: la piena risoluzione si carica solo zoomando. */
export function iiifImageUrl(url: string, width?: number): string {
  if (width && url.includes("/full/full/0/default.jpg")) {
    return url.replace("/full/full/0/default.jpg", `/full/${width},/0/default.jpg`);
  }
  return url;
}

export const archiveDetailUrl = (archiveId: string) =>
  `https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/${encodeURIComponent(archiveId)}#viewer`;
