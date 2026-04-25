import { Router } from "express";
import { CatastoController } from "../controllers/catasto.controller.js";

const router = Router();

router.get("/", CatastoController.getMestieri);

export default router;
