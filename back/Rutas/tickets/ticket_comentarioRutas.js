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

/* =====================================================
   OBTENER TODOS LOS COMENTARIOS DE UN TICKET
   GET /api/ticket-comentarios/ticket/73
===================================================== */
router.get(
  "/ticket/:ticketId",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getComentariosByTicket
);

/* =====================================================
   OBTENER COMENTARIO POR ID
===================================================== */
router.get(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getComentarioById
);

/* =====================================================
   CREAR COMENTARIO
===================================================== */
router.post(
  "/",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  (req, res, next) => {
    upload.single("archivo")(req, res, (err) => {
      if (err) {
        console.error("❌ Error en multer/Cloudinary:", err);
        return res.status(500).json({
          error: err.message,
        });
      }

      next();
    });
  },
  createComentario
);

/* =====================================================
   ELIMINAR COMENTARIO
===================================================== */
router.delete(
  "/:id",
  verificarToken,
  tieneRol("ADMIN"),
  deleteComentario
);

export default router;