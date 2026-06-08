// Rutas/tickets/estadoTicketRutas.js
import express from "express";
import {
  getEstados,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado,
} from "../../Controladores/tickets/estado_ticketcontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Listar estados (todos los roles autenticados los necesitan para selects)
router.get("/", verificarToken, getEstados);

// Obtener por ID
router.get("/:id", verificarToken, getEstadoById);

// Crear, actualizar y eliminar solo ADMIN
router.post(  "/",    verificarToken, tieneRol("ADMIN"), createEstado);
router.put(   "/:id", verificarToken, tieneRol("ADMIN"), updateEstado);
router.delete("/:id", verificarToken, tieneRol("ADMIN"), deleteEstado);

export default router;