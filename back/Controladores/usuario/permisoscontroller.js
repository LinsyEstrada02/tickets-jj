// Controladores/PermisoController.js
import Permiso from "../../Modelos/usuario/permisos.js";

// ==============================
// GET /api/permisos
// ==============================
export const getPermisos = async (req, res) => {
  try {
    const permisos = await Permiso.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(permisos);
  } catch (error) {
    console.error("getPermisos:", error);
    return res.status(500).json({
      error: "Error al obtener los permisos",
    });
  }
};

// ==============================
// GET /api/permisos/:id
// ==============================
export const getPermisoById = async (req, res) => {
  const { id } = req.params;

  try {
    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        error: "Permiso no encontrado",
      });
    }

    return res.status(200).json(permiso);
  } catch (error) {
    console.error("getPermisoById:", error);
    return res.status(500).json({
      error: "Error al obtener el permiso",
    });
  }
};

// ==============================
// POST /api/permisos
// body: { nombre, nombreVerboso, descripcion?, createdByUserId? }
// ==============================
export const createPermiso = async (req, res) => {
  try {
    const { nombre, nombreVerboso, descripcion, createdByUserId } = req.body;

    if (!nombre || !nombreVerboso) {
      return res.status(400).json({
        error: "nombre y nombreVerboso son obligatorios",
      });
    }

    const nuevoPermiso = await Permiso.create({
      nombre,
      nombreVerboso,
      descripcion: descripcion ?? null,
      createdByUserId: createdByUserId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json(nuevoPermiso);
  } catch (error) {
    console.error("createPermiso:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Ya existe un permiso con ese nombre",
      });
    }

    return res.status(400).json({
      error: "Error al crear el permiso",
      details: error.message,
    });
  }
};

// ==============================
// PUT /api/permisos/:id
// body: { nombre?, nombreVerboso?, descripcion? }
// ==============================
export const updatePermiso = async (req, res) => {
  const { id } = req.params;

  try {
    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        error: "Permiso no encontrado",
      });
    }

    const { nombre, nombreVerboso, descripcion } = req.body;

    await permiso.update({
      ...(nombre !== undefined ? { nombre } : {}),
      ...(nombreVerboso !== undefined ? { nombreVerboso } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(permiso);
  } catch (error) {
    console.error("updatePermiso:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Ya existe un permiso con ese nombre",
      });
    }

    return res.status(500).json({
      error: "Error al actualizar el permiso",
    });
  }
};

// ==============================
// DELETE /api/permisos/:id
// ==============================
export const deletePermiso = async (req, res) => {
  const { id } = req.params;

  try {
    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        error: "Permiso no encontrado",
      });
    }

    await permiso.destroy();

    return res.status(200).json({
      message: "Permiso eliminado correctamente",
    });
  } catch (error) {
    console.error("deletePermiso:", error);
    return res.status(500).json({
      error: "Error al eliminar el permiso",
    });
  }
};
