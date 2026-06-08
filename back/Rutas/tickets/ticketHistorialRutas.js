// Rutas/tickets/ticketHistorialRutas.js
import express from "express";
import {
  getHistorialByTicket,
  getHistorialById,
  createHistorial,
  desasignarTecnico,
} from "../../Controladores/tickets/ticket_tecnicos_asignadoscontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Listar historial de un ticket (?ticketId=X)
router.get(
  "/",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "TECNICO"),
  getHistorialByTicket
);

// Obtener registro por ID
router.get(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "TECNICO"),
  getHistorialById
);

// Registrar nueva asignación (ADMIN, SUPERVISOR)
router.post(
  "/",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  createHistorial
);

// Cerrar asignación activa (ADMIN, SUPERVISOR)
router.patch(
  "/:id/desasignar",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  desasignarTecnico
);

export default router;
