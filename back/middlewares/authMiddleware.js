import jwt from "jsonwebtoken";
import Usuario from "../Modelos/usuario/usuario.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no válido" });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Usuario inactivo, acceso denegado" });
    }

    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      rolId: usuario.rolId,
    };

    next();
  } catch (error) {
    console.error("verificarToken:", error);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
