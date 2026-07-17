import express from "express";
import {
  solicitarRecuperacion,
  resetPassword
} from "../../Controladores/usuario/passwordResetController.js";


const router = express.Router();


router.post("/request", solicitarRecuperacion);

router.post("/reset", resetPassword);


export default router;