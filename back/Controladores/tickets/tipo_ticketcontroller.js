// Controladores/tickets/TipoTicketController.js
import tipo_ticket from "../../Modelos/tickets/tipo_ticket.js";

// ==============================
// GET /api/tipo-ticket
// ==============================
export const getTipos = async (req, res) => {
  try {
    const tipos = await tipo_ticket.findAll({
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json(tipos);
  } catch (error) {
    console.error("getTipos:", error);
    return res.status(500).json({ error: "Error al obtener los tipos de ticket" });
  }
};

// ==============================
// GET /api/tipo-ticket/:id
// ==============================
export const getTipoById = async (req, res) => {
  try {
    const tipo = await tipo_ticket.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });
    }
    return res.status(200).json(tipo);
  } catch (error) {
    console.error("getTipoById:", error);
    return res.status(500).json({ error: "Error al obtener el tipo de ticket" });
  }
};

// ==============================
// POST /api/tipo-ticket
// body: { nombre, descripcion, createdByUserId? }
// ==============================
export const createTipo = async (req, res) => {
  try {
    const { nombre, descripcion, createdByUserId } = req.body;

    if (!nombre?.trim() || !descripcion?.trim()) {
      return res.status(400).json({ error: "nombre y descripcion son obligatorios" });
    }

    const nuevoTipo = await tipo_ticket.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      createdByUserId: createdByUserId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json(nuevoTipo);
  } catch (error) {
    console.error("createTipo:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe un tipo con ese nombre" });
    }
    return res.status(400).json({ error: "Error al crear el tipo de ticket" });
  }
};

// ==============================
// PUT /api/tipo-ticket/:id
// body: { nombre?, descripcion? }
// ==============================
export const updateTipo = async (req, res) => {
  try {
    const tipo = await tipo_ticket.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });
    }

    const { nombre, descripcion } = req.body;

    await tipo.update({
      ...(nombre      !== undefined ? { nombre: nombre.trim() }           : {}),
      ...(descripcion !== undefined ? { descripcion: descripcion.trim() } : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(tipo);
  } catch (error) {
    console.error("updateTipo:", error);
    return res.status(500).json({ error: "Error al actualizar el tipo de ticket" });
  }
};

// ==============================
// DELETE /api/tipo-ticket/:id
// ==============================
export const deleteTipo = async (req, res) => {
  try {
    const tipo = await tipo_ticket.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });
    }
    await tipo.destroy();
    return res.status(200).json({ message: "Tipo de ticket eliminado correctamente" });
  } catch (error) {
    console.error("deleteTipo:", error);
    return res.status(500).json({ error: "Error al eliminar el tipo de ticket" });
  }
};

export default { getTipos, getTipoById, createTipo, updateTipo, deleteTipo };