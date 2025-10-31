import express from "express";
import {
  getAccionesActuales,
  getHistorialOrdenes,
  getMovimientosFinancieros,
  getTopEmpresasOperadas,
} from "../controllers/analisisAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Solo accesible por ADMIN
router.use(verificarToken, soloAdmin);

// Endpoints analíticos
router.get("/acciones-actuales", getAccionesActuales);
router.get("/historial-ordenes", getHistorialOrdenes);
router.get("/movimientos", getMovimientosFinancieros);
router.get("/top-empresas", getTopEmpresasOperadas);

export default router;
