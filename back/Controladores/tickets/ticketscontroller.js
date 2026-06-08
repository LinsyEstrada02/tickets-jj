import tickets from "../../Modelos/tickets/tickets.js";
import estado_ticket from "../../Modelos/tickets/estado_ticket.js";
import tipo_ticket from "../../Modelos/tickets/tipo_ticket.js";
import Usuario from "../../Modelos/usuario/usuario.js";
import departamento_solicitante from "../../Modelos/departamento.solicitante/departamento_solicitante.js";
import sub_departamento_solicitante from "../../Modelos/departamento.solicitante/sub_departamento_solicitante.js";
import Edificio from "../../Modelos/tickets/edificio.js";
import Nivel from "../../Modelos/tickets/nivel.js";
import { 
  enviarCorreoAsignacionTecnico,
  enviarEncuestaTicket
} from "../../servicios/correosTickets.js";
import ticket_tecnicos_asignados_historial from "../../Modelos/tickets/ticket_tecnicos_asignados_historial.js";
import prioridad_ticket from "../../Modelos/tickets/prioridad_ticket.js";
import ticket_seguimiento from "../../Modelos/tickets/tickets_seguimiento.js";
import { Op } from "sequelize";
import ticket_comentarios from "../../Modelos/tickets/ticket_comentario.js";
import fs from "fs";
import path from "path";

/* ==============================
   INCLUDES REUTILIZABLES
================================ */
const INCLUDE_TICKET = [
  {
    model: estado_ticket,
    as: "estadoTicket",
    attributes: ["id", "nombre", "nombreVerboso"],
  },
  {
    model: tipo_ticket,
    as: "tipoTicket",
    attributes: ["id", "nombre"],
  },
  {
    model: departamento_solicitante,
    as: "departamento",
    attributes: ["id", "nombre", "abreviatura"],
  },
  {
    model: sub_departamento_solicitante,
    as: "subDepartamento",
    attributes: ["id", "nombre", "abreviatura"],
    required: false,
  },
  {
    model: Usuario,
    as: "solicitante",
    attributes: ["id", "nombre", "email"],
  },
  {
    model: Usuario,
    as: "tecnico",
    attributes: ["id", "nombre", "email"],
    required: false,
  },
  {
    model: Edificio,
    as: "edificio",
    attributes: ["id_edificio", "nombre"],
    required: false,
  },
  {
    model: Nivel,
    as: "nivel",
    attributes: ["id_nivel", "nombre"],
    required: false,
  },
  {
    model: prioridad_ticket,
    as: "prioridadTicket",
    attributes: ["id", "nombre", "nombreVerboso"],
    required: false,
  },
];

/* ==============================
   UTILIDADES
================================ */
const isValidDate = (d) => d instanceof Date && !isNaN(d);

const getPrioridadSinAsignarId = async () => {
  const p = await prioridad_ticket.findOne({ where: { nombre: "SIN_ASIGNAR" } });
  return p?.id ?? 4;
};

/* ==============================
   ELIMINAR ARCHIVOS DEL TICKET
================================ */
async function eliminarArchivosDelTicket(ticketId) {
  const uploadPath = process.env.UPLOADS_PATH || "S:\\";

  try {
    const comentarios = await ticket_comentarios.findAll({
      where: {
        ticketId,
        archivoUrl: { [Op.ne]: null },
      },
    });

    for (const comentario of comentarios) {
      const filename = comentario.archivoUrl;

      // ✅ Solo elimina imágenes, deja PDFs intactos
      const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
      if (!esImagen) {
        console.log("📄 PDF conservado:", filename);
        continue; // salta al siguiente sin borrar
      }

      const filePath = path.join(uploadPath, filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🗑️ Imagen eliminada:", filePath);
        }
        // ✅ No intentamos actualizar la BD para evitar el error del modelo
      } catch (err) {
        console.error("❌ Error eliminando imagen:", filePath, err.message);
      }
    }

    console.log(`✅ Imágenes del ticket ${ticketId} eliminadas correctamente`);
  } catch (err) {
    console.error("❌ Error en eliminarArchivosDelTicket:", err.message);
  }
}

