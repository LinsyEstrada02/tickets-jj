import express from "express";
import {
  getPrioridades,
  getPrioridadById,
  createPrioridad,
  updatePrioridad,
  deletePrioridad,
} from "../../Controladores/tickets/prioridad_ticketController.js";

import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// listar
router.get("/", verificarToken, getPrioridades);

// obtener por id
router.get("/:id", verificarToken, getPrioridadById);

// solo ADMIN
router.post("/", verificarToken, tieneRol("ADMIN"), createPrioridad);
router.put("/:id", verificarToken, tieneRol("ADMIN"), updatePrioridad);
router.delete("/:id", verificarToken, tieneRol("ADMIN"), deletePrioridad);

export default router;