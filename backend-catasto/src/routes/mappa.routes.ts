import { Router } from "express";
import rateLimit from "express-rate-limit";
import { MappaController } from "../controllers/mappa.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// Una query aggregata per richiesta (con cache breve): stesso limite delle
// statistiche, perché la mappa segue i filtri come il pannello.
const mappaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste della mappa. Riprova tra qualche minuto." },
});

router.get("/luoghi", mappaLimiter, asyncHandler(MappaController.luoghi));
router.post("/query", mappaLimiter, asyncHandler(MappaController.query));

export default router;
