import express from "express";
import {
  getHistorial,
  getHistorialByModulo,
  getHistorialByEvento,
  getHistorialPaginado,
  getHistorialResumen
} from "../controllers/historialController.js";

const router = express.Router();

router.get("/", getHistorial);
router.get("/modulo/:modulo", getHistorialByModulo);
router.get("/evento/:tipo_evento", getHistorialByEvento);
router.get("/paginado", getHistorialPaginado);
router.get("/resumen", getHistorialResumen);

export default router;
