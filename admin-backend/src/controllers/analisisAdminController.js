import { pool } from "../db/connection.js";



/* ============================================================
   📊 1) Acciones actuales de inversionistas (con fallback _i/_id)
   ============================================================ */
export const getAccionesActuales = async (req, res) => {
  const sqlA = `
    SELECT 
      aa.id                                   AS id_registro,
      i.id                                     AS inversionista_id,
      CONCAT(i.nombre,' ',i.apellido)          AS inversionista,
      e.id                                     AS empresa_id,
      e.nombre                                 AS empresa,
      aa.acciones                              AS cantidad_acciones,
      e.\`precio\`                              AS precio_actual,
      (aa.acciones * e.\`precio\`)             AS valor_total
    FROM acciones_actuales aa
    LEFT JOIN inversionista i ON i.id = aa.\`inversionista_i\`
    LEFT JOIN empresas     e ON e.id = aa.\`empresa_i\`
    ORDER BY valor_total IS NULL, valor_total DESC, aa.id DESC
  `;

  // Variante B: si la tabla usa inversionista_id / empresa_id
  const sqlB = `
    SELECT 
      aa.id                                   AS id_registro,
      i.id                                     AS inversionista_id,
      CONCAT(i.nombre,' ',i.apellido)          AS inversionista,
      e.id                                     AS empresa_id,
      e.nombre                                 AS empresa,
      aa.acciones                              AS cantidad_acciones,
      e.\`precio\`                              AS precio_actual,
      (aa.acciones * e.\`precio\`)             AS valor_total
    FROM acciones_actuales aa
    LEFT JOIN inversionista i ON i.id = aa.\`inversionista_id\`
    LEFT JOIN empresas     e ON e.id = aa.\`empresa_id\`
    ORDER BY valor_total IS NULL, valor_total DESC, aa.id DESC
  `;

  try {
    let [rows] = await pool.query(sqlA);
    return res.json({ base_total: rows.length, total: rows.length, data: rows });
  } catch (err) {
    // Si falló por columna desconocida, probamos la otra variante
    if (err?.code === 'ER_BAD_FIELD_ERROR') {
      try {
        const [rowsB] = await pool.query(sqlB);
        return res.json({ base_total: rowsB.length, total: rowsB.length, data: rowsB });
      } catch (errB) {
        console.error("❌ Error (variante _id) acciones actuales:", errB);
        return res.status(500).json({ error: "Error al obtener acciones actuales", details: errB.message });
      }
    }
    console.error("❌ Error (variante _i) acciones actuales:", err);
    return res.status(500).json({ error: "Error al obtener acciones actuales", details: err.message });
  }
};


/* ============================================================
   💰 2) Historial de órdenes (compras/ventas)
   Tabla: orden (… numero_accione, empresa_i, comisionista_i, inversionista_i …)
   ============================================================ */
export const getHistorialOrdenes = async (_req, res) => {
  try {
    const [[{ base_total }]] = await pool.query(
      `SELECT COUNT(*) AS base_total FROM orden`
    );

    const [rows] = await pool.query(`
      SELECT 
        o.id                                      AS id_orden,
        o.tipo_orden,
        o.estado,
        o.numero_accione                          AS numero_acciones,  -- ⚠️ tu col real
        o.valor_orden,
        o.valor_comision,
        o.fecha_creacion,
        o.inversionista_i                         AS inversionista_id,
        CONCAT(i.nombre,' ',i.apellido)           AS inversionista,
        o.comisionista_i                          AS comisionista_id,
        c.nombre_completo                         AS comisionista,
        o.empresa_i                               AS empresa_id,
        e.nombre                                  AS empresa
      FROM orden o
      LEFT JOIN inversionista i ON i.id = o.inversionista_i
      LEFT JOIN comisionista  c ON c.id = o.comisionista_i
      LEFT JOIN empresas      e ON e.id = o.empresa_i
      ORDER BY o.fecha_creacion DESC, o.id DESC
    `);

    res.json({ base_total, total: rows.length, data: rows });
  } catch (err) {
    console.error("❌ Historial órdenes:", err);
    res.status(500).json({ error: "Error al obtener historial de órdenes", details: err.message });
  }
};

/* ============================================================
   🪙 3) Movimientos financieros
   Tabla: movimiento (id, empresa, fecha, monto, tipo, inversionista_i)
   Filtros: ?inversionista_id=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
   ============================================================ */
export const getMovimientosFinancieros = async (req, res) => {
  try {
    const { inversionista_id, desde, hasta } = req.query;

    const where = [];
    const params = [];
    if (inversionista_id) { where.push('m.inversionista_i = ?'); params.push(inversionista_id); }
    if (desde)            { where.push('m.fecha >= ?');          params.push(desde); }
    if (hasta)            { where.push('m.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(hasta); }

    const sql = `
      SELECT 
        m.id,
        m.fecha,
        m.tipo,
        m.monto,
        m.empresa,
        m.inversionista_i                        AS inversionista_id,
        CONCAT(i.nombre,' ',i.apellido)          AS nombre_inversionista
      FROM movimiento m
      LEFT JOIN inversionista i ON i.id = m.inversionista_i
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.fecha DESC, m.id DESC
      LIMIT 500
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows); // tu front espera array
  } catch (err) {
    console.error("❌ Movimientos:", err);
    res.status(500).json({ error: "Error al obtener movimientos", details: err.message });
  }
};



export const getTopEmpresasOperadas = async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    const where = [];
    const params = [];
    if (estado) { where.push('o.estado = ?'); params.push(String(estado).toUpperCase()); }
    if (desde)  { where.push('o.fecha_creacion >= ?'); params.push(desde); }
    if (hasta)  { where.push('o.fecha_creacion < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(hasta); }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `
      SELECT 
        o.empresa_id                                   AS empresa_id,
        COALESCE(e.nombre, CONCAT('Empresa ', o.empresa_id)) AS empresa,
        COUNT(o.id)                                    AS total_ordenes,
        COALESCE(SUM(o.valor_orden),0)                 AS volumen,
        COALESCE(SUM(o.valor_comision),0)              AS total_comisiones
      FROM orden o
      LEFT JOIN empresas e ON e.id = o.empresa_id
      ${whereSQL}
      GROUP BY o.empresa_id, e.nombre
      ORDER BY total_ordenes DESC, volumen DESC
      LIMIT ?
      `,
      [...params, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Error obteniendo top empresas:', err);
    res.status(500).json({ error: 'Error al obtener top empresas', details: err.message });
  }
};


