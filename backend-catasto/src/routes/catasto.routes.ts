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

router.get("/", asyncHandler(CatastoController.getAll));
router.post("/query", asyncHandler(CatastoController.query));
router.get("/sidebar", asyncHandler(CatastoController.getSidebar));
router.get("/manifest/:id", manifestLimiter, asyncHandler(CatastoController.getManifest));

export default router;
