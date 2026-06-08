import PrioridadTicket from "../Modelos/tickets/prioridad_ticket.js";

const prioridades = [
  {
    nombre: "ALTA",
    nombreVerboso: "Alta",
    descripcion: "Ticket crítico que requiere atención inmediata",
  },
  {
    nombre: "MEDIA",
    nombreVerboso: "Media",
    descripcion: "Ticket importante pero no urgente",
  },
  {
    nombre: "BAJA",
    nombreVerboso: "Baja",
    descripcion: "Ticket de baja prioridad",
  },
];

export const seedPrioridadesTicket = async () => {
  try {
    for (const prioridad of prioridades) {
      await PrioridadTicket.findOrCreate({
        where: { nombre: prioridad.nombre },
        defaults: {
          ...prioridad,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log("✅ Prioridades de ticket insertadas correctamente");
  } catch (error) {
    console.error("❌ Error al insertar prioridades:", error);
  }
};