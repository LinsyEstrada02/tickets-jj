// Controladores/tickets/TicketSeguimientoController.js
import ticket_seguimiento from "../../Modelos/tickets/tickets_seguimiento.js";
import tickets from "../../Modelos/tickets/tickets.js";
import estado_ticket from "../../Modelos/tickets/estado_ticket.js";
import Usuario from "../../Modelos/usuario/usuario.js";

// ==============================
// GET /api/ticket-seguimiento?ticketId=X
// ==============================
export const getSeguimientoByTicket = async (req, res) => {
  try {
    const { ticketId } = req.query;
    if (!ticketId) {
      return res.status(400).json({ error: "ticketId es requerido" });
    }

    const seguimientos = await ticket_seguimiento.findAll({
      where: { ticketId: Number(ticketId) },
      include: [
        {
          model: estado_ticket,
          as: "estadoTicket",
          attributes: ["id", "nombre", "nombreVerboso"],
        },
        {
          model: Usuario,
          as: "tecnico",
          attributes: ["id", "nombre", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "creadoPor",
          attributes: ["id", "nombre"],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json(seguimientos);
  } catch (error) {
    console.error("getSeguimientoByTicket:", error);
    return res.status(500).json({ error: "Error al obtener el seguimiento" });
  }
};

// ==============================
// GET /api/ticket-seguimiento/:id
// ==============================
export const getSeguimientoById = async (req, res) => {
  try {
    const seguimiento = await ticket_seguimiento.findByPk(req.params.id, {
      include: [
        { model: estado_ticket, as: "estadoTicket", attributes: ["id", "nombre", "nombreVerboso"] },
        { model: Usuario, as: "tecnico", attributes: ["id", "nombre"], required: false },
        { model: Usuario, as: "creadoPor", attributes: ["id", "nombre"], required: false },
      ],
    });
    if (!seguimiento) {
      return res.status(404).json({ error: "Seguimiento no encontrado" });
    }
    return res.status(200).json(seguimiento);
  } catch (error) {
    console.error("getSeguimientoById:", error);
    return res.status(500).json({ error: "Error al obtener el seguimiento" });
  }
};

// ==============================
// POST /api/ticket-seguimiento
// body: { ticketId, tecnicoId, estadoTicketId, descripcionDeCambio, automatico?, createdByUserId?, imagen? }
// ==============================
export const createSeguimiento = async (req, res) => {
  try {
    const {
      ticketId,
      tecnicoId,
      estadoTicketId,
      descripcionDeCambio,
      automatico = false,
      createdByUserId,
    } = req.body;

    if (!ticketId || !tecnicoId || !estadoTicketId || !descripcionDeCambio?.trim()) {
      return res.status(400).json({
        error: "ticketId, tecnicoId, estadoTicketId y descripcionDeCambio son obligatorios",
      });
    }

    const ticket = await tickets.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    // Actualizar el estado del ticket también
    await ticket.update({
      estadoTicketId: Number(estadoTicketId),
      tecnicoId: Number(tecnicoId),
      updatedAt: new Date(),
    });

    const nuevoSeguimiento = await ticket_seguimiento.create({
      ticketId: Number(ticketId),
      tecnicoId: Number(tecnicoId),
      estadoTicketId: Number(estadoTicketId),
      descripcionDeCambio: descripcionDeCambio.trim(),
      automatico: automatico === true || automatico === "true",
      createdByUserId: createdByUserId ?? null,
      imagen: req.file?.buffer ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const seguimientoCompleto = await ticket_seguimiento.findByPk(nuevoSeguimiento.id, {
      include: [
        { model: estado_ticket, as: "estadoTicket", attributes: ["id", "nombre", "nombreVerboso"] },
        { model: Usuario, as: "tecnico", attributes: ["id", "nombre"], required: false },
      ],
    });

    return res.status(201).json(seguimientoCompleto);
  } catch (error) {
    console.error("createSeguimiento:", error);
    return res.status(400).json({ error: "Error al crear el seguimiento" });
  }
};

// ==============================
// DELETE /api/ticket-seguimiento/:id
// ==============================
export const deleteSeguimiento = async (req, res) => {
  try {
    const seguimiento = await ticket_seguimiento.findByPk(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ error: "Seguimiento no encontrado" });
    }
    await seguimiento.destroy();
    return res.status(200).json({ message: "Seguimiento eliminado correctamente" });
  } catch (error) {
    console.error("deleteSeguimiento:", error);
    return res.status(500).json({ error: "Error al eliminar el seguimiento" });
  }
};

export default { getSeguimientoByTicket, getSeguimientoById, createSeguimiento, deleteSeguimiento };