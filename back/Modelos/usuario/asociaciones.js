// Modelos/usuario/asociaciones.js
import Usuario from "./usuario.js";
import Rol from "./roles.js";
import Permiso from "./permisos.js";
import UsuarioRol from "./usuario_rol.js";
import PermisoPorRol from "./permisos_rol.js";
import UsuarioPermiso from "./usuario_permiso.js";
import departamento_solicitante from "../departamento.solicitante/departamento_solicitante.js";
import sub_departamento_solicitante from "../departamento.solicitante/sub_departamento_solicitante.js";

// Tickets
import tickets from "../tickets/tickets.js";
import estado_ticket from "../tickets/estado_ticket.js";
import tipo_ticket from "../tickets/tipo_ticket.js";
import prioridad_ticket from "../tickets/prioridad_ticket.js";
import ticket_comentarios from "../tickets/ticket_comentario.js";
import ticket_seguimiento from "../tickets/tickets_seguimiento.js";
import ticket_tecnicos_asignados_historial from "../tickets/ticket_tecnicos_asignados_historial.js";
import Edificio from "../tickets/edificio.js";
import Nivel    from "../tickets/nivel.js";

import encuesta_satisfaccion from "../encuesta/encuesta_satisfaccion.js";

//////////////////////////////////////////////////////////
// Usuario <-> Rol (Muchos a Muchos)
//////////////////////////////////////////////////////////
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: "usuarioId",
  otherKey: "rolId",
  as: "Rols",
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: "rolId",
  otherKey: "usuarioId",
});
Usuario.belongsTo(Rol, {
  foreignKey: "rolId",
  as: "rol",
});
Rol.hasMany(Usuario, {
  foreignKey: "rolId",
  as: "usuarios",
});

//////////////////////////////////////////////////////////
// Rol <-> Permiso (Muchos a Muchos)
//////////////////////////////////////////////////////////
Rol.belongsToMany(Permiso, {
  through: PermisoPorRol,
  foreignKey: "rolId",
  otherKey: "permisoId",
});
Permiso.belongsToMany(Rol, {
  through: PermisoPorRol,
  foreignKey: "permisoId",
  otherKey: "rolId",
});

//////////////////////////////////////////////////////////
// Permisos directos (UsuarioPermiso)
//////////////////////////////////////////////////////////
UsuarioPermiso.belongsTo(Usuario, { foreignKey: "usuarioId",  as: "usuario" });
UsuarioPermiso.belongsTo(Permiso, { foreignKey: "permisoId",  as: "permiso" });
UsuarioPermiso.belongsTo(Usuario, { foreignKey: "otorgadoPor", as: "otorgadoPorUsuario" });

//////////////////////////////////////////////////////////
// Tablas pivote
//////////////////////////////////////////////////////////
UsuarioRol.belongsTo(Usuario,  { foreignKey: "usuarioId" });
UsuarioRol.belongsTo(Rol,      { foreignKey: "rolId" });
PermisoPorRol.belongsTo(Rol,    { foreignKey: "rolId" });
PermisoPorRol.belongsTo(Permiso, { foreignKey: "permisoId" });

//////////////////////////////////////////////////////////
// Departamento / Subdepartamento solicitante
//////////////////////////////////////////////////////////
departamento_solicitante.hasMany(Usuario, {
  foreignKey: "departamentoSolicitanteId",
  as: "usuarios",
});
Usuario.belongsTo(departamento_solicitante, {
  foreignKey: "departamentoSolicitanteId",
  as: "departamentoSolicitante",
});
departamento_solicitante.hasMany(sub_departamento_solicitante, {
  foreignKey: "departamentoId",
  as: "subDepartamentos",
});
sub_departamento_solicitante.belongsTo(departamento_solicitante, {
  foreignKey: "departamentoId",
  as: "departamento",
});
sub_departamento_solicitante.hasMany(Usuario, {
  foreignKey: "subDepartamentoSolicitanteId",
  as: "usuarios",
});
Usuario.belongsTo(sub_departamento_solicitante, {
  foreignKey: "subDepartamentoSolicitanteId",
  as: "subDepartamentoSolicitante",
});

//////////////////////////////////////////////////////////
// Usuario creador (self reference)
//////////////////////////////////////////////////////////
Usuario.belongsTo(Usuario, {
  foreignKey: "createdByUserId",
  as: "creadoPor",
});

//////////////////////////////////////////////////////////
// TICKETS
//////////////////////////////////////////////////////////

// tickets <-> estado_ticket
tickets.belongsTo(estado_ticket, {
  foreignKey: "estadoTicketId",
  as: "estadoTicket",
});
estado_ticket.hasMany(tickets, {
  foreignKey: "estadoTicketId",
  as: "tickets",
});

// tickets <-> tipo_ticket
tickets.belongsTo(tipo_ticket, {
  foreignKey: "tipoTicketId",
  as: "tipoTicket",
});
tipo_ticket.hasMany(tickets, {
  foreignKey: "tipoTicketId",
  as: "tickets",
});

// tickets <-> prioridad_ticket (NUEVO)
tickets.belongsTo(prioridad_ticket, {
  foreignKey: "prioridadTicketId",
  as: "prioridadTicket",
});
prioridad_ticket.hasMany(tickets, {
  foreignKey: "prioridadTicketId",
  as: "tickets",
});

