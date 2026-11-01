/**
 * Costruisce dal Dizionario del Repetti (dati CC0 di
 * https://github.com/joeyates/repetti_data) la tabella dei luoghi con
 * dedicazione, piviere, comunità, diocesi, distanza dal luogo di riferimento
 * e coordinate: quelle di coordinates.json oppure, se mancano, calcolate
 * dalla distanza. Base per l'abbinamento con i luoghi del catasto.
 *
 * git clone --depth 1 https://github.com/joeyates/repetti_data.git
 * npm run repetti:luoghi -w catasto-backend -- <cartella repetti_data> [file.csv]
 *
 * Non usa il database. Senza file il CSV va su stdout; statistiche su stderr.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatCsvRow } from "../utils/csv.js";
import { costruisciLuoghi, type ArticoloRepetti, type CoordinataRepetti, type LuogoRepetti } from "../utils/repetti.js";

const VOLUMI = ["I", "II", "III", "IV", "V"];

export const COLONNE_REPETTI = [
  "titolo",
  "volume",
  "slug",
  "contesto",
  "tipo",
  "dedicazione",
  "piviere",
  "comunita",
  "giurisdizione",
  "diocesi",
  "compartimento",
  "distanza_miglia",
  "direzione",
  "gradi",
  "riferimento",
  "riferimento_titolo",
  "lat",
  "lng",
  "fonte_coordinate",
  "note",
  "intestazione",
] as const;

function riga(l: LuogoRepetti): string[] {
  const coord = (v: number | null) => (v === null ? "" : v.toFixed(6));
  return [
    l.titolo,
    l.volume,
    l.slug,
    l.contesto,
    l.tipo,
    l.dedicazione,
    l.piviere,
    l.comunita,
    l.giurisdizione,
    l.diocesi,
    l.compartimento,
    l.distanza ? String(l.distanza.miglia) : "",
    l.distanza?.direzione ?? "",
    l.distanza ? l.distanza.gradi.toFixed(1) : "",
    l.distanza?.riferimento ?? "",
    l.riferimento_titolo,
    coord(l.lat),
    coord(l.lng),
    l.fonte_coordinate,
    l.note.join(";"),
    l.intestazione,
  ];
}

async function leggiJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function main(): Promise<void> {
  const [cartella, file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!cartella) {
    console.error("Uso: npm run repetti:luoghi -w catasto-backend -- <cartella repetti_data> [file.csv]");
    process.exit(2);
  }

  const volumi = await Promise.all(
    VOLUMI.map(async (volume) => ({
      volume,
      articoli: await leggiJson<ArticoloRepetti[]>(path.join(cartella, `vol_${volume}-articles.json`)),
    })),
  );
  const coordinate = await leggiJson<CoordinataRepetti[]>(path.join(cartella, "coordinates.json"));

  const { luoghi, statistiche } = costruisciLuoghi(volumi, coordinate);
  const csv = `${[formatCsvRow([...COLONNE_REPETTI]), ...luoghi.map((l) => formatCsvRow(riga(l)))].join("\n")}\n`;

  if (file) await writeFile(file, csv, "utf8");
  else process.stdout.write(csv);
  console.error(JSON.stringify(statistiche, null, 2));
  console.error(`✅ ${luoghi.length} luoghi${file ? ` scritti in ${file}` : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
