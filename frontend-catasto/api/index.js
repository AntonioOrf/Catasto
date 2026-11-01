// Backend Express come Vercel Function: lo stesso codice di backend-catasto,
// servito sullo stesso dominio del frontend. Le richieste /api/* e /health
// arrivano qui tramite i rewrite di vercel.json; req.url resta quello
// originale, quindi le rotte di Express funzionano senza modifiche.
//
// server/app.mjs è il backend compilato in un solo file da
// scripts/build-api.mjs (npm run build), con dentro @catasto/shared: vedi lì
// perché non si importa direttamente backend-catasto/src/app.ts.
import app from "../server/app.mjs";

export default app;
