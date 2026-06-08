import prioridad_ticket from "../../Modelos/tickets/prioridad_ticket.js";

// ==============================
// GET /api/prioridad-ticket
// ==============================
export const getPrioridades = async (req, res) => {
  try {
    const prioridades = await prioridad_ticket.findAll({
      order: [["id", "ASC"]],
    });
    return res.status(200).json(prioridades);
  } catch (error) {
    console.error("getPrioridades:", error);
    return res.status(500).json({ error: "Error al obtener prioridades" });
  }
};

// ==============================
// GET /api/prioridad-ticket/:id
// ==============================
export const getPrioridadById = async (req, res) => {
  try {
    const prioridad = await prioridad_ticket.findByPk(req.params.id);

    if (!prioridad) {
      return res.status(404).json({ error: "Prioridad no encontrada" });
    }

    return res.status(200).json(prioridad);
  } catch (error) {
    console.error("getPrioridadById:", error);
    return res.status(500).json({ error: "Error al obtener prioridad" });
  }
};

// ==============================
// POST /api/prioridad-ticket
// ==============================
export const createPrioridad = async (req, res) => {
  try {
    const { nombre, nombreVerboso, descripcion, createdByUserId } = req.body;

    if (!nombre?.trim() || !nombreVerboso?.trim() || !descripcion?.trim()) {
      return res.status(400).json({
        error: "nombre, nombreVerboso y descripcion son obligatorios",
      });
    }

    const nueva = await prioridad_ticket.create({
      nombre: nombre.trim().toUpperCase(),
      nombreVerboso: nombreVerboso.trim(),
      descripcion: descripcion.trim(),
      createdByUserId: createdByUserId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error("createPrioridad:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Ya existe una prioridad con ese nombre",
      });
    }

    return res.status(500).json({
      error: "Error al crear prioridad",
    });
  }
};

// ==============================
// PUT /api/prioridad-ticket/:id
// ==============================
export const updatePrioridad = async (req, res) => {
  try {
    const prioridad = await prioridad_ticket.findByPk(req.params.id);

    if (!prioridad) {
      return res.status(404).json({ error: "Prioridad no encontrada" });
    }

    const { nombre, nombreVerboso, descripcion } = req.body;

    await prioridad.update({
      ...(nombre !== undefined ? { nombre: nombre.trim().toUpperCase() } : {}),
      ...(nombreVerboso !== undefined
        ? { nombreVerboso: nombreVerboso.trim() }
        : {}),
      ...(descripcion !== undefined
        ? { descripcion: descripcion.trim() }
        : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(prioridad);
  } catch (error) {
    console.error("updatePrioridad:", error);
    return res.status(500).json({
      error: "Error al actualizar prioridad",
    });
  }
};

// ==============================
// DELETE /api/prioridad-ticket/:id
// ==============================
export const deletePrioridad = async (req, res) => {
  try {
    const prioridad = await prioridad_ticket.findByPk(req.params.id);

    if (!prioridad) {
      return res.status(404).json({ error: "Prioridad no encontrada" });
    }

    await prioridad.destroy();

    return res.status(200).json({
      message: "Prioridad eliminada correctamente",
    });
  } catch (error) {
    console.error("deletePrioridad:", error);
    return res.status(500).json({
      error: "Error al eliminar prioridad",
    });
  }
};

export default {
  getPrioridades,
  getPrioridadById,
  createPrioridad,
  updatePrioridad,
  deletePrioridad,
};