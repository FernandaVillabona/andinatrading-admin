import { pool } from "../db/connection.js";

export const getLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        logs.id,
        COALESCE(u.nombre_completo, c.nombre_completo, i.nombre) AS usuario,
        logs.accion,
        logs.modulo,
        logs.fecha
      FROM logs
      LEFT JOIN usuario u ON u.id = logs.usuario_id
      LEFT JOIN comisionista c ON c.id = logs.usuario_id
      LEFT JOIN inversionista i ON i.id = logs.usuario_id
      ORDER BY logs.fecha DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener logs:", err);
    res.status(500).json({ error: "Error al obtener logs", details: err.message });
  }
};
