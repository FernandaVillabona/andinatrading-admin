import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// ✅ Middleware para verificar si el token es válido
export const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// ✅ Middleware para asegurar que sea ADMIN
export const soloAdmin = (req, res, next) => {
  if (req.user?.tipo_usuario !== "ADMIN") {
    return res.status(403).json({ error: "Acceso denegado — Solo administradores" });
  }
  next();
};
