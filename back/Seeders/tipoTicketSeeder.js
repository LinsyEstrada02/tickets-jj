import tipo_ticket from "../Modelos/tickets/tipo_ticket.js";

const tipos = [
  "Mantenimiento de Equipo",
  "Revisión de equipo",
  "Instalación de software",
  "Configuración de periféricos",
  "Recursos compartidos",
  "Soporte de Impresoras",
  "Recepción de equipos",
  "Redes y conectividad",
  "Accesos y credenciales",
  "Copias de seguridad",
  "Servicios en Nube",
  "Apoyo audiovisual",
  "Asesoría Técnica",
];

export const seedTiposTicket = async () => {
  try {
    for (const nombre of tipos) {
      await tipo_ticket.findOrCreate({
        where: { nombre },
        defaults: {
          nombre,
          descripcion: nombre,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log("✅ Tipos de ticket insertados correctamente");
  } catch (error) {
    console.error("❌ Error al insertar tipos de ticket:", error);
  }
};