// Controladores/TecnicoController.js
import Tecnico from "../../Modelos/usuario/tecnicos.js";

// ==============================
// GET /api/tecnicos
// ==============================
export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await Tecnico.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(tecnicos);
  } catch (error) {
    console.error("getTecnicos:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener los técnicos" });
  }
};

// ==============================
// GET /api/tecnicos/:id
// ==============================
export const getTecnicoById = async (req, res) => {
  const { id } = req.params;

  try {
    const tecnico = await Tecnico.findByPk(id);

    if (!tecnico) {
      return res.status(404).json({ error: "Técnico no encontrado" });
    }

    return res.status(200).json(tecnico);
  } catch (error) {
    console.error("getTecnicoById:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener el técnico" });
  }
};


// ==============================
// POST /api/tecnicos
// body: { email, nombre, supervisor?, createdByUserId? }
// ==============================
export const createTecnico = async (req, res) => {
  try {
    const { email, nombre, supervisor, createdByUserId } = req.body;

    if (!email || !nombre) {
      return res
        .status(400)
        .json({ error: "Email y nombre son obligatorios" });
    }

    const nuevoTecnico = await Tecnico.create({
      email,
      nombre,
      supervisor: supervisor ?? 0,
      createdByUserId: createdByUserId ?? null,
    });

    return res.status(201).json(nuevoTecnico);
  } catch (error) {
    console.error("createTecnico:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ error: "Ya existe un técnico con ese email" });
    }

    return res
      .status(400)
      .json({ error: "Error al crear el técnico" });
  }
};

// ==============================
// PUT /api/tecnicos/:id
// body: { email?, nombre?, supervisor? }
// ==============================
export const updateTecnico = async (req, res) => {
  const { id } = req.params;

  try {
    const tecnico = await Tecnico.findByPk(id);

    if (!tecnico) {
      return res.status(404).json({ error: "Técnico no encontrado" });
    }

    const { email, nombre, supervisor } = req.body;

    await tecnico.update({
      ...(email !== undefined ? { email } : {}),
      ...(nombre !== undefined ? { nombre } : {}),
      ...(supervisor !== undefined ? { supervisor } : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(tecnico);
  } catch (error) {
    console.error("updateTecnico:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar el técnico" });
  }
};

// ==============================
// DELETE /api/tecnicos/:id
// ==============================
export const deleteTecnico = async (req, res) => {
  const { id } = req.params;

  try {
    const tecnico = await Tecnico.findByPk(id);

    if (!tecnico) {
      return res.status(404).json({ error: "Técnico no encontrado" });
    }

    await tecnico.destroy();

    return res.status(200).json({
      message: "Técnico eliminado correctamente",
    });
  } catch (error) {
    console.error("deleteTecnico:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar el técnico" });
  }
};
