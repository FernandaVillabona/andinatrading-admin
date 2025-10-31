import { pool } from "../db/connection.js";

export const getOrdenesDetalle = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id AS id_orden,
        o.tipo_orden,
        o.estado,
        o.valor_orden,
        o.valor_comision,
        o.fecha_creacion,
        o.fecha_aprobacion,
        o.fecha_ejecucion,
        o.fecha_rechazo,

        -- 🔹 Datos del comisionista
        c.id AS id_comisionista,
        c.nombre_completo AS nombre_comisionista,
        c.correo AS correo_comisionista,
        c.usuario AS usuario_comisionista,

        -- 🔹 Datos del inversionista
        i.id AS id_inversionista,
        CONCAT(i.nombre, ' ', i.apellido) AS nombre_inversionista,
        i.correo AS correo_inversionista,
        i.telefono AS telefono_inversionista,

        -- 🔹 Ciudad y país
        ciu.nombre AS ciudad_inversionista,
        p.nombre AS pais_inversionista

      FROM orden o
      LEFT JOIN comisionista c ON o.comisionista_id = c.id
      LEFT JOIN inversionista i ON o.inversionista_id = i.id
      LEFT JOIN ciudad ciu ON i.ciudad_id = ciu.id
      LEFT JOIN pais p ON i.pais_id = p.id
      ORDER BY o.fecha_creacion DESC;
    `);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error al obtener órdenes:", err);
    res.status(500).json({ error: "Error al obtener órdenes", details: err.message });
  }
};
