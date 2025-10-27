import express from "express";
import { listAllUsers, getUsersSummary } from "../controllers/usersAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get("/", listAllUsers); 
router.get("/resumen/contadores", getUsersSummary);

export default router;
