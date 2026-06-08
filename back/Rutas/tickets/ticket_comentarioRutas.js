// Rutas/tickets/ticketComentariosRutas.js
import express from "express";
import {
  getComentariosByTicket,
  getComentarioById,
  createComentario,
  deleteComentario,
  upload,
} from "../../Controladores/tickets/ticket_comentariocontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Listar comentarios de un ticket (?ticketId=X)
router.get(
  "/",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getComentariosByTicket
);

// Obtener comentario por ID
router.get(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getComentarioById
);

// Crear comentario ── upload.single va ENTRE tieneRol y createComentario ──
// En ticket_comentarioRutas.js — reemplaza la ruta POST
router.post(
  "/",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  (req, res, next) => {
    upload.single("archivo")(req, res, (err) => {
      if (err) {
        console.error("❌ Error en multer/Cloudinary:", err);
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  createComentario
);
// Eliminar comentario (solo ADMIN)
router.delete(
  "/:id",
  verificarToken,
  tieneRol("ADMIN"),
  deleteComentario
);

export default router;