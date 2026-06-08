// Controladores/PermisoPorRolController.js
import PermisoPorRol from "../../Modelo/usuario/permisos_rol.js";

// ==============================
// GET /api/permisos-por-rol
// ==============================
export const getPermisosPorRol = async (req, res) => {
  try {
    const registros = await PermisoPorRol.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(registros);
  } catch (error) {
    console.error("getPermisosPorRol:", error);
    return res.status(500).json({
      error: "Error al obtener los permisos por rol",
    });
  }
};

// ==============================
// GET /api/permisos-por-rol/:id
// ==============================
export const getPermisoPorRolById = async (req, res) => {
  const { id } = req.params;

  try {
    const registro = await PermisoPorRol.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: "Registro permiso-rol no encontrado",
      });
    }

    return res.status(200).json(registro);
  } catch (error) {
    console.error("getPermisoPorRolById:", error);
    return res.status(500).json({
      error: "Error al obtener el registro permiso-rol",
    });
  }
};

// ==============================
// POST /api/permisos-por-rol
// body: { rolId, permisoId }
// ==============================
export const createPermisoPorRol = async (req, res) => {
  try {
    const { rolId, permisoId } = req.body;

    if (!rolId || !permisoId) {
      return res.status(400).json({
        error: "rolId y permisoId son obligatorios",
      });
    }

    // Evitar duplicados
    const existe = await PermisoPorRol.findOne({
      where: { rolId, permisoId },
    });

    if (existe) {
      return res.status(409).json({
        error: "El rol ya tiene asignado este permiso",
      });
    }

    const nuevoRegistro = await PermisoPorRol.create({
      rolId,
      permisoId,
      createdAt: new Date(),
    });

    return res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error("createPermisoPorRol:", error);
    return res.status(400).json({
      error: "Error al asignar el permiso al rol",
      details: error.message,
    });
  }
};

// ==============================
// DELETE /api/permisos-por-rol/:id
// ==============================
export const deletePermisoPorRol = async (req, res) => {
  const { id } = req.params;

  try {
    const registro = await PermisoPorRol.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: "Registro permiso-rol no encontrado",
      });
    }

    await registro.destroy();

    return res.status(200).json({
      message: "Permiso removido del rol correctamente",
    });
  } catch (error) {
    console.error("deletePermisoPorRol:", error);
    return res.status(500).json({
      error: "Error al eliminar el permiso del rol",
    });
  }
};
