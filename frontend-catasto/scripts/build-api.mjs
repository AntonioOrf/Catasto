// Compila il backend Express (backend-catasto/src/app.ts) in un unico file,
// server/app.mjs, che la Vercel Function (api/index.js) importa.
//
// Perché un bundle: nella funzione Vercel copia packages/shared ma non il
// collegamento node_modules/@catasto/shared che npm crea per i workspace, e
// l'import di "@catasto/shared" fallisce all'avvio (FUNCTION_INVOCATION_FAILED
// su ogni rotta). Qui il pacchetto condiviso entra nel bundle dai sorgenti; le
// altre dipendenze restano esterne e Vercel le include da node_modules.
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
  // Dipendenze npm esterne, tranne il pacchetto condiviso: l'alias lo
  // trasforma in un percorso di file, che finisce nel bundle.
  packages: "external",
  alias: { "@catasto/shared": path.join(root, "../packages/shared/src/index.ts") },
  sourcemap: true,
  logLevel: "info",
});
