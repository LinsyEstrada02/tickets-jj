import nodemailer from "nodemailer";

// Transporter reutilizable con Office365
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,         // 10.10.0.154
  port:   Number(process.env.MAIL_PORT), // 25
  secure: false,                          // puerto 25 no usa SSL
  auth: {
    user: process.env.MAIL_USER,          // info@mspas.gob.gt
    pass: process.env.MAIL_PASS,          // Mspas1820
  },
  tls: {
    rejectUnauthorized: false,            // permite certificados internos/autofirmados
  },
});

/* =========================
   CORREO: ASIGNACION TECNICO
========================= */
export const enviarCorreoAsignacionTecnico = async ({
  emailUsuario,
  nombreUsuario,
  noSolicitud,
  tecnicoNombre,
}) => {
  console.log("=== DEBUG CORREO ASIGNACION ===");
  console.log("Enviando a:", emailUsuario);
  console.log("No solicitud:", noSolicitud);
  console.log("Técnico:", tecnicoNombre);
  try {
    await transporter.sendMail({
      from:    `"Sistema de Tickets MSPAS" <${process.env.MAIL_USER}>`,
      to:      emailUsuario,
      subject: `Técnico asignado a su ticket ${noSolicitud}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Sistema de Tickets MSPAS</h2>
          <p>Hola <b>${nombreUsuario}</b>,</p>
          <p>Se ha asignado un técnico para atender su solicitud.</p>
          <div style="background:#f8f9fa; padding:16px; border-radius:8px; margin:16px 0;">
            <p style="margin:4px 0"><b>No. Solicitud:</b> ${noSolicitud}</p>
            <p style="margin:4px 0"><b>Técnico asignado:</b> ${tecnicoNombre}</p>
          </div>
          <p>El técnico se pondrá en contacto para resolver el inconveniente.</p>
          <br>
          <p style="color:#6c757d; font-size:0.85rem;">Sistema de Tickets — Ministerio de Salud Pública y Asistencia Social</p>
        </div>
      `,
    });
    console.log("✅ Correo de asignación enviado correctamente a:", emailUsuario);
  } catch (err) {
    console.error("❌ Error enviando correo de asignación:");
    console.error("Mensaje:", err.message);
    throw err;
  }
};

/* =========================
   CORREO: ENCUESTA
========================= */
export const enviarEncuestaTicket = async ({
  emailUsuario,
  nombreUsuario,
  noSolicitud,
  linkEncuesta,
}) => {
  console.log("=== DEBUG CORREO ENCUESTA ===");
  console.log("Enviando a:", emailUsuario);
  console.log("No solicitud:", noSolicitud);
  console.log("Link encuesta:", linkEncuesta);
  try {
    await transporter.sendMail({
      from:    `"Sistema de Tickets MSPAS" <${process.env.MAIL_USER}>`,
      to:      emailUsuario,
      subject: `Encuesta de satisfacción - Ticket ${noSolicitud}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Sistema de Tickets MSPAS</h2>
          <p>Hola <b>${nombreUsuario}</b>,</p>
          <p>Su ticket <b>${noSolicitud}</b> ha sido marcado como <b>resuelto</b>.</p>
          <p>Nos gustaría conocer su nivel de satisfacción con la solución brindada.</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${linkEncuesta}"
              style="
                padding: 12px 24px;
                background: #0d6efd;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                font-size: 1rem;
              ">
              Responder encuesta
            </a>
          </div>
          <p>Su opinión nos ayuda a mejorar nuestro servicio.</p>
          <br>
          <p style="color:#6c757d; font-size:0.85rem;">Sistema de Tickets — Ministerio de Salud Pública y Asistencia Social</p>
        </div>
      `,
    });
    console.log("✅ Encuesta enviada correctamente a:", emailUsuario);
  } catch (err) {
    console.error("❌ Error enviando encuesta:");
    console.error("Mensaje:", err.message);
    throw err;
  }
};

/* =========================
   CORREO: RECUPERACIÓN DE CONTRASEÑA
========================= */
export const enviarCorreoRecuperacion = async ({
  emailUsuario,
  nombreUsuario,
  resetUrl,
}) => {
  console.log("=== DEBUG CORREO RECUPERACION ===");
  console.log("Enviando a:", emailUsuario);
  console.log("Reset URL:", resetUrl);
  try {
    await transporter.sendMail({
      from:    `"Sistema de Tickets MSPAS" <${process.env.MAIL_USER}>`,
      to:      emailUsuario,
      subject: "Recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Sistema de Tickets MSPAS</h2>
          <p>Hola <b>${nombreUsuario}</b>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${resetUrl}"
              style="
                padding: 12px 24px;
                background: #0d6efd;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                font-size: 1rem;
              ">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#6c757d; font-size:0.85rem;">
            Este enlace expirará en 1 hora. Si tú no solicitaste este cambio, puedes ignorar este correo.
          </p>
          <br>
          <p style="color:#6c757d; font-size:0.85rem;">Sistema de Tickets — Ministerio de Salud Pública y Asistencia Social</p>
        </div>
      `,
    });
    console.log("✅ Correo de recuperación enviado correctamente a:", emailUsuario);
  } catch (err) {
    console.error("❌ Error enviando correo de recuperación:");
    console.error("Mensaje:", err.message);
    throw err;
  }
};