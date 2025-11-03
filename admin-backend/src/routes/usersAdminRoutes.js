import express from "express";
import {
  getAdmins,
  getComisionistas,
  getInversionistas,
  getUsersSummary,
  validateInviteAdmin,   // 👈 falta
  inviteAdmin            // 👈 falta
} from "../controllers/usersAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protege todo el grupo:
router.use(verificarToken, soloAdmin);

router.get("/admins", getAdmins);
router.get("/comisionistas", getComisionistas);
router.get("/inversionistas", getInversionistas);
router.get("/resumen/contadores", getUsersSummary);

// Ya estás protegido arriba, así que no repitas verificarToken/soloAdmin aquí:
router.post("/admins/invite", validateInviteAdmin, inviteAdmin);

export default router;
