import { Router } from "express";
import {
  listarSubDepartamentos,
  obtenerSubDepartamento,
  crearSubDepartamento,
  actualizarSubDepartamento,
  cambiarEstadoSubDepartamento,
} from "../../Controladores/departamento.solicitante/sub_departamentoController.js";

import { verificarToken } from "../../middlewares/authMiddleware.js";

const router = Router();

/* ==========================
   LISTAR
   (opcional: ?departamentoId= )
========================== */
router.get("/", verificarToken, listarSubDepartamentos);

/* ==========================
   OBTENER POR ID
========================== */
router.get("/:id", verificarToken, obtenerSubDepartamento);

/* ==========================
   CREAR
========================== */
router.post("/", verificarToken, crearSubDepartamento);

/* ==========================
   ACTUALIZAR
========================== */
router.put("/:id", verificarToken, actualizarSubDepartamento);

/* ==========================
   CAMBIAR ESTADO (SOFT DELETE)
========================== */
router.patch("/:id/estado", verificarToken, cambiarEstadoSubDepartamento);


export default router;