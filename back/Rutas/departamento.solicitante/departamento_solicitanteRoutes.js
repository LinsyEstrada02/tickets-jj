import { Router } from "express";
import {
  listarDepartamentos,
  obtenerDepartamento,
  crearDepartamento,
  actualizarDepartamento,
  cambiarEstadoDepartamento,
} from "../../Controladores/departamento.solicitante/departamento_solicitantecontroller.js";

import { verificarToken } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", verificarToken, listarDepartamentos);
router.get("/:id", verificarToken, obtenerDepartamento);
router.post("/", verificarToken, crearDepartamento);
router.put("/:id", verificarToken, actualizarDepartamento);

// Soft delete (activar/desactivar)
router.patch("/:id/estado", verificarToken, cambiarEstadoDepartamento);


export default router;