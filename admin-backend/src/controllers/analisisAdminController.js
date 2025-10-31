import { pool } from "../db/connection.js";

/* ============================================================
   📊 1. Acciones actuales de inversionistas
   ============================================================ */
export const getAccionesActuales = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        aa.id AS id_registro,
        i.id AS inversionista_id,
        CONCAT(i.nombre, ' ', i.apellido) AS inversionista,
        e.nombre AS empresa,
        aa.acciones AS cantidad_acciones,
        e.precio AS precio_actual,
        (aa.acciones * e.precio) AS valor_total
      FROM acciones_actuales aa
      JOIN inversionista i ON i.id = aa.inversionista_id
      JOIN empresas e ON e.id = aa.empresa_id
      ORDER BY valor_total DESC;
    `);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error obteniendo acciones actuales:", err);
    res.status(500).json({
      error: "Error al obtener acciones actuales",
      details: err.message,
    });
  }
};

/* ============================================================
   💰 2. Historial de compras y ventas (tabla orden)
   ============================================================ */
export const getHistorialOrdenes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id AS id_orden,
        o.tipo_orden,
        o.estado,
        o.valor_orden,
        o.valor_comision,
        o.fecha_creacion,
        i.id AS inversionista_id,
        CONCAT(i.nombre, ' ', i.apellido) AS inversionista,
        c.id AS comisionista_id,
        c.nombre_completo AS comisionista,
        e.nombre AS empresa
      FROM orden o
      JOIN inversionista i ON i.id = o.inversionista_id
      JOIN comisionista c ON c.id = o.comisionista_id
      JOIN empresas e ON e.id = o.empresa_id
      ORDER BY o.fecha_creacion DESC;
    `);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error obteniendo historial de órdenes:", err);
    res.status(500).json({
      error: "Error al obtener historial de órdenes",
      details: err.message,
    });
  }
};

/* ============================================================
   🪙 3. Movimientos financieros (tabla movimiento)
   ============================================================ */
/* 🪙 3. Movimientos financieros (tabla movimiento) */
export const getMovimientosFinancieros = async (req, res) => {
  try {
    const { inversionista_id, desde, hasta } = req.query;

    const where = [];
    const params = [];
    if (inversionista_id) { where.push('m.inversionista_id = ?'); params.push(inversionista_id); }
    if (desde)            { where.push('m.fecha >= ?');           params.push(desde); }
    if (hasta)            { where.push('m.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(hasta); }

    const sql = `
      SELECT 
        m.id,
        m.fecha,
        m.tipo,
        m.monto,
        m.empresa,                    
        m.inversionista_id,
        CONCAT(i.nombre,' ',i.apellido) AS nombre_inversionista
      FROM movimiento m
      LEFT JOIN inversionista i ON i.id = m.inversionista_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.fecha DESC
      LIMIT 500
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows); // <-- el front espera un ARRAY
  } catch (err) {
    console.error('❌ Error obteniendo movimientos financieros:', err);
    res.status(500).json({ error: 'Error al obtener movimientos financieros', details: err.message });
  }
};


/* ============================================================
   🏦 4. Top empresas más operadas (por cantidad de órdenes)
   ============================================================ */
export const getTopEmpresasOperadas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id AS empresa_id,
        e.nombre AS empresa,
        COUNT(o.id) AS total_ordenes,
        SUM(o.valor_orden) AS monto_total,
        SUM(o.valor_comision) AS total_comisiones
      FROM orden o
      JOIN empresas e ON e.id = o.empresa_id
      WHERE o.estado = 'APROBADA'
      GROUP BY e.id, e.nombre
      ORDER BY total_ordenes DESC, monto_total DESC
      LIMIT 10;
    `);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error obteniendo top empresas:", err);
    res.status(500).json({
      error: "Error al obtener top empresas más operadas",
      details: err.message,
    });
  }
};
