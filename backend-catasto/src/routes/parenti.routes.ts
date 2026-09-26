import { Router } from "express";
import { CatastoController } from "../controllers/catasto.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

router.get("/:id", asyncHandler(CatastoController.getParenti));

export default router;
