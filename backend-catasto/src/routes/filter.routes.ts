import { Router } from "express";
import { FilterController } from "../controllers/filter.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

router.get("/", asyncHandler(FilterController.getFilters));

export default router;