/* ==============================
   GET /api/tickets
================================ */
export const getTickets = async (req, res) => {
  try {
    const {
      estadoId,
      solicitanteId,
      tecnicoId,
      prioridad,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (estadoId) {
  if (String(estadoId).toUpperCase() === "REABIERTO") {
    where.fueReabierto = true;
  } else {
    where.estadoTicketId = Number(estadoId);
  }
}
    if (solicitanteId) where.solicitanteId = Number(solicitanteId);
    if (tecnicoId) where.tecnicoId = Number(tecnicoId);
    if (prioridad) {
      if (/^\d+$/.test(String(prioridad))) {
        where.prioridadTicketId = Number(prioridad);
      } else {
        const prioridadDb = await prioridad_ticket.findOne({
          where: { nombre: String(prioridad).toUpperCase().trim() },
        });
        where.prioridadTicketId = prioridadDb?.id ?? 0;
      }
    }

    if (fechaDesde || fechaHasta) {
      where.fechaSolicitud = {};
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        if (isValidDate(desde)) where.fechaSolicitud[Op.gte] = desde;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        if (isValidDate(hasta)) {
          hasta.setHours(23, 59, 59, 999);
          where.fechaSolicitud[Op.lte] = hasta;
        }
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await tickets.findAndCountAll({
      where,
      include: INCLUDE_TICKET,
      order: [["fechaSolicitud", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return res.status(200).json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      tickets: rows,
    });
  } catch (error) {
    console.error("getTickets:", error);
    return res.status(500).json({ error: "Error al obtener los tickets" });
  }
};

/* ==============================
   GET /api/tickets/:id
================================ */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await tickets.findByPk(req.params.id, {
      include: [
        ...INCLUDE_TICKET,
        {
          model: ticket_comentarios,
          as: "comentarios",
          include: [
            {
              model: Usuario,
              as: "autor",
              attributes: ["id", "nombre", "email"],
            }
          ],
        }
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("getTicketById:", error);
    return res.status(500).json({ error: "Error al obtener el ticket" });
  }
};

/* ==============================
   POST /api/tickets
================================ */
export const createTicket = async (req, res) => {
  try {
    const solicitanteId = req.usuario?.id;

    if (!solicitanteId) {
      return res.status(401).json({ error: "Usuario no autenticado. Inicia sesión nuevamente." });
    }

    const {
      oficina,
      extension,
      tipoTicketId,
      tipoPersonalizado, // ← nuevo
      descripcion,
      createdByUserId,
      id_edificio,
      id_nivel,
      departamentoId,
      subDepartamento_SolicitanteId,
      prioridadTicketId,
    } = req.body;

    // Debe venir tipoTicketId O tipoPersonalizado, no ambos vacíos
    const tienetipoValido = tipoTicketId || tipoPersonalizado?.trim();

    if (
      !oficina?.trim() ||
      !extension?.trim() ||
      !tienetipoValido ||
      !descripcion?.trim() ||
      !id_edificio ||
      !id_nivel ||
      !departamentoId
    ) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: oficina, extension, tipo de ticket, descripcion, id_edificio, id_nivel, departamentoId",
      });
    }

    const estadoInicial = await estado_ticket.findOne({
      where: { nombre: "ABIERTO" },
    });

    if (!estadoInicial) {
      return res.status(500).json({ error: "No se encontró el estado inicial 'ABIERTO'" });
    }

    const noSolicitud = await generarNoSolicitud(departamentoId);
    const sinAsignarId = await getPrioridadSinAsignarId();

    const nuevoTicket = await tickets.create({
      noSolicitud,
      solicitanteId:                Number(solicitanteId),
      createdByUserId:              createdByUserId ?? solicitanteId,
      oficina:                      oficina.trim(),
      extension:                    extension.trim(),
      fechaSolicitud:               new Date(),
      tipoTicketId:                 tipoTicketId ? Number(tipoTicketId) : null,
      tipoPersonalizado:            tipoPersonalizado?.trim() || null, // ← nuevo
      estadoTicketId:               estadoInicial.id,
      descripcion:                  descripcion.trim(),
      departamentoId:               Number(departamentoId),
      subDepartamento_SolicitanteId: subDepartamento_SolicitanteId
        ? Number(subDepartamento_SolicitanteId)
        : null,
      id_edificio:                  Number(id_edificio),
      id_nivel:                     Number(id_nivel),
      tecnicoId:                    null,
      prioridadTicketId:            prioridadTicketId ? Number(prioridadTicketId) : sinAsignarId,
      anulado:                      false,
    });

    const ticketCompleto = await tickets.findByPk(nuevoTicket.id, {
      include: INCLUDE_TICKET,
    });

    return res.status(201).json(ticketCompleto);
  } catch (error) {
    console.error("createTicket - Error completo:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Error generando número de solicitud, intente de nuevo",
      });
    }

    return res.status(500).json({
      error: "Error al crear el ticket",
      mensaje: error.message,
    });
  }
};

