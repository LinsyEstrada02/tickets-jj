import express                      from "express";
import { getEdificios, getNiveles } from "../../Controladores/tickets/edificio_nivelControlador.js";

const router = express.Router();

router.get("/edificios", getEdificios);
router.get("/niveles",   getNiveles);

export default router;