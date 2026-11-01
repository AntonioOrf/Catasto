// Backend Express come Vercel Function: lo stesso codice di backend-catasto,
// servito sullo stesso dominio del frontend. Le richieste /api/* e /health
// arrivano qui tramite i rewrite di vercel.json; req.url resta quello
// originale, quindi le rotte di Express funzionano senza modifiche.
import app from "../../backend-catasto/src/app.js";

export default app;