/* ==============================
   GENERAR NO SOLICITUD
================================ */
async function generarNoSolicitud(departamentoId) {
  const year = new Date().getFullYear();
  const depto = await departamento_solicitante.findByPk(departamentoId, {
    attributes: ["abreviatura"],
  });
  const abreviatura = depto?.abreviatura?.toUpperCase() || "GEN";
  const base = `${abreviatura}-${year}`;

  const count = await tickets.count({
    where: {
      departamentoId,
      noSolicitud: { [Op.like]: `${base}-%` },
    },
  });

  const secuencial = String(count + 1).padStart(3, "0");
  return `${base}-${secuencial}`;
}

/* ==============================
   PUT /api/tickets/:id
================================ */
export const updateTicket = async (req, res) => {
  try {
    const ticket = await tickets.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const {
      oficina,
      extension,
      tipoTicketId,
      descripcion,
      departamentoId,
      estadoTicketId,
      tecnicoId,
      prioridad,
      prioridadTicketId,
    } = req.body;

    const estadoCerrado  = estadoTicketId ? await estado_ticket.findOne({ where: { nombre: "CERRADO"  } }) : null;
    const estadoResuelto = estadoTicketId ? await estado_ticket.findOne({ where: { nombre: "RESUELTO" } }) : null;

    const estaResolviendo = estadoTicketId && (
      Number(estadoTicketId) === estadoCerrado?.id ||
      Number(estadoTicketId) === estadoResuelto?.id
    );

    await ticket.update({
      ...(oficina           !== undefined ? { oficina: oficina.trim() }                : {}),
      ...(extension         !== undefined ? { extension: extension.trim() }            : {}),
      ...(tipoTicketId      !== undefined ? { tipoTicketId: Number(tipoTicketId) }     : {}),
      ...(descripcion       !== undefined ? { descripcion: descripcion.trim() }        : {}),
      ...(departamentoId    !== undefined ? { departamentoId: Number(departamentoId) } : {}),
      ...(estadoTicketId    !== undefined ? { estadoTicketId: Number(estadoTicketId) } : {}),
      ...(tecnicoId         !== undefined ? { tecnicoId: tecnicoId ? Number(tecnicoId) : null } : {}),
      ...(prioridad         !== undefined ? { prioridad }                              : {}),
      ...(prioridadTicketId !== undefined
        ? { prioridadTicketId: prioridadTicketId ? Number(prioridadTicketId) : null }
        : {}),
      ...(estaResolviendo ? { fechaResolucion: new Date() } : {}),
      updatedAt: new Date(),
    });

    /* ======================================
       VERIFICAR SI EL TICKET SE CERRÓ
    ====================================== */
    if (estadoTicketId && Number(estadoTicketId) === estadoCerrado?.id) {

      // ── 1. Eliminar archivos de la carpeta de red ──
      await eliminarArchivosDelTicket(ticket.id);

      // ── 2. Enviar encuesta al solicitante ──
      const ticketCompleto = await tickets.findByPk(ticket.id, {
        include: [
          {
            model: Usuario,
            as: "solicitante",
            attributes: ["nombre", "email"],
          },
        ],
      });

      if (ticketCompleto?.solicitante?.email) {
        const linkEncuesta = `${process.env.FRONT_URL}/encuesta/${ticket.id}`;
        await enviarEncuestaTicket({
          emailUsuario:  ticketCompleto.solicitante.email,
          nombreUsuario: ticketCompleto.solicitante.nombre,
          noSolicitud:   ticketCompleto.noSolicitud,
          linkEncuesta,
        });
      }
    }

    const ticketActualizado = await tickets.findByPk(ticket.id, {
      include: INCLUDE_TICKET,
    });

    return res.status(200).json(ticketActualizado);

  } catch (error) {
    console.error("updateTicket:", error);
    return res.status(500).json({ error: "Error al actualizar el ticket" });
  }
};

