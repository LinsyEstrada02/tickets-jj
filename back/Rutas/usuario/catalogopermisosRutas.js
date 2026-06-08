// Rutas/usuario/catalogoPermisosRutas.js
import express from "express";
import { getPermisos } from "../../Controladores/usuario/permisoscontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

// GET /api/permisos — catálogo completo
router.get("/", verificarToken, tieneRol(1, "ADMIN"), getPermisos);

export default router;