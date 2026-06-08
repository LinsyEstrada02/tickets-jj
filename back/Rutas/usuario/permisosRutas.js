import express from "express";
import {
  getPermisosDirectosUsuario,
  asignarPermisoDirecto,
  quitarPermisoDirecto,
  getPermisosEfectivosUsuario,
} from "../../Controladores/usuario/usuario_permisoController.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol, puedeVerPermisos } from "../../middlewares/rolMiddleware.js"; // ✅ fix

const router = express.Router();

// Ver permisos efectivos → propio usuario o admin
router.get("/:id/permisos-efectivos", verificarToken, puedeVerPermisos, getPermisosEfectivosUsuario);

// Ver permisos directos → propio usuario o admin
router.get("/:id/permisos-directos",  verificarToken, puedeVerPermisos, getPermisosDirectosUsuario);

// Asignar permiso directo → solo admin
router.post("/:id/permisos-directos", verificarToken, tieneRol(1, "ADMIN", "ADMINISTRADOR"), asignarPermisoDirecto);

// Quitar permiso directo → solo admin
router.delete("/:id/permisos-directos/:permisoId", verificarToken, tieneRol(1, "ADMIN", "ADMINISTRADOR"), quitarPermisoDirecto);

export default router;