/* ==============================
   PATCH /api/tickets/:id/anular
================================ */
export const anularTicket = async (req, res) => {
  try {
    const { anulatedBySolicitante } = req.body;

    const ticket = await tickets.findByPk(req.params.id, {
      include: [{ model: estado_ticket, as: "estadoTicket" }],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    if (ticket.anulado) {
      return res.status(400).json({ error: "El ticket ya está anulado" });
    }

    if (ticket.estadoTicket?.nombre !== "ABIERTO") {
      return res.status(400).json({
        error: "Solo se pueden anular tickets en estado ABIERTO",
      });
    }

    const estadoAnulado = await estado_ticket.findOne({
      where: { nombre: "ANULADO" },
    });

    await ticket.update({
      anulado: true,
      anuladoAt: new Date(),
      anulatedBySolicitante: anulatedBySolicitante ?? false,
      estadoTicketId: estadoAnulado?.id ?? ticket.estadoTicketId,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "Ticket anulado correctamente",
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error("anularTicket:", error);
    return res.status(500).json({ error: "Error al anular el ticket" });
  }
};

export const reabrirTicket = async (req, res) => {
  try {
    const ticket = await tickets.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket no encontrado",
      });
    }

    // Solo el solicitante puede reabrir
    if (ticket.solicitanteId !== req.usuario.id) {
      return res.status(403).json({
        error: "No tiene permisos para reabrir este ticket",
      });
    }

    const estadoCerrado = await estado_ticket.findOne({
      where: { nombre: "CERRADO" },
    });

    if (ticket.estadoTicketId !== estadoCerrado.id) {
      return res.status(400).json({
        error: "Solo se pueden reabrir tickets cerrados",
      });
    }

const estadoAbierto = await estado_ticket.findOne({
  where: { nombre: "ABIERTO" },
});

await ticket.update({
  estadoTicketId: estadoAbierto.id,
  fueReabierto: true,
  fechaResolucion: null,   // ← limpiar fecha de resolución anterior
  updatedAt: new Date(),
});

await ticket_seguimiento.create({
  ticketId: ticket.id,
  createdByUserId: req.usuario.id,
  estadoTicketId: estadoAbierto.id,
  automatico: true,
  descripcionDeCambio: "Ticket reabierto por el solicitante",
});

    return res.status(200).json({
      message: "Ticket reabierto correctamente",
    });
  } catch (error) {
    console.error("reabrirTicket:", error);
    return res.status(500).json({
      error: "Error al reabrir ticket",
    });
  }
};

/* ==============================
   PATCH /api/tickets/:id/asignar-tecnico
================================ */
export const asignarTecnico = async (req, res) => {
  try {
    const { tecnicoId } = req.body;

    if (!tecnicoId) {
      return res.status(400).json({ error: "tecnicoId es obligatorio" });
    }

    const ticket = await tickets.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "solicitante",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const tecnico = await Usuario.findByPk(tecnicoId);

    await ticket.update({
      tecnicoId: Number(tecnicoId),
      fechaAsignacion: new Date(),
      updatedAt: new Date(),
    });

    console.log("=== DEBUG CORREO ===");
    console.log("Email solicitante:", ticket.solicitante?.email);
    console.log("Nombre solicitante:", ticket.solicitante?.nombre);
    console.log("No solicitud:", ticket.noSolicitud);
    console.log("Técnico nombre:", tecnico?.nombre);

    if (ticket.solicitante?.email) {
      enviarCorreoAsignacionTecnico({
        emailUsuario:  ticket.solicitante.email,
        nombreUsuario: ticket.solicitante.nombre,
        noSolicitud:   ticket.noSolicitud,
        tecnicoNombre: tecnico?.nombre || "Técnico de soporte",
      }).catch((correoError) => {
        console.error("Error enviando correo:", correoError.message);
      });
    }

    const ticketActualizado = await tickets.findByPk(ticket.id, {
      include: INCLUDE_TICKET,
    });

    return res.status(200).json({
      message: "Técnico asignado correctamente",
      ticket: ticketActualizado,
    });

  } catch (error) {
    console.error("asignarTecnico:", error);
    return res.status(500).json({ error: "Error al asignar técnico" });
  }
};

/* ==============================
   GET /api/tecnico/mis-tickets
================================ */
// GET /api/tickets/tecnico/mis-tickets
export const getMisTicketsComoTecnico = async (req, res) => {
  try {
    const tecnicoId = req.usuario?.id;
    if (!tecnicoId) return res.status(401).json({ error: "No autenticado" });

    const {
      estadoId,
      prioridad,
      fechaDesde,
      fechaHasta,
      busqueda,          // ← NUEVO
      page = 1,
      limit = 8,
    } = req.query;

    const where = { tecnicoId: Number(tecnicoId) };

    if (estadoId) {
  if (String(estadoId).toUpperCase() === "REABIERTO") {
    where.fueReabierto = true;
  } else {
    where.estadoTicketId = Number(estadoId);
  }
}
    if (prioridad) where.prioridadTicketId = Number(prioridad);

    if (fechaDesde || fechaHasta) {
      where.fechaSolicitud = {};
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        if (isValidDate(desde)) where.fechaSolicitud[Op.gte] = desde;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        if (isValidDate(hasta)) {
          hasta.setHours(23, 59, 59, 999);
          where.fechaSolicitud[Op.lte] = hasta;
        }
      }
    }

    // ── BÚSQUEDA POR TEXTO ──────────────────────────
    const include = [...INCLUDE_TICKET];
    if (busqueda?.trim()) {
      const q = `%${busqueda.trim()}%`;
      where[Op.or] = [
        { noSolicitud:  { [Op.like]: q } },
        { descripcion:  { [Op.like]: q } },
        { oficina:      { [Op.like]: q } },
      ];
    }
    // ────────────────────────────────────────────────

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await tickets.findAndCountAll({
      where,
      include,
      order: [["fechaSolicitud", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return res.status(200).json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      tickets: rows,
    });
  } catch (error) {
    console.error("getMisTicketsComoTecnico:", error);
    return res.status(500).json({ error: "Error al obtener tus tickets asignados" });
  }
};

/* ==============================
   PATCH /api/tickets/:id/reasignar-tecnico
================================ */
export const reasignarTecnico = async (req, res) => {
  try {
    const { tecnicoId, motivo } = req.body;

    if (!tecnicoId || !motivo?.trim()) {
      return res.status(400).json({ error: "tecnicoId y motivo son obligatorios" });
    }

    const ticket = await tickets.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    await ticket_tecnicos_asignados_historial.update(
      { desasignadoAt: new Date(), updatedAt: new Date() },
      { where: { ticketId: ticket.id, desasignadoAt: null } }
    );

    await ticket_tecnicos_asignados_historial.create({
      ticketId:          ticket.id,
      tecnicoId:         Number(tecnicoId),
      asignadoPorUserId: req.usuario?.id ?? null,
      motivoCambio:      motivo.trim(),
      asignadoAt:        new Date(),
      createdAt:         new Date(),
      updatedAt:         new Date(),
    });

    await ticket.update({ tecnicoId: Number(tecnicoId), updatedAt: new Date() });

    const ticketActualizado = await tickets.findByPk(ticket.id, { include: INCLUDE_TICKET });

    return res.status(200).json({ message: "Técnico reasignado correctamente", ticket: ticketActualizado });
  } catch (error) {
    console.error("reasignarTecnico:", error);
    return res.status(500).json({ error: "Error al reasignar técnico" });
  }
};

/* ==============================
   GET /api/tickets/:id/historial-reasignaciones
================================ */
export const getHistorialReasignaciones = async (req, res) => {
  try {
    const historial = await ticket_tecnicos_asignados_historial.findAll({
      where: { ticketId: req.params.id },
      include: [
        { model: Usuario, as: "tecnico",     attributes: ["id", "nombre", "email"] },
        { model: Usuario, as: "asignadoPor", attributes: ["id", "nombre", "email"], required: false },
      ],
      order: [["asignadoAt", "DESC"]],
    });

    const resultado = historial.map((h, index, arr) => ({
      id:                h.id,
      fechaReasignacion: h.asignadoAt,
      tecnicoNuevo:      h.tecnico,
      tecnicoAnterior:   arr[index + 1]?.tecnico ?? null,
      motivo:            h.motivoCambio ?? "Sin motivo registrado",
      usuarioReasigno:   h.asignadoPor,
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("getHistorialReasignaciones:", error);
    return res.status(500).json({ error: "Error al obtener historial" });
  }
};

/* ==============================
   GET /api/tickets/stats/tecnicos
================================ */
export const getStatsTecnicos = async (req, res) => {
  try {
    const todosTickets = await tickets.findAll({
      attributes: ["id", "tecnicoId", "estadoTicketId", "fechaAsignacion", "fechaResolucion"],
      include: [
        { model: estado_ticket, as: "estadoTicket", attributes: ["nombre"] },
        { model: Usuario, as: "tecnico", attributes: ["id", "nombre", "email"] },
      ],
      where: { tecnicoId: { [Op.not]: null } },
    });

    const statsMap = new Map();

    todosTickets.forEach((t) => {
      const id = t.tecnicoId;
      if (!statsMap.has(id)) {
        statsMap.set(id, {
          tecnico: t.tecnico,
          totalAsignados: 0,
          resueltos: 0,
          pendientes: 0,
          tiemposMinutos: [],
        });
      }

      const s = statsMap.get(id);
      s.totalAsignados++;

      const estado = (t.estadoTicket?.nombre || "").toUpperCase();
      if (estado === "RESUELTO" || estado === "CERRADO") {
        s.resueltos++;
        if (t.fechaAsignacion && t.fechaResolucion) {
          const mins = Math.floor(
            (new Date(t.fechaResolucion) - new Date(t.fechaAsignacion)) / 1000 / 60
          );
          if (mins >= 0) s.tiemposMinutos.push(mins);
        }
      } else if (estado !== "ANULADO") {
        s.pendientes++;
      }
    });

    const resultado = Array.from(statsMap.values()).map((s) => {
      const promMinutos =
        s.tiemposMinutos.length > 0
          ? Math.floor(s.tiemposMinutos.reduce((a, b) => a + b, 0) / s.tiemposMinutos.length)
          : null;

      return {
        tecnico: s.tecnico,
        totalAsignados: s.totalAsignados,
        resueltos: s.resueltos,
        pendientes: s.pendientes,
        promedioMinutos: promMinutos,
      };
    });

    resultado.sort((a, b) => {
      if (a.promedioMinutos === null) return 1;
      if (b.promedioMinutos === null) return -1;
      return a.promedioMinutos - b.promedioMinutos;
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("getStatsTecnicos:", error);
    return res.status(500).json({ error: "Error al obtener stats de técnicos" });
  }
};
