import "./env.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import type { ApiResponse, Fuoco } from "@catasto/shared";
import pool from "../../src/config/db.js";
import { CatastoService } from "../../src/services/catasto.service.js";
import { parseCsv } from "../../src/utils/csv.js";
import { startApp } from "./app.js";

let app: Awaited<ReturnType<typeof startApp>>;
beforeAll(async () => {
  app = await startApp();
});
afterAll(async () => {
  await app.close();
  await pool.end();
});

/** Righe dati del CSV: senza BOM, senza commenti `#` e senza intestazione. */
const csvBody = (text: string, sep = ",") => {
  const lines = text.replace(/^\uFEFF/, "").split("\r\n").filter((l) => l && !l.startsWith("#"));
  const rows = parseCsv(sep === "," ? lines.join("\n") : lines.join("\n").replace(/;/g, ","));
  return { header: rows[0], data: rows.slice(1) };
};

describe("export CSV", () => {
  it("contiene tutte le righe della ricerca, nello stesso ordine della tabella", async () => {
    const res = await fetch(`${app.base}/export?format=csv&sort_by=fortune&order=DESC&fortune_min=100`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="catasto1427-fuochi-\d{4}-\d{2}-\d{2}\.csv"/);

    // res.text() toglierebbe il BOM: va controllato sui byte.
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(text).toContain("# Fonte: Catasto fiorentino del 1427/30");
    expect(text).toContain('# Ricerca: Fortune maggiore o uguale a 100');

    // La tabella a pagine da 2: l'export deve dare la concatenazione di tutte.
    const pagine: number[] = [];
    for (let page = 1; page <= 4; page++) {
      const r = (await CatastoService.searchFuochi(
        { fortune_min: 100 },
        { page, limit: 2, sort_by: "fortune", order: "DESC" },
        "table",
      )) as ApiResponse<Fuoco[]>;
      pagine.push(...r.data.map((f) => f.id));
    }
    const { header, data } = csvBody(text);
    expect(header[0]).toBe("ID fuoco");
    expect(data.map((row) => Number(row[0]))).toEqual(pagine);
    expect(res.headers.get("x-export-total")).toBe(String(pagine.length));
  });

  it("i valori assenti sono celle vuote, gli zeri restano zeri, gli accenti intatti", async () => {
    const text = await (await fetch(`${app.base}/export?q_persona=Guasconi`)).text();
    const { header, data } = csvBody(text);
    const fortune = header.indexOf("Fortune");
    expect(data[0][fortune]).toBe("");

    const zero = csvBody(await (await fetch(`${app.base}/export?q_persona=Nuto`)).text());
    expect(zero.data[0][fortune]).toBe("0");
    expect(text).toContain("Città");
  });

  it("separatore punto e virgola per Excel in italiano", async () => {
    const text = await (await fetch(`${app.base}/export?sep=semicolon&q_persona=Rucellai`)).text();
    const headerLine = text.replace(/^\uFEFF/, "").split("\r\n").find((l) => !l.startsWith("#"))!;
    expect(headerLine.startsWith("ID fuoco;Nome fuoco;")).toBe(true);
  });

  it("con parenti=true restituisce i parenti in formato lungo", async () => {
    const res = await fetch(`${app.base}/export?parenti=true&q_persona=Rucellai`);
    expect(res.headers.get("content-disposition")).toContain("catasto1427-parenti-");
    const { header, data } = csvBody(await res.text());
    expect(header.slice(0, 2)).toEqual(["ID fuoco", "Nome fuoco"]);
    expect(data).toHaveLength(4);
    expect(new Set(data.map((r) => r[0]))).toEqual(new Set(["1"]));
    // Età 0: un neonato, non un dato mancante.
    expect(data.map((r) => r[header.indexOf("Età")])).toContain("0");
  });

  it("in inglese intestazioni e lookup sono tradotti", async () => {
    // "Lanaiolo" ha una traduzione nel seed della migrazione 003.
    const [[traduzione]]: any = await pool.query(
      "SELECT valore FROM traduzioni_lookup WHERE tabella = 'mestieri' AND valore_it = 'Lanaiolo' AND lingua = 'en'",
    );
    const text = await (await fetch(`${app.base}/export?lang=en&q_persona=Rucellai`)).text();
    expect(text).toContain("# Source: Florentine Catasto");
    const { header, data } = csvBody(text);
    expect(header[0]).toBe("Household ID");
    expect(data[0][header.indexOf("Occupation")]).toBe(traduzione.valore);
  });

  it("oltre il tetto di righe risponde 400 con un messaggio, non un file troncato", async () => {
    process.env.EXPORT_MAX_ROWS = "3";
    try {
      const res = await fetch(`${app.base}/export`);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/10 fuochi.*limitato a 3/);
    } finally {
      delete process.env.EXPORT_MAX_ROWS;
    }
  });

  it("parametri non validi: 400 prima di qualunque byte del file", async () => {
    expect((await fetch(`${app.base}/export?format=pdf`)).status).toBe(400);
    expect((await fetch(`${app.base}/export?mestiere[]=1`)).status).toBe(400);
  });
});

describe("export della ricerca avanzata", () => {
  const ast = {
    kind: "group",
    op: "OR",
    children: [
      { kind: "condition", field: "quartiere", operator: "eq", value: "1,2" },
      { kind: "condition", field: "eta_parente", operator: "gt", value: 80 },
    ],
  };

  it("XLSX con foglio Info, fuochi e parenti", async () => {
    const res = await fetch(`${app.base}/query/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ast, format: "xlsx", parenti: true, sort_by: "nome" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await res.arrayBuffer());
    expect(workbook.worksheets.map((w) => w.name)).toEqual(["Info", "Fuochi", "Parenti"]);

    const info = workbook.getWorksheet("Info")!;
    const ricerca = info.getColumn(1).values.indexOf("Ricerca");
    expect(String(info.getRow(ricerca).getCell(2).value)).toBe(
      'Quartiere è uguale a "San Giovanni" oppure Età parente maggiore di 80',
    );

    const fuochi = workbook.getWorksheet("Fuochi")!;
    expect(fuochi.rowCount - 1).toBe(6);
    // Numeri veri, non stringhe: il foglio di calcolo li somma.
    expect(typeof fuochi.getRow(2).getCell(13).value).toBe("number");

    const parenti = workbook.getWorksheet("Parenti")!;
    expect(parenti.rowCount - 1).toBe(4 + 2 + 1 + 3 + 5 + 1);
  });

  it("un AST non valido è un 400", async () => {
    const res = await fetch(`${app.base}/query/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ast: { kind: "condition" } }),
    });
    expect(res.status).toBe(400);
  });
});

describe("pool dopo gli export", () => {
  it("tutte le connessioni tornano disponibili", async () => {
    // Più export in parallelo del numero di connessioni non devono bloccarsi.
    const results = await Promise.all(
      Array.from({ length: 8 }, () => fetch(`${app.base}/export?parenti=true`).then((r) => r.text())),
    );
    expect(results.every((t) => t.includes("Nome fuoco"))).toBe(true);
    const [rows]: any = await pool.query("SELECT 1 AS ok");
    expect(rows[0].ok).toBe(1);
  });
});
