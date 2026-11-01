import { Router } from "express";
import { createLimiter } from "../utils/rate-limit.js";
import { MappaController } from "../controllers/mappa.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

// Una query aggregata per richiesta (con cache breve): stesso limite delle
// statistiche, perché la mappa segue i filtri come il pannello.
const mappaLimiter = createLimiter("mappa", {
  limit: 150,
  message: { error: "Troppe richieste della mappa. Riprova tra qualche minuto." },
});

router.get("/luoghi", mappaLimiter, asyncHandler(MappaController.luoghi));
router.post("/query", mappaLimiter, asyncHandler(MappaController.query));

export default router;
