import express from "express";
import {
  getAdmins,
  getComisionistas,
  getInversionistas,
  getUsersSummary
} from "../controllers/usersAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/admins", getAdmins);
router.get("/comisionistas", getComisionistas);
router.get("/inversionistas", getInversionistas);
router.get("/resumen/contadores", getUsersSummary);

export default router;
