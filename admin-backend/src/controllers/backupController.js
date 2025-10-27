import { exec } from "child_process";
import { pool } from "../db/connection.js";
import path from "path";
import fs from "fs";

// 🔹 Crear carpeta "backups" si no existe
const BACKUP_DIR = path.resolve("backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// 🔹 Obtener lista de backups
export const getBackups = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id, b.nombre_archivo, b.tipo_backup, b.estado, b.fecha_creacion, u.nombre_completo AS usuario
      FROM backups b
      LEFT JOIN usuario u ON u.id = b.usuario_id
      ORDER BY b.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener backups", details: err.message });
  }
};

// 🔹 Generar backup manual
export const generarBackup = async (req, res) => {
  const userId = req.user?.id || null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const nombreArchivo = `backup_andinatrading_${timestamp}.sql`;
  const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);

  const comando = `mysqldump -h ${process.env.DB_HOST} -P ${process.env.DB_PORT} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${rutaArchivo}"`;

  // Guardar en BD antes de ejecutar
  await pool.query(
    "INSERT INTO backups (nombre_archivo, ruta_archivo, tipo_backup, estado, usuario_id) VALUES (?, ?, 'MANUAL', 'EN_PROCESO', ?)",
    [nombreArchivo, rutaArchivo, userId]
  );

  exec(comando, async (error) => {
    if (error) {
      console.error("❌ Error al generar backup:", error);
      await pool.query(
        "UPDATE backups SET estado = 'FALLIDO' WHERE nombre_archivo = ?",
        [nombreArchivo]
      );
      return res.status(500).json({ error: "Error al crear el backup", details: error.message });
    }

    // ✅ Actualiza estado en backups
    await pool.query(
      "UPDATE backups SET estado = 'EXITOSO' WHERE nombre_archivo = ?",
      [nombreArchivo]
    );

    // 🧾 Registra en historial
    await pool.query(
      "INSERT INTO historial (usuario_id, descripcion, modulo, tipo_evento) VALUES (?, ?, 'Backups', 'RESPALDO')",
      [userId, `Backup generado correctamente: ${nombreArchivo}`]
    );

    // 🪵 Registra en logs
    await pool.query(
      "INSERT INTO logs (usuario_id, accion, modulo, ip_origen) VALUES (?, ?, 'Backups', '::1')",
      [userId, `Backup manual generado: ${nombreArchivo}`]
    );

    console.log(`✅ Backup creado: ${nombreArchivo}`);
    res.json({
      message: "Backup generado correctamente",
      archivo: nombreArchivo,
    });
  });
};
