import express from "express";
import {
  getEncuesta,
  responderEncuesta,
  getResultadosEncuestas,
  getResumenMensual,
} from "../../Controladores/encuesta/encuestaController.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// Resumen mensual del mejor técnico (solo admin/supervisor)
router.get(
  "/resumen-mensual",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR"),
  getResumenMensual
);

// Ver resultados de todas las encuestas (solo admin/supervisor)
router.get(
  "/resultados",
  verificarToken,
  tieneRol("ADMIN", "SUPERVISOR"),
  getResultadosEncuestas
);

// Obtener datos del ticket para mostrar en la encuesta (pública via link de correo)
router.get("/:ticketId", getEncuesta);

// Responder la encuesta (pública via link de correo)
router.post("/:ticketId", responderEncuesta);

export default router;