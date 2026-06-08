import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner } from "react-bootstrap";
import { FaStar, FaPaperPlane, FaTicketAlt } from "react-icons/fa";
import Header from "../Header";
import Footer from "../Footer";

/* ===== Base URL ===== */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

/* ===== axios instance ===== */
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ===== Obtener ticketId desde la URL ===== */
function getTicketIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/encuesta\/(\d+)/);
  if (match) return match[1];
  const params = new URLSearchParams(window.location.search);
  return params.get("ticketId") || params.get("id");
}

/* ═══════════════════════════════════════════════
   ESTRELLA
═══════════════════════════════════════════════ */
function Estrella({ filled, hovered, onClick, onMouseEnter, onMouseLeave, disabled }) {
  const activa = filled || hovered;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      style={{
        background: "none", border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: "2px 4px", fontSize: "2.2rem",
        color: activa ? "#f59e0b" : "#d1d5db",
        transform: activa ? "scale(1.15)" : "scale(1)",
        transition: "color 0.15s, transform 0.15s",
        lineHeight: 1,
      }}
    >
      <FaStar />
    </button>
  );
}

/* ═══════════════════════════════════════════════
   PANTALLA ESTADO (éxito / error)
═══════════════════════════════════════════════ */
function PantallaEstado({ icon, titulo, subtitulo }) {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
      <Header logoPath={null} />
      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{icon}</div>
            <h5 className="fw-bold mb-2">{titulo}</h5>
            <p className="text-muted small mb-0">{subtitulo}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
const EncuestaTicket = () => {
  const ticketId = getTicketIdFromUrl();

  const [ticket, setTicket]         = useState(null);
  const [estrellas, setEstrellas]   = useState(0);
  const [hover, setHover]           = useState(0);
  const [comentario, setComentario] = useState("");
  const [estado, setEstado]         = useState("loading");
  // loading | idle | enviando | enviado | error | yaRespondida | noEncontrado
  const [errorMsg, setErrorMsg]     = useState("");

  const labels  = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
  const colores = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  const activo  = hover || estrellas;

  const cargar = useCallback(async () => {
    if (!ticketId) {
      setEstado("error");
      setErrorMsg("No se encontró el identificador del ticket en la URL.");
      return;
    }
    setEstado("loading");
    try {
      const { data } = await api.get(`/encuesta/${ticketId}`);
      setTicket(data);
      setEstado("idle");
    } catch (err) {
      const status = err.response?.status;
      if (status === 404)      setEstado("noEncontrado");
      else if (status === 409) setEstado("yaRespondida");
      else if (status === 400) { setEstado("error"); setErrorMsg(err.response?.data?.error || "El ticket aún no ha sido cerrado."); }
      else                     { setEstado("error"); setErrorMsg("No se pudo cargar la encuesta. Intenta más tarde."); }
    }
  }, [ticketId]);

  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async () => {
    if (estrellas === 0) return;
    setEstado("enviando");
    try {
      await api.post(`/encuesta/${ticketId}`, {
        calificacion: estrellas,
        comentario: comentario.trim() || null,
      });
      setEstado("enviado");
    } catch (err) {
      if (err.response?.status === 409) setEstado("yaRespondida");
      else { setEstado("error"); setErrorMsg("Error al enviar la encuesta. Intenta de nuevo."); }
    }
  };

  /* ── Pantallas de estado ── */
  if (estado === "loading") {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
        <Header logoPath={null} />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />Cargando encuesta...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (estado === "noEncontrado") return (
    <PantallaEstado icon="⚠️" titulo="Ticket no encontrado"
      subtitulo="El enlace puede ser incorrecto o el ticket ya no existe." />
  );
  if (estado === "yaRespondida") return (
    <PantallaEstado icon="✅" titulo="¡Ya respondiste esta encuesta!"
      subtitulo="Gracias por tu tiempo. Tu opinión ya fue registrada." />
  );
  if (estado === "enviado") return (
    <PantallaEstado icon="🎉" titulo="¡Gracias por tu respuesta!"
      subtitulo="Tu opinión nos ayuda a mejorar el servicio de soporte técnico." />
  );
  if (estado === "error") return (
    <PantallaEstado icon="⚠️" titulo="Ocurrió un problema" subtitulo={errorMsg} />
  );

  /* ── Formulario ── */
  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
      <Header logoPath={null} />
      <main className="flex-grow-1 px-3 py-4">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Encabezado */}
          <div className="mb-4">
            <h4 className="fw-bold mb-0">
              <FaTicketAlt className="me-2" style={{ color: "var(--brandBlue, #5f7d9c)" }} />
              Encuesta de satisfacción
            </h4>
            <p className="text-muted small mb-0">
              Cuéntanos cómo fue tu experiencia con la atención recibida
            </p>
          </div>

          {/* Info del ticket */}
          {ticket && (
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
              <div className="row g-2" style={{ fontSize: "0.88rem" }}>
                <div className="col-12 col-sm-6">
                  <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600 }}>No. Solicitud</div>
                  <div className="fw-bold" style={{ color: "var(--brandBlue, #5f7d9c)" }}>{ticket.noSolicitud}</div>
                </div>
                {ticket.tecnico && (
                  <div className="col-12 col-sm-6">
                    <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600 }}>Técnico asignado</div>
                    <div className="fw-semibold">{ticket.tecnico.nombre}</div>
                  </div>
                )}
                <div className="col-12">
                  <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600 }}>Descripción</div>
                  <div>{ticket.descripcion}</div>
                </div>
              </div>
            </div>
          )}

          {/* Card encuesta */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
              <span className="fw-bold">Califica la atención recibida</span>
            </div>
            <div className="px-4 py-4">

              {/* Estrellas */}
              <div className="mb-4">
                <p className="fw-semibold mb-3" style={{ fontSize: "0.92rem", color: "#374151" }}>
                  ¿Qué tan satisfecho estás con la solución brindada? *
                </p>
                <div className="d-flex gap-1 justify-content-center mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Estrella
                      key={n}
                      filled={n <= estrellas}
                      hovered={n <= hover}
                      onClick={() => setEstrellas(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      disabled={estado === "enviando"}
                    />
                  ))}
                </div>
                <div className="text-center fw-bold" style={{
                  color: activo > 0 ? colores[activo] : "#adb5bd",
                  fontSize: "0.88rem",
                  minHeight: 22,
                }}>
                  {activo > 0 ? labels[activo] : "Selecciona una calificación"}
                </div>
              </div>

              {/* Comentario */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: "0.92rem", color: "#374151" }}>
                  Comentarios adicionales{" "}
                  <span className="text-muted fw-normal" style={{ fontSize: "0.82rem" }}>(opcional)</span>
                </label>
                <div className="form-floating">
                  <textarea
                    className="form-control modern-input"
                    placeholder="Comentarios"
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    maxLength={500}
                    style={{ height: 110, resize: "vertical" }}
                    disabled={estado === "enviando"}
                  />
                  <label className="text-muted">¿Algo que podamos mejorar?</label>
                </div>
                <div className="text-end" style={{ fontSize: "0.78rem", color: "#adb5bd", marginTop: 4 }}>
                  {comentario.length}/500
                </div>
              </div>

              {/* Botón */}
              <div className="d-flex justify-content-end">
                <button
                  onClick={enviar}
                  disabled={estrellas === 0 || estado === "enviando"}
                  className="btn btn-save fw-semibold d-flex align-items-center gap-2 px-4"
                >
                  {estado === "enviando"
                    ? <><Spinner animation="border" size="sm" />Enviando...</>
                    : <><FaPaperPlane />Enviar encuesta</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        :root { --brandBlue: #5f7d9c; --brandBlueDark: #4f6b88; }
        .modern-input { border-radius: 10px !important; border: 1px solid #d9e3ee !important; }
        .modern-input:focus { border-color: rgba(95,125,156,.45) !important; box-shadow: 0 0 0 .2rem rgba(95,125,156,.18) !important; }
        .btn-save { background: var(--brandBlue) !important; border: 1px solid var(--brandBlue) !important; border-radius: 10px !important; color: #fff !important; }
        .btn-save:hover:not(:disabled) { background: var(--brandBlueDark) !important; border-color: var(--brandBlueDark) !important; }
        .btn-save:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }
      `}</style>
    </div>
  );
};

export default EncuestaTicket;
