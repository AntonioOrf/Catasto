import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regole della revisione grafica (#41), controllate sul sorgente: un raggio
 * solo, nessuna ombra (tranne il visore delle carte, dove servono a leggere
 * sull'immagine), nessun maiuscolo spaziato per le etichette.
 */
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.(tsx?)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });

const offending = (pattern: RegExp, except: (file: string) => boolean = () => false) =>
  sources(SRC).flatMap((file) => {
    if (except(file)) return [];
    const hits = readFileSync(file, "utf8").match(pattern) ?? [];
    return hits.map((hit) => `${path.relative(SRC, file)}: ${hit}`);
  });

describe("regole grafiche", () => {
  it("un solo raggio: rounded-ui (o rounded-*-ui)", () => {
    expect(offending(/(?<![\w-])rounded(?:-(?!ui\b|[tblr]-ui\b|l-none\b)[\w[\]-]+)?(?![\w-])/g)).toEqual([]);
  });

  it("nessuna ombra fuori dal visore", () => {
    expect(offending(/(?<![\w-])shadow(?:-[\w[\](),./#-]+)?(?![\w-])/g, (f) => f.endsWith("ArchivioViewerModal.tsx"))).toEqual([]);
  });

  it("nessun maiuscolo spaziato: le etichette usano small-caps", () => {
    expect(offending(/(?<![\w-])(uppercase|tracking-wid(?:e|er|est))(?![\w-])/g)).toEqual([]);
  });
});
