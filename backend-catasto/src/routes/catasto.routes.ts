import { Router } from "express";
import rateLimit from "express-rate-limit";
import { CatastoController } from "../controllers/catasto.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// The manifest endpoint proxies an external government service - keep it
// stricter than general API traffic to avoid hammering the upstream.
const manifestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// L'export legge tutte le righe della ricerca: limite molto più stretto del
// traffico normale, e separato per non consumare la quota della tabella.
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi export in poco tempo. Riprova tra qualche minuto." },
});

router.get("/", asyncHandler(CatastoController.getAll));
router.get("/export", exportLimiter, asyncHandler(CatastoController.exportSimple));
router.post("/query/export", exportLimiter, asyncHandler(CatastoController.exportAdvanced));
router.post("/query", asyncHandler(CatastoController.query));
router.get("/sidebar", asyncHandler(CatastoController.getSidebar));
router.get("/manifest/:id", manifestLimiter, asyncHandler(CatastoController.getManifest));

export default router;
