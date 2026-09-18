import { Router } from "express";
import { CatastoController } from "../controllers/catasto.controller.js";

const router = Router();

router.get("/", CatastoController.getAll);
router.post("/query", CatastoController.query);
router.get("/sidebar", CatastoController.getSidebar);
router.get("/manifest/:id", CatastoController.getManifest);

export default router;
