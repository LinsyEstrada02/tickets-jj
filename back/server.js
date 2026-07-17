import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db/db.js";
import "./Modelos/usuario/asociaciones.js";
import path from "path";
import { fileURLToPath } from "url";
// RUTAS — Usuarios y auth
import usuarioRoutes         from "./Rutas/usuario/usuarioRutas.js";
import authRoutes            from "./Rutas/auth/authRutas.js";
import departamentoRoutes    from "./Rutas/departamento.solicitante/departamento_solicitanteRoutes.js";
import subDepartamentoRoutes from "./Rutas/departamento.solicitante/sub_departamentoRutas.js";
import usuarioPermisoRoutes  from "./Rutas/usuario/permisosRutas.js";
import rolesRoutes           from "./Rutas/usuario/rolesRutas.js";
import permisosRoutes        from "./Rutas/usuario/catalogopermisosRutas.js";
import passwordResetRoutes from "./Rutas/usuario/password_resetRutas.js";
// RUTAS — Tickets
import ticketsRoutes           from "./Rutas/tickets/ticketsRutas.js";
import estadoTicketRoutes      from "./Rutas/tickets/estado_ticketRutas.js";
import tipoTicketRoutes        from "./Rutas/tickets/tipo_ticketRuta.js";
import ticketComentariosRoutes from "./Rutas/tickets/ticket_comentarioRutas.js";
import ticketSeguimientoRoutes from "./Rutas/tickets/ticket_seguimientoRutas.js";
import ticketHistorialRoutes   from "./Rutas/tickets/ticketHistorialRutas.js";
import edificioNivelRoutes from "./Rutas/tickets/edificio_nivelRutas.js";
import prioridad_ticketRoutes from "./Rutas/tickets/prioridad_ticketRutas.js";
// RUTAS - ENCUESTA
import encuestaRutas from "./Rutas/encuesta/encuestaRutas.js"

// Seeders
import { seedEstadosTicket } from "./Seeders/estadoTicketSeeder.js";
import { seedTiposTicket }   from "./Seeders/tipoTicketSeeder.js";

dotenv.config();

import fs from "fs";


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const uploadPath = process.env.UPLOADS_PATH || "\\\\10.21.25.172\\sitickets";


/* ==========================
   CONFIGURACIÓN CORS
========================== */
const allowedOrigins = ["http://localhost:3000", "http://10.21.25.54:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* ==========================
   MIDDLEWARES
========================== */
app.use(express.json());

/* ==========================
   RUTA TEST
========================== */
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

/* ==========================
   RUTAS API — Usuarios
========================== */
app.use("/api/usuarios",                       usuarioPermisoRoutes);
app.use("/api/usuarios",                       usuarioRoutes);
app.use("/api/auth",                           authRoutes);
app.use("/api/departamentos-solicitantes",     departamentoRoutes);
app.use("/api/sub-departamentos-solicitantes", subDepartamentoRoutes);
app.use("/api/roles",                          rolesRoutes);
app.use("/api/permisos",                       permisosRoutes);
app.use("/api/password-reset",                 passwordResetRoutes);

/* ==========================
   RUTAS API — Tickets
========================== */
app.use("/api/tickets",            ticketsRoutes);
app.use("/api/estado-ticket",      estadoTicketRoutes);
app.use("/api/tipo-ticket",        tipoTicketRoutes);
app.use("/api/prioridad-ticket",   prioridad_ticketRoutes);
app.use("/api/ticket-comentarios", ticketComentariosRoutes);
app.use("/uploads", express.static(uploadPath));
app.use("/api/ticket-seguimiento", ticketSeguimientoRoutes);
app.use("/api/ticket-historial",   ticketHistorialRoutes);
app.use("/api", edificioNivelRoutes);

/* ==========================
   RUTAS API — Encuesta
========================== */
app.use("/api/encuesta", encuestaRutas);

/* ==========================
   MANEJO GLOBAL DE ERRORES
========================== */
app.use((err, req, res, next) => {
  console.error("Error global:", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

/* ==========================
   INICIALIZACIÓN
========================== */
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await db.authenticate();
    console.log("Base de datos conectada correctamente");

    await seedEstadosTicket();
    await seedTiposTicket();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al conectar la base de datos:", error);
    process.exit(1);
  }
};

startServer();
