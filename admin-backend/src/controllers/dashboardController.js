import { pool } from "../db/connection.js";

export const getDashboardData = async (req, res) => {
  try {
    // 🧮 Totales (se asegura que devuelvan 0 si no hay registros)
    const [[totalAdmins]] = await pool.query(
      "SELECT COALESCE(COUNT(*), 0) AS total FROM usuario WHERE tipo_usuario = 'ADMIN'"
    );

    const [[totalComisionistas]] = await pool.query(
      "SELECT COALESCE(COUNT(*), 0) AS total FROM comisionista"
    );

    const [[totalInversionistas]] = await pool.query(
      "SELECT COALESCE(COUNT(*), 0) AS total FROM inversionista"
    );

    const [[totalOrdenes]] = await pool.query(
      "SELECT COALESCE(COUNT(*), 0) AS total FROM orden"
    );

    // 📜 Últimos 5 eventos del historial
    const [ultimosHistorial] = await pool.query(`
      SELECT h.descripcion, h.modulo, h.tipo_evento, h.fecha_evento, u.nombre_completo AS usuario
      FROM historial h
      LEFT JOIN usuario u ON u.id = h.usuario_id
      ORDER BY h.fecha_evento DESC
      LIMIT 5
    `);

    // 🧾 Últimos 5 logs (inicio de sesión, backups, etc.)
    const [ultimosLogs] = await pool.query(`
      SELECT l.accion, l.modulo, l.fecha, u.nombre_completo AS usuario
      FROM logs l
      LEFT JOIN usuario u ON u.id = l.usuario_id
      ORDER BY l.fecha DESC
      LIMIT 5
    `);

    // 📊 Respuesta JSON consolidada
    res.json({
      resumen: {
        admins: totalAdmins.total || 0,
        comisionistas: totalComisionistas.total || 0,
        inversionistas: totalInversionistas.total || 0,
        ordenes: totalOrdenes.total || 0,
      },
      actividad: {
        historial_reciente: ultimosHistorial || [],
        logs_recientes: ultimosLogs || [],
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener datos del dashboard:", error);
    res.status(500).json({
      error: "Error al obtener los datos del dashboard",
      details: error.message,
    });
  }
};
