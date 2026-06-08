import ticket_comentarios from "../../Modelos/tickets/ticket_comentario.js";
import tickets from "../../Modelos/tickets/tickets.js";
import Usuario from "../../Modelos/usuario/usuario.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ── Ruta de red para guardar archivos ──
const uploadPath = process.env.UPLOADS_PATH || "\\\\10.21.25.158\\sitickets";

// Crea la carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo no permitido"));
    }
  },
});

// ==============================
// GET /api/ticket-comentarios?ticketId=X
// ==============================
export const getComentariosByTicket = async (req, res) => {
  try {
    const { ticketId } = req.query;
    if (!ticketId) {
      return res.status(400).json({ error: "ticketId es requerido" });
    }

    const comentarios = await ticket_comentarios.findAll({
      where: { ticketId: Number(ticketId) },
      include: [
        {
          model: Usuario,
          as: "autor",
          attributes: ["id", "nombre", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json(comentarios);
  } catch (error) {
    console.error("getComentariosByTicket:", error);
    return res.status(500).json({ error: "Error al obtener los comentarios" });
  }
};

// ==============================
// GET /api/ticket-comentarios/:id
// ==============================
export const getComentarioById = async (req, res) => {
  try {
    const comentario = await ticket_comentarios.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "autor",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });
    if (!comentario) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }
    return res.status(200).json(comentario);
  } catch (error) {
    console.error("getComentarioById:", error);
    return res.status(500).json({ error: "Error al obtener el comentario" });
  }
};

// ==============================
// POST /api/ticket-comentarios
// ==============================
export const createComentario = async (req, res) => {
  try {
    console.log("📥 Body:", req.body);
    console.log("📎 File:", req.file);

    const { ticketId, autorTipo, comentario } = req.body;

    if (!req.usuario)
      return res.status(401).json({ error: "Usuario no autenticado" });

    if (!ticketId || !autorTipo || (!comentario?.trim() && !req.file))
      return res.status(400).json({ error: "Datos incompletos" });

    const ticket = await tickets.findByPk(ticketId);
    if (!ticket)
      return res.status(404).json({ error: "Ticket no encontrado" });
    if (ticket.anulado)
      return res.status(400).json({ error: "No se puede comentar en un ticket anulado" });

    // Guardamos solo el nombre del archivo
    const archivoUrl = req.file ? req.file.filename : null;

    const nuevoComentario = await ticket_comentarios.create({
      ticketId:    Number(ticketId),
      autorUserId: req.usuario.id,
      autorTipo,
      comentario:  comentario?.trim() || "",
      archivoUrl,
    });

    const comentarioCompleto = await ticket_comentarios.findByPk(nuevoComentario.id, {
      include: [{ model: Usuario, as: "autor", attributes: ["id", "nombre", "email"] }],
    });

    return res.status(201).json(comentarioCompleto);
  } catch (error) {
    console.error("createComentario:", error);
    return res.status(500).json({ error: "Error al crear el comentario" });
  }
};

// ==============================
// DELETE /api/ticket-comentarios/:id
// ==============================
export const deleteComentario = async (req, res) => {
  try {
    const comentario = await ticket_comentarios.findByPk(req.params.id);
    if (!comentario) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }
    await comentario.destroy();
    return res.status(200).json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("deleteComentario:", error);
    return res.status(500).json({ error: "Error al eliminar el comentario" });
  }
};

export default { getComentariosByTicket, getComentarioById, createComentario, deleteComentario };