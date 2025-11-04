import { pool } from "../db/connection.js";
import bcrypt from "bcryptjs";

export const getMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre_completo, correo, tipo_usuario, estado, fecha_creacion, ultima_conexion
       FROM usuario WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo perfil", details: e.message });
  }
};

export const updateMyName = async (req, res) => {
  try {
    const { nombre_completo } = req.body;
    if (!nombre_completo || String(nombre_completo).trim().length < 3) {
      return res.status(400).json({ error: "Nombre inválido" });
    }
    await pool.query(
      `UPDATE usuario SET nombre_completo = ? WHERE id = ?`,
      [String(nombre_completo).trim(), req.user.id]
    );
    res.json({ message: "Nombre actualizado correctamente" });
  } catch (e) {
    res.status(500).json({ error: "Error actualizando nombre", details: e.message });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { actual, nueva } = req.body;

    if (!actual || !nueva) {
      return res.status(400).json({ error: "Faltan campos: actual y nueva" });
    }
    if (String(nueva).length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const [rows] = await pool.query(
      `SELECT contrasena FROM usuario WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });

    const hashActual = rows[0].contrasena;
    const ok = await bcrypt.compare(actual, hashActual);
    if (!ok) return res.status(401).json({ error: "Contraseña actual incorrecta" });

    const misma = await bcrypt.compare(nueva, hashActual);
    if (misma) return res.status(400).json({ error: "La nueva contraseña no puede ser igual a la actual" });

    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const nuevoHash = await bcrypt.hash(String(nueva), rounds);

    await pool.query(`UPDATE usuario SET contrasena = ? WHERE id = ?`, [nuevoHash, req.user.id]);

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (e) {
    res.status(500).json({ error: "Error actualizando contraseña", details: e.message });
  }
};
