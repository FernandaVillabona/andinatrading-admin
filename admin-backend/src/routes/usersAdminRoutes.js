import express from "express";
import {
  getAdmins,
  getComisionistas,
  getInversionistas,
  getUsersSummary,
  validateInviteAdmin,   
  inviteAdmin            
} from "../controllers/usersAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/admins", getAdmins);
router.get("/comisionistas", getComisionistas);
router.get("/inversionistas", getInversionistas);
router.get("/resumen/contadores", getUsersSummary);

router.post("/admins/invite", validateInviteAdmin, inviteAdmin);

export default router;
