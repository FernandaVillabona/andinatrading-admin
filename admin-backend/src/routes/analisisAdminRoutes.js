// src/routes/analisisAdminRoutes.js
import express from "express";
import {
  getAccionesActuales,
  getHistorialOrdenes,
  getMovimientosFinancieros,
  getTopEmpresasOperadas,
} from "../controllers/analisisAdminController.js";
import { verificarToken, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* 🧪 Rutas públicas SOLO en desarrollo */
if (process.env.NODE_ENV !== "production") {
  router.get("/public/acciones-actuales", getAccionesActuales);
  router.get("/public/historial-ordenes", getHistorialOrdenes);
  router.get("/public/movimientos", getMovimientosFinancieros);
  router.get("/public/top-empresas", getTopEmpresasOperadas);
}

/* 🔒 A partir de aquí, todo protegido */
router.use(verificarToken, soloAdmin);

router.get("/acciones-actuales", getAccionesActuales);
router.get("/historial-ordenes", getHistorialOrdenes);
router.get("/movimientos", getMovimientosFinancieros);
router.get("/top-empresas", getTopEmpresasOperadas);

export default router;
