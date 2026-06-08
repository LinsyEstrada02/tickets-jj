import UsuarioRol from "../Modelos/usuario/usuario_rol.js";
import Rol from "../Modelos/usuario/roles.js";

// Middleware para validar roles específicos (solo para acciones de modificación)
export const tieneRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario?.id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const rolesDb = await UsuarioRol.findAll({
        where: { usuarioId: req.usuario.id },
        include: [
          {
            model: Rol,
            attributes: ["id", "nombre"],
          },
        ],
      });

      if (!rolesDb.length) {
        return res.status(403).json({
          error: "Usuario sin roles asignados",
        });
      }

      const rolesIds = rolesDb.map((r) => r.rolId);
      const rolesNames = rolesDb
        .map((r) => r.Rol?.nombre)
        .filter(Boolean)
        .map((n) => String(n).toUpperCase().trim());

      const permitidosIds = rolesPermitidos
        .filter((x) => typeof x === "number" || /^\d+$/.test(String(x)))
        .map((x) => Number(x));

      const permitidosNames = rolesPermitidos
        .filter((x) => typeof x === "string" && isNaN(Number(x)))
        .map((x) => x.toUpperCase().trim());

      const autorizadoPorId =
        permitidosIds.length > 0 &&
        rolesIds.some((id) => permitidosIds.includes(id));

      const autorizadoPorNombre =
        permitidosNames.length > 0 &&
        rolesNames.some((nombre) => permitidosNames.includes(nombre));

      if (!autorizadoPorId && !autorizadoPorNombre) {
        return res.status(403).json({
          error: "No tienes permisos para esta acción",
        });
      }

      next();
    } catch (error) {
      console.error("tieneRol:", error);
      return res.status(500).json({
        error: "Error al validar permisos",
      });
    }
  };
};

// Middleware para VISTA: permitir siempre si es propio, o si es admin si es de otro
export const puedeVerPermisos = (req, res, next) => {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const userId = Number(req.usuario.id);
    const targetId = Number(req.params.id);

    // Cualquier usuario autenticado puede ver sus propios permisos
    if (userId === targetId) {
      return next();
    }

    // Si es de otro usuario → solo admin
    return tieneRol(1, "ADMIN", "ADMINISTRADOR")(req, res, next);
  } catch (error) {
    console.error("puedeVerPermisos:", error);
    return res.status(500).json({ error: "Error al validar acceso" });
  }
};