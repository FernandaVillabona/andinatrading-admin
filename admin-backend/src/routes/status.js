import express from "express";
import pool from "../db/connection.js";
const router = express.Router();

router.get("/db-status", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
