// Controladores/RolController.js
import Rol from "../../Modelos/usuario/roles.js"; // ✅ ajusta si tu carpeta real es Modelo o Modelos

// ==============================
// GET /api/roles
// ==============================
export const getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(roles);
  } catch (error) {
    console.error("getRoles:", error);
    return res.status(500).json({ error: "Error al obtener los roles" });
  }
};

// ==============================
// GET /api/roles/:id
// ==============================
export const getRolById = async (req, res) => {
  const { id } = req.params;

  try {
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    return res.status(200).json(rol);
  } catch (error) {
    console.error("getRolById:", error);
    return res.status(500).json({ error: "Error al obtener el rol" });
  }
};

// ==============================
// POST /api/roles
// body: { nombre, descripcion? }
// ==============================
export const createRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: "El nombre del rol es obligatorio" });
    }

    const nuevoRol = await Rol.create({
      nombre: String(nombre).trim().toUpperCase(), // ✅ opcional: normaliza a MAYÚSCULAS
      descripcion: descripcion ?? null,
    });

    return res.status(201).json(nuevoRol);
  } catch (error) {
    console.error("createRol:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe un rol con ese nombre" });
    }

    return res.status(400).json({
      error: "Error al crear el rol",
      details: error.message,
    });
  }
};

// ==============================
// PUT /api/roles/:id
// body: { nombre?, descripcion? }
// ==============================
export const updateRol = async (req, res) => {
  const { id } = req.params;

  try {
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    const { nombre, descripcion } = req.body;

    await rol.update({
      ...(nombre !== undefined ? { nombre: String(nombre).trim().toUpperCase() } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
    });

    return res.status(200).json(rol);
  } catch (error) {
    console.error("updateRol:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe un rol con ese nombre" });
    }

    return res.status(500).json({ error: "Error al actualizar el rol" });
  }
};

// ==============================
// DELETE /api/roles/:id
// ==============================
export const deleteRol = async (req, res) => {
  const { id } = req.params;

  try {
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    await rol.destroy();

    return res.status(200).json({ message: "Rol eliminado correctamente" });
  } catch (error) {
    console.error("deleteRol:", error);
    return res.status(500).json({ error: "Error al eliminar el rol" });
  }
};
