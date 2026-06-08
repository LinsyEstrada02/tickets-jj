import EstadoTicket from "../Modelos/tickets/estado_ticket.js";

const estados = [
  { nombre: "ABIERTO",    nombreVerboso: "Abierto",    descripcion: "Ticket recién creado, pendiente de atención" },
  { nombre: "EN_PROCESO", nombreVerboso: "En Proceso", descripcion: "Ticket siendo atendido por un técnico" },
  { nombre: "CERRADO",    nombreVerboso: "Cerrado",    descripcion: "Ticket resuelto y cerrado" },
  { nombre: "ANULADO",    nombreVerboso: "Anulado",    descripcion: "Ticket anulado por el solicitante o administrador" },
];

export const seedEstadosTicket = async () => {
  try {
    for (const estado of estados) {
      await EstadoTicket.findOrCreate({
        where: { nombre: estado.nombre },
        defaults: {
          ...estado,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log("✅ Estados de ticket insertados correctamente");
  } catch (error) {
    console.error("❌ Error al insertar estados de ticket:", error);
  }
};