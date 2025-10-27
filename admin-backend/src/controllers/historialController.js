// src/controllers/historialController.js
import { pool } from "../db/connection.js";

// 🔹 Obtener todo el historial (ordenado por fecha descendente)
export const getHistorial = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        h.id,
        u.nombre_completo AS usuario,
        h.descripcion,
        h.modulo,
        h.tipo_evento,
        h.fecha_evento
      FROM historial h
      LEFT JOIN usuario u ON u.id = h.usuario_id
      ORDER BY h.fecha_evento DESC;
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial", details: error.message });
  }
};

// 🔹 Filtrar historial por módulo (Usuarios, Órdenes, Backups, etc.)
export const getHistorialByModulo = async (req, res) => {
  try {
    const { modulo } = req.params;
    const [rows] = await pool.query(
      `
      SELECT 
        h.id,
        u.nombre_completo AS usuario,
        h.descripcion,
        h.modulo,
        h.tipo_evento,
        h.fecha_evento
      FROM historial h
      LEFT JOIN usuario u ON u.id = h.usuario_id
      WHERE h.modulo = ?
      ORDER BY h.fecha_evento DESC;
    `,
      [modulo]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial por módulo:", error);
    res.status(500).json({ error: "Error al obtener historial por módulo", details: error.message });
  }
};

// 🔹 Filtrar historial por tipo de evento (CREACIÓN, MODIFICACIÓN, etc.)
export const getHistorialByEvento = async (req, res) => {
  try {
    const { tipo_evento } = req.params;
    const [rows] = await pool.query(
      `
      SELECT 
        h.id,
        u.nombre_completo AS usuario,
        h.descripcion,
        h.modulo,
        h.tipo_evento,
        h.fecha_evento
      FROM historial h
      LEFT JOIN usuario u ON u.id = h.usuario_id
      WHERE h.tipo_evento = ?
      ORDER BY h.fecha_evento DESC;
    `,
      [tipo_evento]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial por tipo de evento:", error);
    res.status(500).json({ error: "Error al obtener historial por tipo de evento", details: error.message });
  }
};

// 🔹 Historial con paginación (útil para dashboard con scroll infinito)
export const getHistorialPaginado = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `
      SELECT 
        h.id,
        u.nombre_completo AS usuario,
        h.descripcion,
        h.modulo,
        h.tipo_evento,
        h.fecha_evento
      FROM historial h
      LEFT JOIN usuario u ON u.id = h.usuario_id
      ORDER BY h.fecha_evento DESC
      LIMIT ? OFFSET ?;
    `,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM historial");

    res.status(200).json({
      page,
      total,
      totalPages: Math.ceil(total / limit),
      results: rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener historial paginado:", error);
    res.status(500).json({ error: "Error al obtener historial paginado", details: error.message });
  }
};

// 🔹 Resumen de actividad para dashboard
export const getHistorialResumen = async (req, res) => {
  try {
    // 🔸 Conteo por tipo de evento
    const [porTipo] = await pool.query(`
      SELECT tipo_evento, COUNT(*) AS total
      FROM historial
      GROUP BY tipo_evento
      ORDER BY total DESC;
    `);

    // 🔸 Conteo por módulo
    const [porModulo] = await pool.query(`
      SELECT modulo, COUNT(*) AS total
      FROM historial
      GROUP BY modulo
      ORDER BY total DESC
      LIMIT 6;
    `);

    // 🔸 Actividad de los últimos 30 días
const [actividadReciente] = await pool.query(`
  SELECT fecha, COUNT(*) AS total
  FROM (
    SELECT DATE(fecha_evento) AS fecha
    FROM historial
    WHERE fecha_evento >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  ) AS sub
  GROUP BY fecha
  ORDER BY fecha ASC;
`);

    res.status(200).json({
      resumen: {
        por_tipo: porTipo,
        por_modulo: porModulo,
        actividad_30_dias: actividadReciente
      }
    });
  } catch (error) {
    console.error("❌ Error al obtener resumen de historial:", error);
    res.status(500).json({
      error: "Error al obtener resumen del historial",
      details: error.message
    });
  }
};

