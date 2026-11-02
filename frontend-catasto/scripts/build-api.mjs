// Compila il backend Express (backend-catasto/src/app.ts) in un unico file,
// server/app.mjs, che la Vercel Function (api/index.js) importa.
//
// Il bundle è autosufficiente: contiene il pacchetto condiviso
// @catasto/shared e tutte le dipendenze npm del backend (express, mysql2,
// exceljs...). Su Vercel la radice del progetto è frontend-catasto, e la
// funzione non riceve né il collegamento dei workspace a @catasto/shared né le
// dipendenze del backend: con import esterni ogni rotta falliva con
// ERR_MODULE_NOT_FOUND ("Cannot find package 'express'").
import { build } from "esbuild";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

await build({
  entryPoints: [path.join(root, "../backend-catasto/src/app.ts")],
  outfile: path.join(root, "server/app.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  // Il pacchetto condiviso dai sorgenti, non dal dist/ del workspace.
  alias: { "@catasto/shared": path.join(root, "../packages/shared/src/index.ts") },
  // Le dipendenze CommonJS (express, mysql2...) usano require() anche per i
  // moduli di Node: in un bundle ESM serve un require vero.
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  sourcemap: true,
  logLevel: "info",
});
