// src/controllers/backupController.js
import { pool } from "../db/connection.js";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.resolve("backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

/**
 * 📋 Obtener lista de backups
 */
export const getBackups = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.id, 
        b.nombre_archivo, 
        b.tipo_backup, 
        b.estado, 
        b.fecha_creacion, 
        u.nombre_completo AS usuario
      FROM backups b
      LEFT JOIN usuario u ON u.id = b.usuario_id
      ORDER BY b.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener backups:", err);
    res.status(500).json({ error: "Error al obtener backups", details: err.message });
  }
};

/**
 * 💾 Generar backup (modo SQL plano)
 */
export const generarBackup = async (req, res) => {
  const userId = req.user?.id || null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const nombreArchivo = `backup_andinatrading_${timestamp}.sql`;
  const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);

  try {
    const [tablas] = await pool.query("SHOW TABLES");
    const archivo = fs.createWriteStream(rutaArchivo, { encoding: "utf8" });

    for (const fila of tablas) {
      const tabla = Object.values(fila)[0];
      const [rows] = await pool.query(`SELECT * FROM \`${tabla}\``);

      archivo.write(`-- Backup de tabla ${tabla}\n`);
      rows.forEach((row) => {
        const values = Object.values(row)
          .map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
          .join(",");
        archivo.write(`INSERT INTO \`${tabla}\` VALUES(${values});\n`);
      });
      archivo.write("\n\n");
    }

    archivo.end();

    await pool.query(
      `INSERT INTO backups (nombre_archivo, ruta_archivo, tipo_backup, estado, usuario_id)
       VALUES (?, ?, 'MANUAL', 'EXITOSO', ?)`,
      [nombreArchivo, rutaArchivo, userId]
    );

    res.json({ message: "✅ Backup generado correctamente", archivo: nombreArchivo });
  } catch (err) {
    console.error("❌ Error al generar backup:", err.message);

    await pool.query(
      `INSERT INTO backups (nombre_archivo, ruta_archivo, tipo_backup, estado, usuario_id)
       VALUES (?, ?, 'MANUAL', 'FALLIDO', ?)`,
      [nombreArchivo, rutaArchivo, userId]
    );

    res.status(500).json({ error: "Error al crear backup", details: err.message });
  }
};

/**
 * 🗑️ Eliminar backup
 */
export const eliminarBackup = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT ruta_archivo FROM backups WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Backup no encontrado" });

    const ruta = rows[0].ruta_archivo;
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);

    await pool.query("DELETE FROM backups WHERE id = ?", [id]);

    res.json({ message: "🗑️ Backup eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando backup:", err);
    res.status(500).json({ error: "Error eliminando backup", details: err.message });
  }
};

/**
 * ⬇️ Descargar backup
 */
export const descargarBackup = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT nombre_archivo, ruta_archivo FROM backups WHERE id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Backup no encontrado" });

    const { nombre_archivo, ruta_archivo } = rows[0];

    if (!fs.existsSync(ruta_archivo))
      return res.status(404).json({ error: "Archivo no encontrado en servidor" });

    res.download(ruta_archivo, nombre_archivo);
  } catch (err) {
    console.error("❌ Error descargando backup:", err.message);
    res.status(500).json({ error: "Error al descargar backup", details: err.message });
  }
};
