import express, { Router } from "express";
import { createLimiter } from "../utils/rate-limit.js";
import { SegnalazioneController } from "../controllers/segnalazione.controller.js";
import { adminLimiter, requireAdmin } from "../middlewares/admin.middleware.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// Unica rotta pubblica in scrittura del progetto: limite molto più stretto del
// traffico di lettura, e separato per non consumare la quota della ricerca.
const segnalazioneLimiter = createLimiter("segnalazioni", {
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: "Troppe segnalazioni inviate. Riprova tra un'ora." },
});

router.post("/", segnalazioneLimiter, asyncHandler(SegnalazioneController.create));

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
