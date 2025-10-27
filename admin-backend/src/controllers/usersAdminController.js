import { pool } from "../db/connection.js";

const buildWhere = (tipo, q) => {
  const where = [];
  const params = [];

  if (tipo && ["ADMIN", "COMISIONISTA", "INVERSIONISTA"].includes(tipo.toUpperCase())) {
    where.push("tipo = ?");
    params.push(tipo.toUpperCase());
  }

  if (q) {
    where.push("(nombre LIKE ? OR correo LIKE ? OR IFNULL(telefono,'') LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSQL, params };
};


export const listAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vista_todos_usuarios LIMIT 10");
    console.log("🟢 Vista devuelta:", rows.length, "registros");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error directo:", err);
    res.status(500).json({ error: err.message });
  }
};



export const getUserByGlobalId = async (req, res) => {
  try {
    const { id_global } = req.params;

    const [rows] = await pool.query(
      `
      SELECT id_global, tipo, id_origen, nombre, correo, telefono,
             ciudad, pais, saldo, fecha_alta, estado, porcentaje_comision
      FROM vw_usuarios_all
      WHERE id_global = ?
      `,
      [id_global]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo detalle de usuario", details: err.message });
  }
};

export const getUsersSummary = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tipo, COUNT(*) AS total
      FROM vista_todos_usuarios
      GROUP BY tipo
    `);

    const map = { ADMIN: 0, COMISIONISTA: 0, INVERSIONISTA: 0 };
    rows.forEach(r => map[r.tipo] = r.total);

    res.json({
      admins: map.ADMIN || 0,
      comisionistas: map.COMISIONISTA || 0,
      inversionistas: map.INVERSIONISTA || 0,
      total: (map.ADMIN || 0) + (map.COMISIONISTA || 0) + (map.INVERSIONISTA || 0)
    });
  } catch (err) {
    res.status(500).json({ error: "Error en resumen de usuarios", details: err.message });
  }
};

