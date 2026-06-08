import Usuario from "../../Modelos/usuario/usuario.js";
import Permiso from "../../Modelos/usuario/permisos.js";
import UsuarioPermiso from "../../Modelos/usuario/usuario_permiso.js";
import Rol from "../../Modelos/usuario/roles.js";
import { Op } from "sequelize";
import sequelize from "../../db/db.js";

/* =====================================================
   GET /api/usuarios/:id/permisos-directos
   ===================================================== */
export const getPermisosDirectosUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: ["id", "nombre", "email"],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const permisosDirectos = await UsuarioPermiso.findAll({
      where: { usuarioId: id },
      include: [
        {
          model: Permiso,
          as: "permiso",
          attributes: ["id", "nombre", "descripcion"],
        },
      ],
      order: [[{ model: Permiso, as: "permiso" }, "nombre", "ASC"]],
    });

    return res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      permisosDirectos: permisosDirectos.map((up) => ({
        id: up.permiso.id,
        nombre: up.permiso.nombre,
        descripcion: up.permiso.descripcion,
        motivo: up.motivo || null,
        fechaInicio: up.fechaInicio || null,
        fechaFin: up.fechaFin || null,
        otorgadoPor: up.otorgadoPor || null,
        createdAt: up.createdAt,
      })),
    });
  } catch (error) {
    console.error("getPermisosDirectosUsuario:", error);
    return res.status(500).json({ error: "Error al obtener permisos directos" });
  }
};

/* =====================================================
   POST /api/usuarios/:id/permisos-directos
   ===================================================== */
export const asignarPermisoDirecto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { permisoId, motivo, fechaInicio, fechaFin } = req.body;

    if (!permisoId) {
      return res.status(400).json({ error: "permisoId es requerido" });
    }

    if (fechaInicio && fechaFin && new Date(fechaInicio) >= new Date(fechaFin)) {
      return res.status(400).json({ error: "fechaInicio debe ser anterior a fechaFin" });
    }

    const [usuario, permiso] = await Promise.all([
      Usuario.findByPk(id, { transaction: t }),
      Permiso.findByPk(permisoId, { transaction: t }),
    ]);

    if (!usuario) throw new Error("Usuario no encontrado");
    if (!permiso) throw new Error("Permiso no encontrado");

    const existe = await UsuarioPermiso.findOne({
      where: { usuarioId: id, permisoId },
      transaction: t,
    });

    if (existe) throw new Error("El permiso ya está asignado directamente");

    const asignacion = await UsuarioPermiso.create(
      {
        usuarioId: id,
        permisoId,
        otorgadoPor: req.usuario?.id || null,
        motivo: motivo?.trim() || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      },
      { transaction: t }
    );

    await t.commit();

    const permisoAsignado = await Permiso.findByPk(permisoId, {
      attributes: ["id", "nombre", "descripcion"],
    });

    return res.status(201).json({
      message: "Permiso directo asignado correctamente",
      asignacion: {
        id: asignacion.id,
        permiso: permisoAsignado,
        motivo: asignacion.motivo,
        fechaInicio: asignacion.fechaInicio,
        fechaFin: asignacion.fechaFin,
        createdAt: asignacion.createdAt,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("asignarPermisoDirecto:", error);
    const status = error.message.includes("no encontrado") ? 404 : 500;
    return res.status(status).json({
      error: error.message || "Error al asignar permiso directo",
    });
  }
};

/* =====================================================
   DELETE /api/usuarios/:id/permisos-directos/:permisoId
   ===================================================== */
export const quitarPermisoDirecto = async (req, res) => {
  try {
    const { id, permisoId } = req.params;
    if (!id || !permisoId) {
      return res.status(400).json({ error: "ID de usuario y permiso requeridos" });
    }

    const eliminado = await UsuarioPermiso.destroy({
      where: { usuarioId: id, permisoId },
    });

    if (eliminado === 0) {
      return res.status(404).json({ error: "El permiso directo no estaba asignado" });
    }

    return res.json({
      message: "Permiso directo removido correctamente",
      permisoId: Number(permisoId),
    });
  } catch (error) {
    console.error("quitarPermisoDirecto:", error);
    return res.status(500).json({ error: "Error al quitar permiso directo" });
  }
};

/* =====================================================
   GET /api/usuarios/:id/permisos-efectivos
   ===================================================== */
export const getPermisosEfectivosUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: ["id", "nombre", "email", "activo", "rolId"],
      include: [
        {
          model: Rol,
          as: "Rols",             // ✅ alias del belongsToMany (tabla intermedia)
          attributes: ["id", "nombre"],
          through: { attributes: [] },
          include: [
            {
              model: Permiso,
              attributes: ["id", "nombre", "descripcion"],
              through: { attributes: [] },
            },
          ],
        },
        {
          model: Rol,
          as: "rol",              // ✅ alias del belongsTo directo (rolId en tabla)
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Permisos de roles (via tabla intermedia)
    const permisosDeRoles = new Set();
    usuario.Rols?.forEach((rol) => {
      rol.Permisos?.forEach((p) => permisosDeRoles.add(p.nombre));
    });

    // Permisos directos
    const permisosDirectos = await UsuarioPermiso.findAll({
      where: { usuarioId: id },
      include: [
        {
          model: Permiso,
          as: "permiso",
          attributes: ["nombre"],
        },
      ],
    });

    const permisosDirectosNombres = permisosDirectos.map((up) => up.permiso.nombre);

    const todosLosPermisos = new Set([...permisosDeRoles, ...permisosDirectosNombres]);
    const permisosEfectivos = Array.from(todosLosPermisos).sort();

    return res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        activo: usuario.activo,
        rolId: usuario.rolId,           // ✅ incluido para el frontend
        Rols: usuario.Rols,             // ✅ incluido para el modal de asignación
        rol: usuario.rol,               // ✅ incluido como alternativa directa
      },
      permisosEfectivos,
      detalle: {
        deRoles: Array.from(permisosDeRoles).sort(),
        directos: permisosDirectosNombres.sort(),
      },
    });
  } catch (error) {
    console.error("getPermisosEfectivosUsuario:", error);
    return res.status(500).json({ error: "Error al obtener permisos efectivos" });
  }
};