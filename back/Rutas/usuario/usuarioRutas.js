import express from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  changePassword,
  cambiarEstadoUsuario,
  editUsuario,
  cambiarRolUsuario,
  getUsuarioByEmail,
  getMe,
  registroSolicitante,
} from "../../Controladores/usuario/usuariocontroller.js";
import { verificarToken } from "../../middlewares/authMiddleware.js";
import { tieneRol } from "../../middlewares/rolMiddleware.js";

const router = express.Router();

//////////////////////////////////////////////////////////
// RUTAS PÚBLICAS
//////////////////////////////////////////////////////////
router.get("/by-email",                getUsuarioByEmail);
router.get("/me",       verificarToken, getMe);
router.post("/registro", registroSolicitante);              // ← auto-registro

//////////////////////////////////////////////////////////
// SOLO ADMIN
//////////////////////////////////////////////////////////
router.get("/", verificarToken, tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"), getUsuarios);
router.post("/",   verificarToken, tieneRol("ADMIN", "ADMINISTRADOR"), createUsuario);
router.patch("/:id/rol", verificarToken, tieneRol("ADMIN", "ADMINISTRADOR"), cambiarRolUsuario);

//////////////////////////////////////////////////////////
// ADMIN y/o SUPERVISOR
//////////////////////////////////////////////////////////
router.get(    "/:id",          verificarToken, tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"), getUsuarioById);
router.put(    "/:id",          verificarToken, tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"), editUsuario);
router.patch(  "/:id/password", verificarToken, tieneRol("ADMIN", "ADMINISTRADOR", "SUPERVISOR"), changePassword);

//////////////////////////////////////////////////////////
// SOLO ADMIN - CAMBIAR ESTADO
//////////////////////////////////////////////////////////
router.patch("/:id/estado", verificarToken, tieneRol("ADMIN", "ADMINISTRADOR"), cambiarEstadoUsuario);


export default router;
