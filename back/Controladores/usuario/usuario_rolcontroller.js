// Controladores/UsuarioRolController.js
import UsuarioRol from "../../Modelos/usuario/usuario_rol.js";

// ==============================
// GET /api/usuario-rol
// ==============================
export const getUsuarioRoles = async (req, res) => {
  try {
    const usuarioRoles = await UsuarioRol.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(usuarioRoles);
  } catch (error) {
    console.error("getUsuarioRoles:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener los roles de usuario" });
  }
};

// ==============================
// GET /api/usuario-rol/:id
// ==============================
export const getUsuarioRolById = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioRol = await UsuarioRol.findByPk(id);

    if (!usuarioRol) {
      return res
        .status(404)
        .json({ error: "Asignación usuario-rol no encontrada" });
    }

    return res.status(200).json(usuarioRol);
  } catch (error) {
    console.error("getUsuarioRolById:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener la asignación usuario-rol" });
  }
};

// ==============================
// POST /api/usuario-rol
// body: { usuarioId, rolId }
// ==============================
export const createUsuarioRol = async (req, res) => {
  try {
    const { usuarioId, rolId } = req.body;

    if (!usuarioId || !rolId) {
      return res
        .status(400)
        .json({ error: "usuarioId y rolId son requeridos" });
    }

    const nuevoUsuarioRol = await UsuarioRol.create({
      usuarioId,
      rolId,
      asignadoAt: new Date(),
    });

    return res.status(201).json(nuevoUsuarioRol);
  } catch (error) {
    console.error("createUsuarioRol:", error);
    return res
      .status(400)
      .json({ error: "Error al asignar el rol al usuario" });
  }
};

// ==============================
// PUT /api/usuario-rol/:id
// body: { usuarioId?, rolId? }
// ==============================
export const updateUsuarioRol = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioRol = await UsuarioRol.findByPk(id);

    if (!usuarioRol) {
      return res
        .status(404)
        .json({ error: "Asignación usuario-rol no encontrada" });
    }

    const { usuarioId, rolId } = req.body;

    await usuarioRol.update({
      ...(usuarioId !== undefined ? { usuarioId } : {}),
      ...(rolId !== undefined ? { rolId } : {}),
    });

    return res.status(200).json(usuarioRol);
  } catch (error) {
    console.error("updateUsuarioRol:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la asignación usuario-rol" });
  }
};

// ==============================
// DELETE /api/usuario-rol/:id
// ==============================
export const deleteUsuarioRol = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioRol = await UsuarioRol.findByPk(id);

    if (!usuarioRol) {
      return res
        .status(404)
        .json({ error: "Asignación usuario-rol no encontrada" });
    }

    await usuarioRol.destroy();

    return res.status(200).json({
      message: "Rol desasignado del usuario correctamente",
    });
  } catch (error) {
    console.error("deleteUsuarioRol:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar la asignación usuario-rol" });
  }
};
