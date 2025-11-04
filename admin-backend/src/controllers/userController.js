import { pool } from "../db/connection.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loginUser = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const [users] = await pool.query(
      "SELECT * FROM usuario WHERE correo = ? AND tipo_usuario = 'ADMIN' AND estado = 'ACTIVO'",
      [correo]
    );

    if (users.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado o sin permisos" });

    const user = users[0];
  

    await pool.query("UPDATE usuario SET ultima_conexion = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, tipo_usuario: user.tipo_usuario, correo: user.correo },
      process.env.JWT_SECRET || "supersecreto",
      { expiresIn: "2h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        nombre: user.nombre_completo,
        tipo: user.tipo_usuario,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión", details: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre_completo, correo, tipo_usuario, estado, fecha_creacion FROM usuario"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios", details: err.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { nombre_completo, correo, contrasena, tipo_usuario } = req.body;
    const hash = await bcrypt.hash(contrasena, 10);
    await pool.query(
      "INSERT INTO usuario (nombre_completo, correo, contrasena, tipo_usuario) VALUES (?, ?, ?, ?)",
      [nombre_completo, correo, hash, tipo_usuario]
    );
    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar usuario", details: err.message });
  }
  
};

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM vista_todos_usuarios ORDER BY tipo, nombre"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error al obtener usuarios unificados:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};


