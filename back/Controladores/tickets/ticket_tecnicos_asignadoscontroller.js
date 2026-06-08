// Controladores/tickets/TicketHistorialController.js
import ticket_tecnicos_asignados_historial from "../../Modelos/tickets/ticket_tecnicos_asignados_historial.js";
import tickets from "../../Modelos/tickets/tickets.js";
import Usuario from "../../Modelos/usuario/usuario.js";

// ==============================
// GET /api/ticket-historial?ticketId=X
// ==============================
export const getHistorialByTicket = async (req, res) => {
  try {
    const { ticketId } = req.query;
    if (!ticketId) {
      return res.status(400).json({ error: "ticketId es requerido" });
    }

    const historial = await ticket_tecnicos_asignados_historial.findAll({
      where: { ticketId: Number(ticketId) },
      include: [
        {
          model: Usuario,
          as: "tecnico",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "asignadoPor",
          attributes: ["id", "nombre"],
          required: false,
        },
      ],
      order: [["asignadoAt", "DESC"]],
    });

    return res.status(200).json(historial);
  } catch (error) {
    console.error("getHistorialByTicket:", error);
    return res.status(500).json({ error: "Error al obtener el historial" });
  }
};

// ==============================
// GET /api/ticket-historial/:id
// ==============================
export const getHistorialById = async (req, res) => {
  try {
    const registro = await ticket_tecnicos_asignados_historial.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: "tecnico", attributes: ["id", "nombre", "email"] },
        { model: Usuario, as: "asignadoPor", attributes: ["id", "nombre"], required: false },
      ],
    });
    if (!registro) {
      return res.status(404).json({ error: "Registro de historial no encontrado" });
    }
    return res.status(200).json(registro);
  } catch (error) {
    console.error("getHistorialById:", error);
    return res.status(500).json({ error: "Error al obtener el registro" });
  }
};

// ==============================
// POST /api/ticket-historial
// body: { ticketId, tecnicoId, asignadoPorUserId?, motivoCambio? }
// ==============================
export const createHistorial = async (req, res) => {
  try {
    const { ticketId, tecnicoId, asignadoPorUserId, motivoCambio } = req.body;

    if (!ticketId || !tecnicoId) {
      return res.status(400).json({ error: "ticketId y tecnicoId son obligatorios" });
    }

    const ticket = await tickets.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    // Cerrar asignación anterior si existe
    await ticket_tecnicos_asignados_historial.update(
      { desasignadoAt: new Date(), updatedAt: new Date() },
      {
        where: {
          ticketId: Number(ticketId),
          desasignadoAt: null,
        },
      }
    );

    const nuevoRegistro = await ticket_tecnicos_asignados_historial.create({
      ticketId: Number(ticketId),
      tecnicoId: Number(tecnicoId),
      asignadoPorUserId: asignadoPorUserId ?? null,
      motivoCambio: motivoCambio?.trim() ?? null,
      asignadoAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error("createHistorial:", error);
    return res.status(400).json({ error: "Error al registrar la asignación" });
  }
};

// ==============================
// PATCH /api/ticket-historial/:id/desasignar
// Cierra la asignación activa (pone desasignadoAt)
// ==============================
export const desasignarTecnico = async (req, res) => {
  try {
    const registro = await ticket_tecnicos_asignados_historial.findByPk(req.params.id);
    if (!registro) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
    if (registro.desasignadoAt) {
      return res.status(400).json({ error: "Este técnico ya fue desasignado" });
    }

    await registro.update({
      desasignadoAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({ message: "Técnico desasignado correctamente", registro });
  } catch (error) {
    console.error("desasignarTecnico:", error);
    return res.status(500).json({ error: "Error al desasignar técnico" });
  }
};

export default { getHistorialByTicket, getHistorialById, createHistorial, desasignarTecnico };