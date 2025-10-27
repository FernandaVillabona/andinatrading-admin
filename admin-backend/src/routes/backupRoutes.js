import express from "express";
import { getBackups, generarBackup } from "../controllers/backupController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/", getBackups);
router.post("/generate", generarBackup);

export default router;
