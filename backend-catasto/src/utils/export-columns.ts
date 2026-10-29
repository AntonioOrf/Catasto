import { fieldLabelIn, type Lingua } from "@catasto/shared";
import type { TabellaLookup, Traduttore } from "../models/traduzioni.model.js";

/**
 * Colonne dei file esportati, nell'ordine in cui compaiono. Le etichette
 * seguono la lingua richiesta; i valori delle tabelle di lookup sono tradotti
 * come nella tabella del sito. I dati assenti restano celle vuote, mai 0.
 */

export type CellValue = string | number | null;

interface Column {
  key: string;
  /** Chiave del FIELD_REGISTRY da cui prendere l'etichetta, oppure etichette proprie. */
  field?: string;
  label?: Record<Lingua, string>;
  kind: "text" | "number";
  lookup?: TabellaLookup;
}

export const FUOCHI_COLUMNS: readonly Column[] = [
  { key: "id", label: { it: "ID fuoco", en: "Household ID" }, kind: "number" },
  { key: "nome", field: "nome", kind: "text" },
  { key: "mestiere", field: "mestiere", kind: "text", lookup: "mestieri" },
  { key: "rapporto_mestiere", field: "rapporto", kind: "text", lookup: "rapporto_mestiere" },
  { key: "bestiame", field: "bestiame", kind: "text", lookup: "bestiame" },
  { key: "immigrazione", field: "immigrazione", kind: "text", lookup: "immigrazione" },
  { key: "casa", field: "casa", kind: "text", lookup: "casa" },
  {
    key: "particolarita_fuoco",
    label: { it: "Particolarità fuoco", en: "Household particularity" },
    kind: "text",
    lookup: "particolarita_fuoco",
  },
  { key: "serie", field: "serie", kind: "text" },
  { key: "quartiere", field: "quartiere", kind: "text" },
  { key: "piviere", field: "piviere", kind: "text" },
  { key: "popolo", field: "popolo", kind: "text" },
  { key: "fortune", field: "fortune", kind: "number" },
  { key: "credito", field: "credito", kind: "number" },
  { key: "credito_m", field: "credito_m", kind: "number" },
  { key: "imponibile", field: "imponibile", kind: "number" },
  { key: "deduzioni", field: "deduzioni", kind: "number" },
  { key: "volume", field: "volume", kind: "text" },
  { key: "foglio", field: "foglio", kind: "text" },
  { key: "segnatura_portata", field: "segnatura_portata", kind: "text" },
  { key: "codice_archivio", label: { it: "Codice archivio (IIIF)", en: "Archive code (IIIF)" }, kind: "text" },
];

export const PARENTI_COLUMNS: readonly Column[] = [
  { key: "id_fuoco", label: { it: "ID fuoco", en: "Household ID" }, kind: "number" },
  { key: "nome_fuoco", field: "nome", kind: "text" },
  { key: "parentela", label: { it: "Parentela", en: "Relationship" }, kind: "text", lookup: "rapporti_parentela" },
  { key: "sesso", label: { it: "Sesso", en: "Sex" }, kind: "text", lookup: "sesso_parenti" },
  { key: "eta", label: { it: "Età", en: "Age" }, kind: "number" },
  { key: "stato_civile", label: { it: "Stato civile", en: "Marital status" }, kind: "text", lookup: "statocivile_parenti" },
  { key: "particolarita", label: { it: "Particolarità", en: "Particularity" }, kind: "text", lookup: "particolarita_parenti" },
];

export const columnLabels = (columns: readonly Column[], lang: Lingua): string[] =>
  columns.map((c) => (c.label ? c.label[lang] : fieldLabelIn(c.field ?? c.key, lang)));

/**
 * mysql2 restituisce i DECIMAL come stringhe: nei file vanno numeri veri,
 * così fogli di calcolo e R li leggono come tali. Un valore non numerico resta
 * com'è invece di diventare NaN.
 */
const toNumber = (value: unknown): CellValue => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : String(value);
};

const toText = (value: unknown): CellValue => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

/** Riga del DB → celle, nell'ordine delle colonne, con le etichette tradotte. */
export function toCells(row: Record<string, unknown>, columns: readonly Column[], traduttore: Traduttore): CellValue[] {
  return columns.map((c) => {
    if (c.kind === "number") return toNumber(row[c.key]);
    const text = toText(row[c.key]);
    return c.lookup && typeof text === "string" ? (traduttore.t(c.lookup, text) as string) : text;
  });
}
