/**
 * Abbina i luoghi del catasto (CSV di `db:export-luoghi`) alle voci del
 * Dizionario del Repetti (CSV di `repetti:luoghi`) e propone coordinate con un
 * livello di certezza: sicura, approssimata, solo_piviere, non_trovata. Il CSV
 * prodotto è da rivedere a mano prima dell'import.
 *
 * npm run repetti:abbina -w catasto-backend -- luoghi.csv repetti-luoghi.csv [abbinamenti.csv]
 *
 * Non usa il database. Senza file il CSV va su stdout; statistiche su stderr.
 */
import { readFile, writeFile } from "node:fs/promises";
import { formatCsvRow, parseCsv } from "../utils/csv.js";
import {
  abbinaLuogo,
  indicizzaRepetti,
  type Abbinamento,
  type Certezza,
  type LuogoCatasto,
  type VoceRepetti,
} from "../utils/abbina-luoghi.js";

export const COLONNE_ABBINAMENTI = [
  "id_registrazione",
  "nome_serie",
  "nome_quartiere",
  "nome_piviere",
  "nome_popolo",
  "fuochi",
  "avvisi",
  "cercato",
  "certezza",
  "lat",
  "lng",
  "repetti_titolo",
  "repetti_slug",
  "repetti_fonte_coordinate",
  "pieve_titolo",
  "distanza_pieve_km",
  "candidati",
  "motivo",
] as const;

async function leggiCsv<T>(file: string): Promise<T[]> {
  const [intestazione, ...righe] = parseCsv(await readFile(file, "utf8"));
  return righe.map((r) => Object.fromEntries(intestazione.map((c, i) => [c, r[i] ?? ""])) as T);
}

function riga(a: Abbinamento): string[] {
  const l = a.luogo;
  return [
    l.id_registrazione,
    l.nome_serie,
    l.nome_quartiere,
    l.nome_piviere,
    l.nome_popolo,
    l.fuochi,
    l.avvisi ?? "",
    a.cercato,
    a.certezza,
    a.lat === null ? "" : a.lat.toFixed(6),
    a.lng === null ? "" : a.lng.toFixed(6),
    a.voce?.titolo ?? "",
    a.voce?.slug ?? "",
    a.voce?.fonte_coordinate ?? "",
    a.pieve?.titolo ?? "",
    a.distanza_pieve_km === null ? "" : a.distanza_pieve_km.toFixed(1),
    a.candidati.map((c) => `${c.voce.titolo} [${c.punteggio}]`).join(" | "),
    a.motivo,
  ];
}

async function main(): Promise<void> {
  const [fileLuoghi, fileRepetti, file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!fileLuoghi || !fileRepetti) {
    console.error("Uso: npm run repetti:abbina -w catasto-backend -- luoghi.csv repetti-luoghi.csv [abbinamenti.csv]");
    process.exit(2);
  }
  const luoghi = await leggiCsv<LuogoCatasto>(fileLuoghi);
  const indice = indicizzaRepetti(await leggiCsv<VoceRepetti>(fileRepetti));
  const abbinamenti = luoghi.map((l) => abbinaLuogo(l, indice));

  const csv = `${[formatCsvRow([...COLONNE_ABBINAMENTI]), ...abbinamenti.map((a) => formatCsvRow(riga(a)))].join("\n")}\n`;
  if (file) await writeFile(file, csv, "utf8");
  else process.stdout.write(csv);

  const totali = new Map<Certezza, { luoghi: number; fuochi: number }>();
  for (const a of abbinamenti) {
    const t = totali.get(a.certezza) ?? { luoghi: 0, fuochi: 0 };
    t.luoghi++;
    t.fuochi += Number(a.luogo.fuochi) || 0;
    totali.set(a.certezza, t);
  }
  for (const c of ["sicura", "approssimata", "solo_piviere", "non_trovata"] as Certezza[]) {
    const t = totali.get(c) ?? { luoghi: 0, fuochi: 0 };
    console.error(`${c.padEnd(13)} ${String(t.luoghi).padStart(5)} luoghi ${String(t.fuochi).padStart(7)} fuochi`);
  }
  console.error(`✅ ${abbinamenti.length} luoghi${file ? ` scritti in ${file}` : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
