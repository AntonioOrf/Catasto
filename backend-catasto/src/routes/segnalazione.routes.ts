import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { SegnalazioneController } from "../controllers/segnalazione.controller.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// Unica rotta pubblica in scrittura del progetto: limite molto più stretto del
// traffico di lettura, e separato per non consumare la quota della ricerca.
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe segnalazioni inviate. Riprova tra un'ora." },
});

router.post("/", createLimiter, asyncHandler(SegnalazioneController.create));

// Limite sui tentativi di autenticazione: il token è l'unica barriera
// dell'area di moderazione, non deve essere indovinabile a forza di richieste.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Link "Accetta" / "Respingi" dell'email: il token firmato sostituisce
// l'header di autenticazione. Stesso limitatore delle rotte admin, così i
// tentativi con token falsi consumano la stessa quota.
router.get("/moderazione", adminLimiter, asyncHandler(SegnalazioneController.linkConferma));
router.post(
  "/moderazione",
  adminLimiter,
  express.urlencoded({ extended: false, limit: "2kb" }),
  asyncHandler(SegnalazioneController.linkApplica),
);

router.get("/", adminLimiter, requireAdmin, asyncHandler(SegnalazioneController.list));
router.patch("/:id", adminLimiter, requireAdmin, asyncHandler(SegnalazioneController.updateStato));

export default router;
