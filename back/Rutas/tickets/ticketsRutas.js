// Rutas/tickets/ticketsRutas.js
import express from "express";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  anularTicket,
  asignarTecnico,
  reabrirTicket,
  getMisTicketsComoTecnico,
  reasignarTecnico,
  getHistorialReasignaciones,
  getStatsTecnicos,
} from "../../Controladores/tickets/ticketscontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// =====================================================
// Rutas estáticas — DEBEN IR ANTES de /:id
// =====================================================
router.get(
  "/stats/tecnicos",                          // ✅ antes de /:id
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  getStatsTecnicos
);

router.get(
  "/tecnico/mis-tickets",                     // ✅ antes de /:id
  verificarToken,
  tieneRol("TECNICO"),
  getMisTicketsComoTecnico
);

// =====================================================
// Rutas generales
// =====================================================
router.get(
  "/",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getTickets
);

router.get(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "TECNICO", "SOLICITANTE"),
  getTicketById
);

router.post(
  "/",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "SOLICITANTE"),
  createTicket
);

router.put(
  "/:id",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "TECNICO"),
  updateTicket
);

router.patch(
  "/:id/anular",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR", "SOLICITANTE"),
  anularTicket
);

router.patch(
  "/:id/reabrir",
  verificarToken,
  tieneRol("SOLICITANTE"),
  reabrirTicket
);

router.patch(
  "/:id/asignar-tecnico",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  asignarTecnico
);

router.patch(
  "/:id/reasignar-tecnico",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  reasignarTecnico
);

router.get(
  "/:id/historial-reasignaciones",
  verificarToken,
  tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"),
  getHistorialReasignaciones
);

export default router;
