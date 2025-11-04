import { pool } from "../db/connection.js";
import { validationResult, body } from "express-validator";  
import { hashPassword, randomPassword } from "../utils/auth.js"; 
import { sendMail } from "../utils/mailer.js"; 


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

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${unionSQL}) AS t ${whereSQL}`,
      params
    );
    const total = countRows[0].total || 0;

    const [rows] = await pool.query(
      `
      SELECT * FROM (${unionSQL}) AS t
      ${whereSQL}
      ORDER BY ${sort} ${safeOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [countsByType] = await pool.query(`
      SELECT 'ADMIN' AS tipo, COUNT(*) AS total FROM usuario
      UNION ALL
      SELECT 'COMISIONISTA', COUNT(*) FROM comisionista
      UNION ALL
      SELECT 'INVERSIONISTA', COUNT(*) FROM inversionista
    `);

    const map = { ADMIN: 0, COMISIONISTA: 0, INVERSIONISTA: 0 };
    countsByType.forEach(r => map[r.tipo] = r.total);

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
      WHERE tipo_usuario = 'ADMIN'         -- ✅ IMPORTANTE
      ORDER BY fecha_creacion DESC
    `);
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    console.error("❌ Error obteniendo administradores:", err);
    res.status(500).json({ error: "Error al obtener administradores", details: err.message });
  }
};


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





export const validateInviteAdmin = [
  body('nombre_completo').trim().notEmpty().withMessage('nombre_completo es requerido'),
  body('correo').isEmail().withMessage('correo inválido').toLowerCase(),
];

const inviteEmail = ({ nombre, correo, tempPass }) => {
  const appName = process.env.APP_NAME || 'Tu App';
  const appUrl  = process.env.APP_URL  || '#';
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:#111827;color:#fff;padding:20px 24px">
      <h2 style="margin:0;font-size:20px">${appName}</h2>
    </div>
    <div style="padding:24px">
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Has sido invitado como <strong>Administrador</strong> en <strong>${appName}</strong>.</p>
      <p>Credenciales temporales:</p>
      <div style="background:#F3F4F6;padding:16px;border-radius:10px;margin:12px 0">
        <div><strong>Correo:</strong> ${correo}</div>
        <div><strong>Contraseña temporal:</strong> ${tempPass}</div>
      </div>
      <p>Accede desde: <a href="${appUrl}" target="_blank" style="color:#2563EB">${appUrl}</a></p>
      <p style="color:#6B7280;font-size:12px;margin-top:24px">Por seguridad, cambia tu contraseña al ingresar.</p>
    </div>
  </div>`;
};

export const inviteAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validación', details: errors.array() });

    const { nombre_completo, correo } = req.body;

    const [exists] = await pool.query(`SELECT id FROM usuario WHERE correo = ? LIMIT 1`, [correo]);
    if (exists.length) return res.status(409).json({ error: 'El correo ya está registrado' });

    const tempPassword = randomPassword(12);
    const passHash = await hashPassword(tempPassword);

    const [result] = await pool.query(
      `INSERT INTO usuario (nombre_completo, correo, contrasena, tipo_usuario, estado, fecha_creacion)
       VALUES (?, ?, ?, 'ADMIN', 'ACTIVO', NOW())`,
      [nombre_completo, correo, passHash]
    );

    let mailWarning = null;
    try {
      await sendMail({
        to: correo,
        subject: `Invitación como Administrador - ${process.env.APP_NAME || 'Tu App'}`,
        html: inviteEmail({ nombre: nombre_completo, correo, tempPass: tempPassword }),
      });
    } catch (e) {
      console.error('✉️  No se pudo enviar el correo de invitación:', e?.message || e);
      mailWarning = 'Usuario creado, pero no se pudo enviar el correo de invitación.';
    }

    return res.status(201).json({
      message: mailWarning || 'Administrador creado e invitación enviada',
      data: {
        id: result.insertId,
        nombre_completo,
        correo,
        tipo_usuario: 'ADMIN',
        estado: 'ACTIVO',
      },
      warning: mailWarning || undefined,
    });
  } catch (err) {
    console.error('❌ Error invitando admin:', err);
    return res.status(500).json({ error: 'Error invitando admin', details: err.message });
  }
};



