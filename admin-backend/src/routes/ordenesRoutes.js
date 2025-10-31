import express from "express";
import { getOrdenesDetalle } from "../controllers/ordenesController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/", getOrdenesDetalle);

export default router;
