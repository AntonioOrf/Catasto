import { Router } from "express";
import { createLimiter } from "../utils/rate-limit.js";
import { CatastoController } from "../controllers/catasto.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// The manifest endpoint proxies an external government service - keep it
// stricter than general API traffic to avoid hammering the upstream.
const manifestLimiter = createLimiter("manifest", {
  limit: 30,
});

// L'export legge tutte le righe della ricerca: limite molto più stretto del
// traffico normale, e separato per non consumare la quota della tabella.
const exportLimiter = createLimiter("export", {
  limit: 20,
  message: { error: "Troppi export in poco tempo. Riprova tra qualche minuto." },
});

// Una decina di query aggregate per richiesta (con cache breve): limite
// separato, più largo dell'export perché il pannello segue i filtri.
const statsLimiter = createLimiter("stats", {
  limit: 150,
  message: { error: "Troppe richieste di statistiche. Riprova tra qualche minuto." },
});

// Una richiesta a ogni parola scritta nella casella (dopo una breve pausa):
// limite proprio, largo, per non consumare la quota della tabella.
const suggestLimiter = createLimiter("suggest", {
  limit: 600,
  message: { error: "Troppe ricerche in poco tempo. Riprova tra qualche minuto." },
});

router.get("/", asyncHandler(CatastoController.getAll));
router.get("/stats", statsLimiter, asyncHandler(CatastoController.stats));
router.post("/query/stats", statsLimiter, asyncHandler(CatastoController.queryStats));
router.get("/export", exportLimiter, asyncHandler(CatastoController.exportSimple));
router.post("/query/export", exportLimiter, asyncHandler(CatastoController.exportAdvanced));
router.post("/query", asyncHandler(CatastoController.query));
router.get("/sidebar", asyncHandler(CatastoController.getSidebar));
router.get("/fuochi", asyncHandler(CatastoController.getByIds));
router.get("/suggest", suggestLimiter, asyncHandler(CatastoController.suggest));
router.get("/manifest/:id", manifestLimiter, asyncHandler(CatastoController.getManifest));

export default router;
