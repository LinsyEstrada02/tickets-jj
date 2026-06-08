// Controladores/tickets/EstadoTicketController.js
import estado_ticket from "../../Modelos/tickets/estado_ticket.js";

// ==============================
// GET /api/estado-ticket
// ==============================
export const getEstados = async (req, res) => {
  try {
    const estados = await estado_ticket.findAll({
      order: [["id", "ASC"]],
    });
    return res.status(200).json(estados);
  } catch (error) {
    console.error("getEstados:", error);
    return res.status(500).json({ error: "Error al obtener los estados de ticket" });
  }
};

// ==============================
// GET /api/estado-ticket/:id
// ==============================
export const getEstadoById = async (req, res) => {
  try {
    const estado = await estado_ticket.findByPk(req.params.id);
    if (!estado) {
      return res.status(404).json({ error: "Estado no encontrado" });
    }
    return res.status(200).json(estado);
  } catch (error) {
    console.error("getEstadoById:", error);
    return res.status(500).json({ error: "Error al obtener el estado" });
  }
};

// ==============================
// POST /api/estado-ticket
// body: { nombre, nombreVerboso, descripcion, createdByUserId? }
// ==============================
export const createEstado = async (req, res) => {
  try {
    const { nombre, nombreVerboso, descripcion, createdByUserId } = req.body;

    if (!nombre?.trim() || !nombreVerboso?.trim() || !descripcion?.trim()) {
      return res.status(400).json({ error: "nombre, nombreVerboso y descripcion son obligatorios" });
    }

    const nuevoEstado = await estado_ticket.create({
      nombre: nombre.trim().toUpperCase(),
      nombreVerboso: nombreVerboso.trim(),
      descripcion: descripcion.trim(),
      createdByUserId: createdByUserId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json(nuevoEstado);
  } catch (error) {
    console.error("createEstado:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe un estado con ese nombre" });
    }
    return res.status(400).json({ error: "Error al crear el estado" });
  }
};

// ==============================
// PUT /api/estado-ticket/:id
// body: { nombre?, nombreVerboso?, descripcion? }
// ==============================
export const updateEstado = async (req, res) => {
  try {
    const estado = await estado_ticket.findByPk(req.params.id);
    if (!estado) {
      return res.status(404).json({ error: "Estado no encontrado" });
    }

    const { nombre, nombreVerboso, descripcion } = req.body;

    await estado.update({
      ...(nombre       !== undefined ? { nombre: nombre.trim().toUpperCase() }   : {}),
      ...(nombreVerboso !== undefined ? { nombreVerboso: nombreVerboso.trim() }  : {}),
      ...(descripcion  !== undefined ? { descripcion: descripcion.trim() }       : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(estado);
  } catch (error) {
    console.error("updateEstado:", error);
    return res.status(500).json({ error: "Error al actualizar el estado" });
  }
};

// ==============================
// DELETE /api/estado-ticket/:id
// ==============================
export const deleteEstado = async (req, res) => {
  try {
    const estado = await estado_ticket.findByPk(req.params.id);
    if (!estado) {
      return res.status(404).json({ error: "Estado no encontrado" });
    }
    await estado.destroy();
    return res.status(200).json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("deleteEstado:", error);
    return res.status(500).json({ error: "Error al eliminar el estado" });
  }
};

export default { getEstados, getEstadoById, createEstado, updateEstado, deleteEstado };