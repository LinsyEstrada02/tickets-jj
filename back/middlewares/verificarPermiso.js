import Usuario from "../Modelos/usuario/usuario.js";
import Rol from "../Modelos/usuario/roles.js";
import Permiso from "../Modelos/usuario/permiso.js";

export const verificarPermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({
          error: "No autenticado",
        });
      }

      const usuario = await Usuario.findByPk(usuarioId, {
        include: {
          model: Rol,
          include: {
            model: Permiso,
            through: { attributes: [] },
          },
        },
      });

      if (!usuario) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      if (!usuario.Rol) {
        return res.status(403).json({
          error: "El usuario no tiene rol asignado",
        });
      }

      const permisos = usuario.Rol.Permisos.map((p) => p.nombre);

      if (!permisos.includes(permisoRequerido)) {
        return res.status(403).json({
          error: "No tiene permisos suficientes",
        });
      }

      next();
    } catch (error) {
      console.error("verificarPermiso:", error);
      return res.status(500).json({
        error: "Error al verificar permisos",
      });
    }
  };
};