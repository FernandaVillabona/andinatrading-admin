import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";

const router = express.Router();

// 🔹 GET /api/dashboard → estadísticas generales
router.get("/", getDashboardData);

export default router;
