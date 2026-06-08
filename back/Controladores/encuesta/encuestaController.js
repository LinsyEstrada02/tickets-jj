import encuesta_satisfaccion from "../../Modelos/encuesta/encuesta_satisfaccion.js";
import tickets from "../../Modelos/tickets/tickets.js";
import estado_ticket from "../../Modelos/tickets/estado_ticket.js";
import Usuario from "../../Modelos/usuario/usuario.js";
import departamento_solicitante from "../../Modelos/departamento.solicitante/departamento_solicitante.js";
import { Op } from "sequelize";

// ────────────────────────────────────────────────────────
//  GET /api/encuesta/:ticketId
// ────────────────────────────────────────────────────────
export const getEncuesta = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await tickets.findByPk(ticketId, {
      include: [
        { model: estado_ticket, as: "estadoTicket", attributes: ["nombre"] },
        { model: Usuario, as: "tecnico", attributes: ["id", "nombre"], required: false },
      ],
      attributes: ["id", "noSolicitud", "descripcion", "estadoTicketId"],
    });

    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    if (ticket.estadoTicket?.nombre !== "CERRADO")
      return res.status(400).json({ error: "El ticket aún no ha sido cerrado" });

    const yaRespondida = await encuesta_satisfaccion.findOne({ where: { ticketId } });
    if (yaRespondida) return res.status(409).json({ error: "Esta encuesta ya fue respondida" });

    return res.status(200).json({
      noSolicitud: ticket.noSolicitud,
      descripcion: ticket.descripcion,
      tecnico:     ticket.tecnico ?? null,
    });
  } catch (error) {
    console.error("getEncuesta:", error);
    return res.status(500).json({ error: "Error al obtener la encuesta" });
  }
};

// ────────────────────────────────────────────────────────
//  POST /api/encuesta/:ticketId
// ────────────────────────────────────────────────────────
export const responderEncuesta = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: "La calificación debe ser un número entre 1 y 5" });

    const ticket = await tickets.findByPk(ticketId, {
      include: [{ model: estado_ticket, as: "estadoTicket", attributes: ["nombre"] }],
    });

    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    if (ticket.estadoTicket?.nombre !== "CERRADO")
      return res.status(400).json({ error: "Solo se puede encuestar tickets cerrados" });

    const yaRespondida = await encuesta_satisfaccion.findOne({ where: { ticketId } });
    if (yaRespondida) return res.status(409).json({ error: "Esta encuesta ya fue respondida" });

    const encuesta = await encuesta_satisfaccion.create({
      ticketId:     Number(ticketId),
      calificacion: Number(calificacion),
      comentario:   comentario?.trim() || null,
      respondidoAt: new Date(),
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });

    return res.status(201).json({
      ok: true,
      message: "Encuesta registrada correctamente",
      encuestaId: encuesta.id,
    });
  } catch (error) {
    console.error("responderEncuesta:", error);
    return res.status(500).json({ error: "Error al guardar la encuesta" });
  }
};

// ────────────────────────────────────────────────────────
//  GET /api/encuesta/resultados
// ────────────────────────────────────────────────────────
export const getResultadosEncuestas = async (req, res) => {
  try {
    const resultados = await encuesta_satisfaccion.findAll({
      include: [
        {
          model: tickets,
          as: "ticket",
          attributes: ["id", "noSolicitud", "descripcion"],
          include: [
            { model: Usuario, as: "solicitante", attributes: ["id", "nombre", "email"] },
            { model: Usuario, as: "tecnico", attributes: ["id", "nombre"], required: false },
            {
              model: departamento_solicitante,
              as: "departamento",
              attributes: ["id", "nombre", "abreviatura"],
              required: false,
            },
          ],
        },
      ],
      order: [["respondidoAt", "DESC"]],
    });

    const total    = resultados.length;
    const promedio = total > 0
      ? Number((resultados.reduce((sum, r) => sum + r.calificacion, 0) / total).toFixed(2))
      : null;

    const distribucion = [1, 2, 3, 4, 5].map((n) => ({
      calificacion: n,
      cantidad: resultados.filter((r) => r.calificacion === n).length,
    }));

    return res.status(200).json({ total, promedio, distribucion, resultados });
  } catch (error) {
    console.error("getResultadosEncuestas:", error);
    return res.status(500).json({ error: "Error al obtener resultados" });
  }
};

// ────────────────────────────────────────────────────────
//  GET /api/encuesta/resumen-mensual?mes=3&anio=2026
// ────────────────────────────────────────────────────────
export const getResumenMensual = async (req, res) => {
  try {
    const ahora = new Date();
    const mes   = parseInt(req.query.mes  ?? ahora.getMonth() + 1);
    const anio  = parseInt(req.query.anio ?? ahora.getFullYear());

    const inicio = new Date(anio, mes - 1, 1);
    const fin    = new Date(anio, mes, 0, 23, 59, 59, 999);

    const encuestas = await encuesta_satisfaccion.findAll({
      where: { respondidoAt: { [Op.between]: [inicio, fin] } },
      include: [
        {
          model: tickets,
          as: "ticket",
          attributes: ["id", "noSolicitud", "tecnicoId"],
          include: [
            {
              model: Usuario,
              as: "tecnico",
              attributes: ["id", "nombre", "email"],
              required: false,
            },
          ],
        },
      ],
    });

    if (encuestas.length === 0) {
      return res.status(200).json({
        mes, anio, totalEncuestas: 0,
        mejorTecnico: null, tecnicos: [],
      });
    }

    const mapaT = {};
    for (const e of encuestas) {
      const tecnico = e.ticket?.tecnico;
      if (!tecnico) continue;
      const key = tecnico.id;
      if (!mapaT[key]) {
        mapaT[key] = { tecnico, calificaciones: [], comentarios: [], totalTickets: 0 };
      }
      mapaT[key].calificaciones.push(e.calificacion);
      mapaT[key].totalTickets++;
      if (e.comentario) mapaT[key].comentarios.push(e.comentario);
    }

    const tecnicos = Object.values(mapaT).map((t) => ({
      tecnico:      t.tecnico,
      totalTickets: t.totalTickets,
      promedio:     Number((t.calificaciones.reduce((a, b) => a + b, 0) / t.calificaciones.length).toFixed(2)),
      comentarios:  t.comentarios,
      distribucion: [1, 2, 3, 4, 5].map((n) => ({
        calificacion: n,
        cantidad: t.calificaciones.filter((c) => c === n).length,
      })),
    })).sort((a, b) => b.promedio - a.promedio || b.totalTickets - a.totalTickets);

    return res.status(200).json({
      mes, anio,
      totalEncuestas: encuestas.length,
      mejorTecnico:   tecnicos[0] || null,
      tecnicos,
    });
  } catch (error) {
    console.error("getResumenMensual:", error);
    return res.status(500).json({ error: "Error al obtener resumen mensual" });
  }
};

export default { getEncuesta, responderEncuesta, getResultadosEncuestas, getResumenMensual };