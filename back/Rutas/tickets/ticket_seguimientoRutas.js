// Rutas/tickets/ticketSeguimientoRutas.js
import express from "express";
import {
  getSeguimientoByTicket,
  getSeguimientoById,
  createSeguimiento,
  deleteSeguimiento,
} from "../../Controladores/tickets/tickets_seguimientocontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Listar seguimientos de un ticket (?ticketId=X)
router.get(
  "/",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getSeguimientoByTicket
);

// Obtener seguimiento por ID
router.get(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getSeguimientoById
);

// Crear seguimiento (TECNICO, ADMIN, SUPERVISOR)
router.post(
  "/",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR", "TECNICO"),
  createSeguimiento
);

// Eliminar seguimiento (solo ADMIN)
router.delete(
  "/:id",
  verificarToken,
  tieneRol("ADMIN"),
  deleteSeguimiento
);

export default router;