import { Router } from "express";
import rateLimit from "express-rate-limit";
import { SegnalazioneController } from "../controllers/segnalazione.controller.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

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

router.post("/", createLimiter, SegnalazioneController.create);

router.get("/", requireAdmin, SegnalazioneController.list);
router.patch("/:id", requireAdmin, SegnalazioneController.updateStato);

export default router;
