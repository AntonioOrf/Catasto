import { Router } from "express";
import { FilterController } from "../controllers/filter.controller.js";
import { adminLimiter, requireAdmin } from "../middlewares/admin.middleware.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

router.get("/", asyncHandler(FilterController.getFilters));
// Dopo un reimport del dump o un import di traduzioni: rende subito visibili
// le nuove opzioni senza riavviare il backend né aspettare il TTL.
router.post("/cache/invalidate", adminLimiter, requireAdmin, FilterController.invalidateCache);

export default router;