// tickets <-> departamento_solicitante
tickets.belongsTo(departamento_solicitante, {
  foreignKey: "departamentoId",
  as: "departamento",
});
departamento_solicitante.hasMany(tickets, {
  foreignKey: "departamentoId",
  as: "tickets",
});
tickets.belongsTo(sub_departamento_solicitante, {
  foreignKey: 'subDepartamentoSolicitanteId',   // columna en tickets
  as: 'subDepartamento',                        // alias que usas en include
  targetKey: 'id'                               // columna en sub_departamento_solicitante
});
// tickets <-> Usuario (solicitante)
tickets.belongsTo(Usuario, {
  foreignKey: "solicitanteId",
  as: "solicitante",
});
Usuario.hasMany(tickets, {
  foreignKey: "solicitanteId",
  as: "ticketsSolicitados",
});

// tickets <-> Usuario (tecnico asignado)
tickets.belongsTo(Usuario, {
  foreignKey: "tecnicoId",
  as: "tecnico",
});
Usuario.hasMany(tickets, {
  foreignKey: "tecnicoId",
  as: "ticketsAsignados",
});

// tickets <-> Usuario (creador)
tickets.belongsTo(Usuario, {
  foreignKey: "createdByUserId",
  as: "creadoPorUsuario",
});

//////////////////////////////////////////////////////////
// TICKET COMENTARIOS
//////////////////////////////////////////////////////////
ticket_comentarios.belongsTo(tickets, {
  foreignKey: "ticketId",
  as: "ticketComentario",
});
tickets.hasMany(ticket_comentarios, {
  foreignKey: "ticketId",
  as: "comentarios",
});
ticket_comentarios.belongsTo(Usuario, {
  foreignKey: "autorUserId",
  as: "autor",
});
Usuario.hasMany(ticket_comentarios, {
  foreignKey: "autorUserId",
  as: "comentarios",
});

//////////////////////////////////////////////////////////
// TICKET SEGUIMIENTO
//////////////////////////////////////////////////////////
ticket_seguimiento.belongsTo(tickets, {
  foreignKey: "ticketId",
  as: "ticketSeguimiento",
});
tickets.hasMany(ticket_seguimiento, {
  foreignKey: "ticketId",
  as: "seguimientos",
});
ticket_seguimiento.belongsTo(estado_ticket, {
  foreignKey: "estadoTicketId",
  as: "estadoTicket",
});
ticket_seguimiento.belongsTo(Usuario, {
  foreignKey: "tecnicoId",
  as: "tecnico",
});
ticket_seguimiento.belongsTo(Usuario, {
  foreignKey: "createdByUserId",
  as: "creadoPor",
});

//////////////////////////////////////////////////////////
// TICKET HISTORIAL DE TÉCNICOS ASIGNADOS
//////////////////////////////////////////////////////////
ticket_tecnicos_asignados_historial.belongsTo(tickets, {
  foreignKey: "ticketId",
  as: "ticketHistorial",
});
tickets.hasMany(ticket_tecnicos_asignados_historial, {
  foreignKey: "ticketId",
  as: "historialTecnicos",
});
ticket_tecnicos_asignados_historial.belongsTo(Usuario, {
  foreignKey: "tecnicoId",
  as: "tecnico",
});
ticket_tecnicos_asignados_historial.belongsTo(Usuario, {
  foreignKey: "asignadoPorUserId",
  as: "asignadoPor",
});

// sub_departamento_solicitante → tickets (hasMany)
sub_departamento_solicitante.hasMany(tickets, {
  foreignKey: "subDepartamentoSolicitanteId",
  as: "tickets",
});

//////////////////////////////////////////////////////////
// EDIFICIO Y NIVEL
//////////////////////////////////////////////////////////

Edificio.hasMany(Nivel, {
  foreignKey: "id_edificio",
  as: "niveles",
});
Nivel.belongsTo(Edificio, {
  foreignKey: "id_edificio",
  as: "edificio",
});

tickets.belongsTo(Edificio, {
  foreignKey: "id_edificio",
  as: "edificio",
});
Edificio.hasMany(tickets, {
  foreignKey: "id_edificio",
  as: "tickets",
});

tickets.belongsTo(Nivel, {
  foreignKey: "id_nivel",
  as: "nivel",
});
Nivel.hasMany(tickets, {
  foreignKey: "id_nivel",
  as: "tickets",
});

// Un ticket tiene una encuesta
tickets.hasOne(encuesta_satisfaccion, {
  foreignKey: "ticketId",
  as: "encuesta",
});

encuesta_satisfaccion.belongsTo(tickets, {
  foreignKey: "ticketId",
  as: "ticket",
});


//////////////////////////////////////////////////////////
// Export
//////////////////////////////////////////////////////////
export {
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,
  PermisoPorRol,
  UsuarioPermiso,
  departamento_solicitante,
  sub_departamento_solicitante,
  tickets,
  estado_ticket,
  tipo_ticket,
  prioridad_ticket,
  ticket_comentarios,
  ticket_seguimiento,
  ticket_tecnicos_asignados_historial,
  Edificio,
  Nivel,
  encuesta_satisfaccion,
};