import { Router } from "express";
import { CatastoController } from "../controllers/catasto.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

router.get("/", asyncHandler(CatastoController.getMestieri));

export default router;
