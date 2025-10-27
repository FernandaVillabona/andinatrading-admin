import express from "express";
import { getLogs } from "../controllers/logController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin); 
router.get("/", getLogs);

export default router;
