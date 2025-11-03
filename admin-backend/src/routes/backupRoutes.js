import express from "express";
import {
  getBackups,
  generarBackup,
  eliminarBackup,
  descargarBackup
} from "../controllers/backupController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/", getBackups);
router.post("/crear", generarBackup);
router.delete("/:id", eliminarBackup);
router.get("/descargar/:id", descargarBackup);

export default router;
