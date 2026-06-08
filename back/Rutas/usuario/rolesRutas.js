// Rutas/usuario/rolesRutas.js
import express from "express";
import {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
} from "../../Controladores/usuario/rolescontroller.js"; // ✅ path correcto
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

router.get("/",    verificarToken, tieneRol(1, "ADMIN"), getRoles);
router.get("/:id", verificarToken, tieneRol(1, "ADMIN"), getRolById);
router.post("/",   verificarToken, tieneRol(1, "ADMIN"), createRol);
router.put("/:id", verificarToken, tieneRol(1, "ADMIN"), updateRol);
router.delete("/:id", verificarToken, tieneRol(1, "ADMIN"), deleteRol);

export default router;