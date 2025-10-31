import { pool } from "../db/connection.js";

/**
 * Construcción dinámica de filtros
 */
const buildWhere = (tipo, q) => {
  const where = [];
  const params = [];

  if (tipo && ["ADMIN", "COMISIONISTA", "INVERSIONISTA"].includes(tipo.toUpperCase())) {
    where.push("tipo = ?");
    params.push(tipo.toUpperCase());
  }

  if (q) {
    where.push("(nombre LIKE ? OR correo LIKE ? OR IFNULL(telefono, '') LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSQL, params };
};

/**
 * 🔹 Listar todos los usuarios (unificados desde las 3 tablas)
 */
export const listAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      tipo,
      q,
      sort = "fecha_alta",
      order = "DESC",
    } = req.query;

    const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    const filtros = [];
    const params = [];

    if (tipo && ["ADMIN", "COMISIONISTA", "INVERSIONISTA"].includes(tipo.toUpperCase())) {
      filtros.push("tipo = ?");
      params.push(tipo.toUpperCase());
    }

    if (q) {
      filtros.push("(nombre LIKE ? OR correo LIKE ? OR IFNULL(telefono, '') LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSQL = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    // 🔹 Unión de las tres tablas
    const unionSQL = `
      SELECT 
        u.id AS id_global,
        'ADMIN' AS tipo,
        u.id AS id_origen,
        u.nombre_completo AS nombre,
        u.correo,
        NULL AS telefono,
        NULL AS ciudad,
        NULL AS pais,
        0 AS saldo,
        u.fecha_creacion AS fecha_alta,
        u.estado,
        NULL AS porcentaje_comision
      FROM usuario u

      UNION ALL

      SELECT 
        100000 + c.id AS id_global,
        'COMISIONISTA' AS tipo,
        c.id AS id_origen,
        c.nombre_completo AS nombre,
        c.correo,
        NULL AS telefono,
        c.ciudad,
        c.pais,
        c.saldo,
        c.created_at AS fecha_alta,
        'ACTIVO' AS estado,
        NULL AS porcentaje_comision
      FROM comisionista c

      UNION ALL

      SELECT 
        200000 + i.id AS id_global,
        'INVERSIONISTA' AS tipo,
        i.id AS id_origen,
        CONCAT(i.nombre, ' ', i.apellido) AS nombre,
        i.correo,
        i.telefono,
        ciu.nombre AS ciudad,
        p.nombre AS pais,
        i.saldo,
        i.ultima_conexion AS fecha_alta,
        'ACTIVO' AS estado,
        i.porcentaje_comision
      FROM inversionista i
      LEFT JOIN ciudad ciu ON ciu.id = i.ciudad_id
      LEFT JOIN pais p ON p.id = i.pais_id
    `;

    // 🔹 Total general
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${unionSQL}) AS t ${whereSQL}`,
      params
    );
    const total = countRows[0].total || 0;

    // 🔹 Obtener usuarios paginados
    const [rows] = await pool.query(
      `
      SELECT * FROM (${unionSQL}) AS t
      ${whereSQL}
      ORDER BY ${sort} ${safeOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    // 🔹 Contadores por tipo
    const [countsByType] = await pool.query(`
      SELECT 'ADMIN' AS tipo, COUNT(*) AS total FROM usuario
      UNION ALL
      SELECT 'COMISIONISTA', COUNT(*) FROM comisionista
      UNION ALL
      SELECT 'INVERSIONISTA', COUNT(*) FROM inversionista
    `);

    const map = { ADMIN: 0, COMISIONISTA: 0, INVERSIONISTA: 0 };
    countsByType.forEach(r => map[r.tipo] = r.total);

    // ✅ Respuesta combinada
    res.json({
      resumen: {
        admins: map.ADMIN,
        comisionistas: map.COMISIONISTA,
        inversionistas: map.INVERSIONISTA,
        total: map.ADMIN + map.COMISIONISTA + map.INVERSIONISTA,
      },
      page: Number(page),
      limit: Number(limit),
      total,
      total_pages: Math.ceil(total / limit),
      data: rows,
    });

  } catch (err) {
    console.error("❌ Error listando usuarios:", err);
    res.status(500).json({
      error: "Error al obtener usuarios",
      details: err.message,
    });
  }
};


/** 🔹 Administradores (tabla usuario) */
export const getAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id AS id_global,
        'ADMIN' AS tipo,
        id AS id_origen,
        nombre_completo AS nombre,
        correo,
        estado,
        fecha_creacion AS fecha_alta,
        ultima_conexion
      FROM usuario
      ORDER BY fecha_creacion DESC
    `);

    res.json({
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error("❌ Error obteniendo administradores:", err);
    res.status(500).json({ error: "Error al obtener administradores", details: err.message });
  }
};

/** 🔹 Comisionistas */
export const getComisionistas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id AS id_global,
        'COMISIONISTA' AS tipo,
        c.id AS id_origen,
        c.nombre_completo AS nombre,
        c.correo,
        c.usuario,
        c.saldo,
        c.ciudad,
        c.pais,
        c.created_at AS fecha_alta,
        c.ultima_conexion
      FROM comisionista c
      ORDER BY c.created_at DESC
    `);

    res.json({
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error("❌ Error obteniendo comisionistas:", err);
    res.status(500).json({ error: "Error al obtener comisionistas", details: err.message });
  }
};

/** 🔹 Inversionistas */
export const getInversionistas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.id AS id_global,
        'INVERSIONISTA' AS tipo,
        i.id AS id_origen,
        CONCAT(i.nombre, ' ', i.apellido) AS nombre,
        i.correo,
        i.telefono,
        ciu.nombre AS ciudad,
        p.nombre AS pais,
        i.saldo,
        i.porcentaje_comision,
        i.ultima_conexion AS fecha_alta
      FROM inversionista i
      LEFT JOIN ciudad ciu ON ciu.id = i.ciudad_id
      LEFT JOIN pais p ON p.id = i.pais_id
      ORDER BY i.id DESC
    `);

    res.json({
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error("❌ Error obteniendo inversionistas:", err);
    res.status(500).json({ error: "Error al obtener inversionistas", details: err.message });
  }
};

/** 🔹 Contadores globales */
export const getUsersSummary = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 'ADMIN' AS tipo, COUNT(*) AS total FROM usuario
      UNION ALL
      SELECT 'COMISIONISTA', COUNT(*) FROM comisionista
      UNION ALL
      SELECT 'INVERSIONISTA', COUNT(*) FROM inversionista
    `);

    const map = { ADMIN: 0, COMISIONISTA: 0, INVERSIONISTA: 0 };
    rows.forEach(r => (map[r.tipo] = r.total));

    res.json({
      admins: map.ADMIN,
      comisionistas: map.COMISIONISTA,
      inversionistas: map.INVERSIONISTA,
      total: map.ADMIN + map.COMISIONISTA + map.INVERSIONISTA,
    });
  } catch (err) {
    console.error("❌ Error en resumen:", err);
    res.status(500).json({ error: "Error en resumen de usuarios", details: err.message });
  }
};
