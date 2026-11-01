// Backend Express come Vercel Function: lo stesso codice di backend-catasto,
// servito sullo stesso dominio del frontend. Le richieste /api/* e /health
// arrivano qui tramite i rewrite di vercel.json; req.url resta quello
// originale, quindi le rotte di Express funzionano senza modifiche.
//
// server/app.mjs è il backend compilato in un solo file da
// scripts/build-api.mjs (npm run build), con dentro @catasto/shared: vedi lì
// perché non si importa direttamente backend-catasto/src/app.ts.
//
// Se il backend non si avvia (bundle mancante, variabile d'ambiente non
// valida, dipendenza assente) la funzione non va in crash con un generico
// FUNCTION_INVOCATION_FAILED: risponde 503 con il tipo di errore e lo scrive
// nei log, così la causa si legge senza accedere al pannello di Vercel.
let app;
try {
  ({ default: app } = await import("../server/app.mjs"));
} catch (error) {
  console.error("❌ Avvio del backend non riuscito:", error);
  const dettaglio = `${error?.code ?? error?.name ?? "Error"}: ${String(error?.message ?? error).slice(0, 300)}`;
  app = (_req, res) => {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ status: "error", error: "Avvio del backend non riuscito", dettaglio }));
  };
}

export default app;
