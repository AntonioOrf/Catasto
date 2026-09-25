import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error.middleware.js";
import pool from "./config/db.js";
import catastoRoutes from "./routes/catasto.routes.js";
import filterRoutes from "./routes/filter.routes.js";
import parentiRoutes from "./routes/parenti.routes.js";
import mestieriRoutes from "./routes/mestieri.routes.js";
import segnalazioneRoutes from "./routes/segnalazione.routes.js";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3005;

// TRUST_PROXY = numero di proxy davanti al server (1 con il solo nginx del
// compose). Serve a req.ip: senza, rate limit e hash anti-abuso vedrebbero
// tutti lo stesso IP del reverse proxy. Non attivarlo "a fiducia": con
// trust proxy attivo senza un proxy reale il client può falsificare
// X-Forwarded-For e aggirare i limiti.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  app.set("trust proxy", Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy));
}

// CORS_ORIGIN: comma-separated list of allowed origins for production.
// Left unset, CORS stays open (current behavior) so this doesn't silently
// break an existing deployment - set it to lock the API down to the real
// frontend origin(s).
// Stringa vuota = non impostata (docker compose la passa cosi' quando manca).
const corsOrigin = process.env.CORS_ORIGIN || undefined;
if (!corsOrigin && process.env.NODE_ENV === "production") {
  console.warn("⚠️  CORS_ORIGIN is not set - the API accepts requests from any origin.");
}
const allowedOrigins = corsOrigin?.split(",").map((o) => o.trim());

// Middlewares
// crossOriginResourcePolicy defaults to "same-origin", which would make
// browsers block every response to the frontend (a different origin) even
// with CORS enabled - "cross-origin" restores that.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins ?? true }));
app.use(compression() as any);
// Limite esplicito: i body accettati sono un AST di ricerca o una segnalazione,
// entrambi nell'ordine dei KB. Il default di express (100kb) è già stretto, ma
// tenerlo scritto documenta l'intento.
app.use(express.json({ limit: "64kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// The manifest endpoint proxies an external government service - keep it
// stricter than general API traffic to avoid hammering the upstream.
const manifestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/catasto/manifest", manifestLimiter);

// Routes
app.get("/", (_req, res) => {
  res.send("Catasto API is running! 🚀");
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.use("/api/catasto", catastoRoutes);
app.use("/api/filters", filterRoutes);
app.use("/api/parenti", parentiRoutes);
app.use("/api/mestieri", mestieriRoutes);
app.use("/api/segnalazioni", segnalazioneRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
