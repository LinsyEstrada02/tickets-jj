// Rutas/tickets/tipoTicketRutas.js
import express from "express";
import {
  getTipos,
  getTipoById,
  createTipo,
  updateTipo,
  deleteTipo,
} from "../../Controladores/tickets/tipo_ticketcontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Listar tipos (todos los roles autenticados los necesitan para selects)
router.get("/", verificarToken, getTipos);

// Obtener por ID
router.get("/:id", verificarToken, getTipoById);

// Crear, actualizar y eliminar solo ADMIN
router.post(  "/",    verificarToken, tieneRol("ADMIN"), createTipo);
router.put(   "/:id", verificarToken, tieneRol("ADMIN"), updateTipo);
router.delete("/:id", verificarToken, tieneRol("ADMIN"), deleteTipo);

export default router;