// src/Componentes/TecnicoDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner } from "react-bootstrap";
import {
  FaTimes, FaFilter, FaCommentAlt,
  FaTicketAlt, FaPaperPlane,
  FaExclamationTriangle,
  FaUserTie, FaCheckCircle, FaPlayCircle, FaUser, FaSearch,
} from "react-icons/fa";
import { useServerWatch } from "../../Hooks/useServerWatch";
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

/* ===== Helpers ===== */
const PRIORIDAD_STYLE = {
  ALTA:        { bg: "#fff1f0", color: "#cf1322", label: "Alta" },
  MEDIA:       { bg: "#fffbe6", color: "#d46b08", label: "Media" },
  BAJA:        { bg: "#f6ffed", color: "#389e0d", label: "Baja" },
  SIN_ASIGNAR: { bg: "#f5f5f5", color: "#8c8c8c", label: "Sin asignar" },
};

/* ===== TIEMPO LABORAL 8:00 AM A 4:30 PM ===== */
const MINUTOS_INICIO_JORNADA = 8 * 60; // 08:00
const MINUTOS_FIN_JORNADA = 16 * 60 + 30; // 16:30

const clonarFecha = (fecha) => new Date(fecha.getTime());

const setHoraMinutos = (fecha, minutosTotales) => {
  const f = clonarFecha(fecha);
  f.setHours(0, 0, 0, 0);
  f.setMinutes(minutosTotales);
  return f;
};

const obtenerMinutosLaborales = (inicio, fin) => {
  if (!inicio || !fin) return 0;

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);

  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) return 0;
  if (fechaFin <= fechaInicio) return 0;

  let totalMinutos = 0;
  let cursor = clonarFecha(fechaInicio);
  cursor.setSeconds(0, 0);

  const finReal = clonarFecha(fechaFin);
  finReal.setSeconds(0, 0);

  while (cursor < finReal) {
    const inicioDia = setHoraMinutos(cursor, MINUTOS_INICIO_JORNADA);
    const finDia = setHoraMinutos(cursor, MINUTOS_FIN_JORNADA);

    const tramoInicio = new Date(
      Math.max(cursor.getTime(), inicioDia.getTime())
    );
    const tramoFin = new Date(
      Math.min(finReal.getTime(), finDia.getTime())
    );

    if (tramoFin > tramoInicio) {
      totalMinutos += Math.floor((tramoFin - tramoInicio) / 1000 / 60);
    }

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return totalMinutos;
};

const formatearMinutosLaborales = (diff) => {
  if (diff < 60) return `${diff} min`;

  const horas = Math.floor(diff / 60);
  const minutos = diff % 60;

  return `${horas}h ${minutos}m`;
};

function calcularTiempoResolucion(desde, hasta) {
  if (!desde) return null;

  const fin = hasta ? new Date(hasta) : new Date();
  const diff = obtenerMinutosLaborales(desde, fin);

  const texto = formatearMinutosLaborales(diff);
  const color = diff <= 60 ? "#198754" : diff <= 480 ? "#e65100" : "#dc3545";

  return { texto: `⏱ ${texto}`, color, enCurso: !hasta };
}

function estadoBadge(nombre, nombreVerboso, fueReabierto = false) {
  const n = (nombre || "").toUpperCase();
  const estilos = {
    ABIERTO:    { bg: "rgba(25,135,84,0.12)",  color: "#0f5132", border: "rgba(25,135,84,0.3)"  },
    EN_PROCESO: { bg: "rgba(245,158,11,0.12)", color: "#92400e", border: "rgba(245,158,11,0.3)" },
    CERRADO:    { bg: "rgba(13,110,253,0.12)", color: "#084298", border: "rgba(13,110,253,0.2)" },
    ANULADO:    { bg: "rgba(176,42,55,0.12)",  color: "#842029", border: "rgba(176,42,55,0.3)"  },
    REABIERTO:  { bg: "rgba(111,66,193,0.12)", color: "#6f42c1", border: "rgba(111,66,193,0.3)" },
  };

  const sEstado = estilos[n] || { bg: "rgba(108,117,125,0.12)", color: "#495057", border: "rgba(108,117,125,0.3)" };
  const sReabierto = estilos["REABIERTO"];

  const badgeStyle = {
    display: "inline-block", padding: "4px 10px", borderRadius: 999,
    fontSize: "0.72rem", fontWeight: 800,
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {fueReabierto && (
        <span style={{
          ...badgeStyle,
          background: sReabierto.bg,
          color: sReabierto.color,
          border: `1px solid ${sReabierto.border}`,
        }}>
          Reabierto
        </span>
      )}
      <span style={{
        ...badgeStyle,
        background: sEstado.bg,
        color: sEstado.color,
        border: `1px solid ${sEstado.border}`,
      }}>
        {nombreVerboso || nombre}
      </span>
    </span>
  );
}

function formatFechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPrioridadInfo(ticket, prioridadesById) {
  const keyFromInclude = ticket?.prioridadTicket?.nombre?.toUpperCase();
  if (keyFromInclude && PRIORIDAD_STYLE[keyFromInclude]) {
    const base = PRIORIDAD_STYLE[keyFromInclude];
    return {
      ...base,
      label: ticket?.prioridadTicket?.nombreVerboso || base.label,
      raw: keyFromInclude,
    };
  }

  const id = ticket?.prioridadTicketId;
  if (id && prioridadesById?.[id]) {
    const p = prioridadesById[id];
    const key = (p?.nombre || "").toUpperCase();
    const base = PRIORIDAD_STYLE[key] || PRIORIDAD_STYLE.SIN_ASIGNAR;
    return {
      ...base,
      label: p?.nombreVerboso || base.label,
      raw: key || "SIN_ASIGNAR",
    };
  }

  const legacy = (ticket?.prioridad || "").toUpperCase();
  if (legacy && PRIORIDAD_STYLE[legacy]) return { ...PRIORIDAD_STYLE[legacy], raw: legacy };

  return { ...PRIORIDAD_STYLE.SIN_ASIGNAR, raw: "SIN_ASIGNAR" };
}

/* ═══════════════════════════════════════════════
   MODAL GENÉRICO
═══════════════════════════════════════════════ */
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div className="card border-0 shadow" style={{
        width: "100%", maxWidth, maxHeight: "90vh",
        borderRadius: 16, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div className="d-flex justify-content-between align-items-center px-4 py-3"
          style={{ borderBottom: "1px solid #f0f0f0" }}>
          <span className="fw-bold">{title}</span>
          <button onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8c8c8c" }}>
            <FaTimes />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DETALLE TICKET PARA TÉCNICO
═══════════════════════════════════════════════ */
function DetalleTicketTecnico({
  ticketId,
  onClose,
  onActualizado,
  estados = [],
  prioridadesById = {},
}) {
  const [ticket, setTicket]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [comentario, setComentario]     = useState("");
  const [comentarios, setComentarios]   = useState([]);
  const [archivo, setArchivo]           = useState(null);
  const [enviando, setEnviando]         = useState(false);
  const [cambiandoEstado, setCambiando] = useState(false);
  const [confirmarEstado, setConfirmar] = useState(null);
  const [error, setError]               = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/${ticketId}`);
      setTicket(data);
      if (data.comentarios) {
        setComentarios(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const nuevos = data.comentarios.filter(c => !existingIds.has(c.id));
          return [...prev, ...nuevos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    } catch {
      setError("Error al cargar el ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const cargarComentarios = useCallback(async () => {
    try {
      const { data } = await api.get("/ticket-comentarios", { params: { ticketId }, });
      const lista = Array.isArray(data) ? data : Array.isArray(data?.comentarios) ? data.comentarios : [];
      setComentarios(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const nuevos = lista.filter(c => !existingIds.has(c.id));
        return [...prev, ...nuevos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    } catch (err) {
      console.error("Error cargando comentarios", err);
    }
  }, [ticketId]);

  const enviarComentario = async () => {
    if (!comentario.trim() && !archivo) return;
    setEnviando(true);
    try {
      const userId = localStorage.getItem("id_usuario");
      const formData = new FormData();
      formData.append("ticketId", ticketId);
      formData.append("autorUserId", userId);
      formData.append("autorTipo", "TECNICO");
      formData.append("comentario", comentario);
      if (archivo) formData.append("archivo", archivo);

      const { data: nuevoComentario } = await api.post("/ticket-comentarios", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setComentario("");
      setArchivo(null);
      const fileInput = document.getElementById("file-input-tecnico");
      if (fileInput) fileInput.value = "";

      setComentarios(prev => [...prev, nuevoComentario].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      ));
    } catch (err) {
      setError(err.response?.data?.error || "Error al enviar comentario.");
    } finally {
      setEnviando(false);
    }
  };

 const cambiarEstado = async (estadoId) => {
  setCambiando(true);
  setConfirmar(null);
  try {
    const { data: ticketActualizado } = await api.put(`/tickets/${ticketId}`, { estadoTicketId: estadoId });
    setTicket(ticketActualizado);
    onActualizado(ticketActualizado);
  } catch (err) {
    setError(err.response?.data?.error || "Error al cambiar estado.");
  } finally {
    setCambiando(false);
  }
};

  useEffect(() => {
    cargar();
    cargarComentarios();
    const interval = setInterval(() => {
      cargarComentarios();
    }, 5000);
    return () => clearInterval(interval);
  }, [cargar, cargarComentarios]);

  const estadoActual = ticket?.estadoTicket?.nombre?.toUpperCase();
  const esCerrado    = estadoActual === "CERRADO";
  const esAnulado    = ticket?.anulado;
  const prio         = ticket ? getPrioridadInfo(ticket, prioridadesById) : null;

const accionesDisponibles = useMemo(() => {
  if (!ticket || esAnulado) return [];

  return estados
    .filter(e => {
      const n = e.nombre?.toUpperCase();

      if (estadoActual === "ABIERTO") {
        return n === "EN_PROCESO" || n === "CERRADO";
      }
      if (estadoActual === "EN_PROCESO") {
        return n === "CERRADO";
      }
      return false;
    })

    .map(e => ({
      id: e.id,
      nombre: e.nombre,
      label: e.nombreVerboso || e.nombre,
      icon:
        e.nombre?.toUpperCase() === "CERRADO"
          ? FaCheckCircle
          : FaPlayCircle,
      color:
        e.nombre?.toUpperCase() === "CERRADO"
          ? "#28a745"
          : "#ffc107",
    }));
}, [ticket, estados, estadoActual, esAnulado]);

  return (
    <Modal title={ticket ? `Ticket — ${ticket.noSolicitud}` : "Cargando..."} onClose={onClose} maxWidth={700}>
      {loading && (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />Cargando...
        </div>
      )}
      {error && (
        <div className="alert alert-danger small py-2 mb-3">
          <FaExclamationTriangle className="me-2" />{error}
        </div>
      )}

      {ticket && !loading && (
        <>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
{estadoBadge(ticket.estadoTicket?.nombre, ticket.estadoTicket?.nombreVerboso, ticket.fueReabierto)}            
<span className="badge" style={{ background: prio.bg, color: prio.color, fontWeight: 700 }}>
              {prio.label}
            </span>
            {ticket.anulado && <span className="badge bg-danger">Anulado</span>}
          </div>

          <div className="rounded-3 p-3 mb-4" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
            <div className="row g-2">
              {[
                ["Tipo",             ticket.tipoTicket?.nombre],
                ["Solicitante",      ticket.solicitante?.nombre],
                ["Departamento",     ticket.departamento?.nombre],
                ["Edificio",         ticket.edificio?.nombre],
                ["Nivel",            ticket.nivel?.nombre],
                ["Oficina",          ticket.oficina],
                ["Extensión",        ticket.extension],
                ["Fecha creación",   formatFechaHora(ticket.fechaSolicitud)],
                ["Fecha asignación", formatFechaHora(ticket.fechaAsignacion)],
                ["Fecha resolución", formatFechaHora(ticket.fechaResolucion)],
              ].map(([k, v]) => (
                <div className="col-6" key={k}>
                  <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{v || "—"}</div>
                </div>
              ))}

              {(() => {
                const r = calcularTiempoResolucion(ticket.fechaAsignacion, ticket.fechaResolucion);
                if (!r) return null;
                return (
                  <div className="col-12">
                    <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600, marginBottom: 4 }}>
                      Tiempo de resolución
                    </div>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 999,
                      fontSize: ".75rem", fontWeight: 800, whiteSpace: "nowrap",
                      background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}44`,
                    }}>
                      {r.texto}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mb-4">
            <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600, marginBottom: 8 }}>DESCRIPCIÓN</div>
            <div className="rounded-3 p-3" style={{ background: "#fafafa", border: "1px solid #f0f0f0", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {ticket.descripcion}
            </div>
          </div>

          {accionesDisponibles.length > 0 && (
            <div className="mb-4">
              <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600, marginBottom: 10 }}>CAMBIAR ESTADO</div>
              <div className="d-flex gap-2 flex-wrap">
                {accionesDisponibles.map(acc => (
                  confirmarEstado === acc.id ? (
                    <div key={acc.id} className="d-flex align-items-center gap-2 p-2 rounded-3"
                      style={{ background: "#fff3cd", border: "1px solid #ffc107" }}>
                      <span style={{ fontSize: "0.85rem" }}>¿Confirmar cambio a <strong>{acc.label}</strong>?</span>
                      <button
                        onClick={() => cambiarEstado(acc.id)}
                        disabled={cambiandoEstado}
                        className="btn btn-sm fw-bold"
                        style={{ background: acc.color, color: "#fff", border: "none", borderRadius: 8 }}
                      >
                        {cambiandoEstado ? <Spinner animation="border" size="sm" /> : "Sí"}
                      </button>
                      <button onClick={() => setConfirmar(null)}
                        className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      key={acc.id}
                      onClick={() => setConfirmar(acc.id)}
                      disabled={cambiandoEstado}
                      className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                      style={{
                        background: `${acc.color}18`, color: acc.color,
                        border: `1px solid ${acc.color}55`, borderRadius: 10,
                      }}
                    >
                      <acc.icon /> {acc.label}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          {/* ═══ COMENTARIOS ═══ */}
          <div className="mb-4">
            <div style={{ fontSize: "0.8rem", color: "#6c757d", fontWeight: 600, marginBottom: 12 }}>
              COMENTARIOS ({comentarios.length})
            </div>

            <div style={{
              maxHeight: 200, overflowY: "auto", paddingRight: 8,
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {comentarios.length === 0 ? (
                <div className="text-center text-muted py-5" style={{ fontSize: "0.9rem" }}>
                  <FaCommentAlt style={{ fontSize: "1.8rem", opacity: 0.3, marginBottom: 8 }} /><br />
                  Aún no hay comentarios en este ticket.
                </div>
              ) : (
                comentarios.map(c => {
                  const esTecnico = c.autorTipo === "TECNICO";
                  const autorNombre = c.autor?.nombre || (esTecnico ? "Tú" : "Solicitante");
                  return (
                    <div key={c.id} style={{
                      alignSelf: esTecnico ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                        justifyContent: esTecnico ? "flex-end" : "flex-start",
                      }}>
                        {!esTecnico && (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "#e6f4ff", color: "#096dd9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <FaUser />
                          </div>
                        )}
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: esTecnico ? "#2f9e44" : "#0958d3" }}>
                          {autorNombre}
                        </div>
                        {esTecnico && (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "#f6ffed", color: "#389e0d",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <FaUserTie />
                          </div>
                        )}
                        <small style={{ color: "#adb5bd", fontSize: "0.74rem" }}>
                          {new Date(c.createdAt).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                        </small>
                      </div>

                      <div style={{
                        padding: "10px 14px", borderRadius: 12,
                        background: esTecnico ? "#f6ffed" : "#e6f4ff",
                        border: `1px solid ${esTecnico ? "#c3f0ca" : "#91caff"}`,
                        borderTopLeftRadius: esTecnico ? 12 : 4,
                        borderTopRightRadius: esTecnico ? 4 : 12,
                        fontSize: "0.9rem", lineHeight: 1.45,
                      }}>
                        {c.comentario}

                        {c.archivoUrl && (
                          <div className="mt-2">
                            {/\.(jpg|jpeg|png|gif|webp)$/i.test(c.archivoUrl) ? (
                              <img
                                src={`${API_BASE}/uploads/${c.archivoUrl}`}
                                alt="adjunto"
                                style={{ maxWidth: "100%", borderRadius: 8, maxHeight: 200, objectFit: "contain" }}
                              />
                            ) : (
                              <a
                                href={`${API_BASE}/uploads/${c.archivoUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "0.82rem", color: "#096dd9" }}
                              >
                                📄 Ver archivo adjunto
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!esCerrado && !esAnulado && (
              <div className="mt-3">
                {archivo && (
                  <div className="d-flex align-items-center gap-2 mb-2 px-2 py-1 rounded-3"
                    style={{ background: "#f6ffed", border: "1px solid #c3f0ca", fontSize: "0.82rem" }}>
                    <span style={{ color: "#389e0d" }}>📎 {archivo.name}</span>
                    <button onClick={() => {
                      setArchivo(null);
                      const fi = document.getElementById("file-input-tecnico");
                      if (fi) fi.value = "";
                    }}
                      style={{ border: "none", background: "transparent", color: "#cf1322", cursor: "pointer", fontSize: "0.85rem" }}>
                      <FaTimes />
                    </button>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <label htmlFor="file-input-tecnico"
                    title="Adjuntar archivo"
                    style={{
                      cursor: "pointer", borderRadius: 12, padding: "6px 12px",
                      background: "rgba(95,125,156,0.1)", border: "1px solid rgba(95,125,156,0.25)",
                      color: "var(--primaryColor)", display: "flex", alignItems: "center",
                    }}>
                    📎
                    <input
                      id="file-input-tecnico"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      style={{ display: "none" }}
                      onChange={e => setArchivo(e.target.files[0] || null)}
                    />
                  </label>

                  <input
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarComentario(); }
                    }}
                    placeholder="Escribe tu comentario aquí..."
                    className="form-control modern-input"
                    style={{ fontSize: "0.9rem", borderRadius: 12 }}
                    disabled={enviando}
                  />

                  <button
                    onClick={enviarComentario}
                    disabled={enviando || (!comentario.trim() && !archivo)}
                    className="btn btn-save px-3 d-flex align-items-center"
                    style={{ borderRadius: 12 }}
                  >
                    {enviando ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL - DASHBOARD TÉCNICO
═══════════════════════════════════════════════ */
const TecnicoDashboard = () => {
  useServerWatch(15);
  const [ticketsList, setTicketsList]           = useState([]);
  const [estados, setEstados]                   = useState([]);
  const [prioridades, setPrioridades]           = useState([]);
  const [total, setTotal]                       = useState(0);
  const [page, setPage]                         = useState(1);
  const [totalPages, setTotalPages]             = useState(1);
  const [loading, setLoading]                   = useState(false);
  const [filtroEstado, setFiltroEstado]         = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtroBusqueda, setFiltroBusqueda]     = useState("");
  const [mostrarDetalle, setMostrarDetalle]     = useState(null);

  const tecnicoId = useMemo(
    () => localStorage.getItem("id_tecnico") || localStorage.getItem("id_usuario"),
    []
  );

  const prioridadesById = useMemo(() => {
    const map = {};
    for (const p of prioridades) map[p.id] = p;
    return map;
  }, [prioridades]);

const cargarTickets = useCallback(async (p = 1) => {
  setLoading(true);

  try {
    const params = {
      page: p,
      limit: 8,
    };

    if (filtroEstado) {
      params.estadoId = filtroEstado;
    }

    if (filtroFechaDesde) {
      params.fechaDesde = filtroFechaDesde;
    }

    if (filtroFechaHasta) {
      params.fechaHasta = filtroFechaHasta;
    }

    if (filtroBusqueda.trim()) {
      params.busqueda = filtroBusqueda.trim();
    }

    const { data } = await api.get(
      "/tickets/tecnico/mis-tickets",
      { params }
    );

    setTicketsList(data.tickets || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setPage(p);

  } catch (err) {
    console.error("Error cargando tickets del técnico:", err);
  } finally {
    setLoading(false);
  }
}, [
  filtroEstado,
  filtroFechaDesde,
  filtroFechaHasta,
  filtroBusqueda
]);

  // Filtrado por texto en el cliente (instantáneo, sin llamada al backend)
  const ticketsFiltrados = useMemo(() => {
    const q = filtroBusqueda.trim().toLowerCase();
    if (!q) return ticketsList;
    return ticketsList.filter(t =>
      (t.noSolicitud || "").toLowerCase().includes(q) ||
      (t.tipoTicket?.nombre || "").toLowerCase().includes(q) ||
      (t.solicitante?.nombre || "").toLowerCase().includes(q) ||
      (t.departamento?.nombre || "").toLowerCase().includes(q) ||
      (t.departamento?.abreviatura || "").toLowerCase().includes(q) ||
      (t.edificio?.nombre || "").toLowerCase().includes(q) ||
      (t.nivel?.nombre || "").toLowerCase().includes(q) ||
      (t.descripcion || "").toLowerCase().includes(q)
    );
  }, [ticketsList, filtroBusqueda]);

useEffect(() => {
  const cargarDatosIniciales = async () => {
    try {
      const [estadosRes, prioridadesRes] = await Promise.all([
        api.get("/estado-ticket"),
        api.get("/prioridad-ticket"),
      ]);

      setEstados(estadosRes.data || []);
      setPrioridades(prioridadesRes.data || []);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  cargarDatosIniciales();
  cargarTickets(1);
}, [cargarTickets]);

const limpiarFiltros = () => {
  setFiltroEstado("");
  setFiltroFechaDesde("");
  setFiltroFechaHasta("");
  setFiltroBusqueda("");

  // Recargar la primera página sin filtros
  setTimeout(() => {
    cargarTickets(1);
  }, 0);
};

  const hayFiltrosActivos = filtroEstado || filtroFechaDesde || filtroFechaHasta || filtroBusqueda.trim();

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
      <Header logoPath={null} />
      <main className="flex-grow-1 px-3 py-4">
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-0">
                <FaUserTie className="me-2" style={{ color: "var(--primaryColor)" }} />
                Mis Tickets Asignados
              </h4>
              <p className="text-muted small mb-0">
                {total} ticket{total !== 1 ? "s" : ""} asignados
                {hayFiltrosActivos && (
                  <span className="ms-2 badge" style={{
                    background: "rgba(95,125,156,0.12)", color: "var(--primaryColor)",
                    border: "1px solid rgba(95,125,156,0.3)", fontWeight: 600, borderRadius: 999,
                  }}>
                    Filtros activos
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* ═══ PANEL DE FILTROS ═══ */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
            <div className="d-flex flex-wrap gap-3 align-items-end">

              {/* Búsqueda por texto */}
              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <label className="form-label small fw-semibold mb-1">Buscar</label>
                <div style={{ position: "relative" }}>
                  <FaSearch style={{
                    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                    color: "#adb5bd", fontSize: "0.82rem", pointerEvents: "none",
                  }} />
                  <input
                    type="text"
                    value={filtroBusqueda}
                    onChange={e => setFiltroBusqueda(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") cargarTickets(1); }}
                    placeholder="No. solicitud, tipo, solicitante..."
                    className="form-control form-control-sm modern-input"
                    style={{ paddingLeft: 30 }}
                  />
                  {filtroBusqueda && (
                    <button
                      onClick={() => { setFiltroBusqueda(""); setTimeout(() => cargarTickets(1), 0); }}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        border: "none", background: "transparent", color: "#adb5bd",
                        cursor: "pointer", padding: 0, lineHeight: 1, fontSize: "0.82rem",
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

{/* Estado */}
<div>
  <label className="form-label small fw-semibold mb-1">Estado</label>
  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
    className="form-select form-select-sm modern-input" style={{ minWidth: 180 }}>
    <option value="">Todos</option>
    <option value="REABIERTO">Reabierto</option>
    {estados
      .filter(e => e.nombre?.toUpperCase() !== "REABIERTO")
      .map(e => (
        <option key={e.id} value={e.id}>{e.nombreVerboso || e.nombre}</option>
      ))
    }
  </select>
</div>

              {/* Desde */}
              <div>
                <label className="form-label small fw-semibold mb-1">Desde</label>
                <input type="date" value={filtroFechaDesde}
                  onChange={e => setFiltroFechaDesde(e.target.value)}
                  className="form-control form-control-sm modern-input" />
              </div>

              {/* Hasta */}
              <div>
                <label className="form-label small fw-semibold mb-1">Hasta</label>
                <input type="date" value={filtroFechaHasta}
                  onChange={e => setFiltroFechaHasta(e.target.value)}
                  className="form-control form-control-sm modern-input" />
              </div>

              {/* Botones */}
              <div className="d-flex gap-2">
                <button onClick={() => cargarTickets(1)}
                  className="btn btn-save btn-sm d-flex align-items-center gap-1">
                  <FaFilter /> Filtrar
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="btn btn-outline-secondary btn-sm btn-cancel"
                  disabled={!hayFiltrosActivos}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" className="me-2" />Cargando tickets...
              </div>
            ) : ticketsFiltrados.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaTicketAlt style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.3 }} />
                <div className="fw-semibold">
                  {hayFiltrosActivos ? "Sin resultados para los filtros aplicados" : "No tienes tickets asignados"}
                </div>
                <div className="small">
                  {hayFiltrosActivos
                    ? <button onClick={limpiarFiltros} className="btn btn-link btn-sm p-0 mt-1">Limpiar filtros</button>
                    : "Cuando te asignen uno aparecerá aquí"
                  }
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: "0.90rem" }}>
                  <thead style={{ background: "#fafafa" }}>
                    <tr>
                      {["No. Solicitud", "Tipo", "Solicitante", "Departamento", "Edificio", "Nivel", "Estado", "Prioridad", "Fecha creación", "Tiempo resolución", ""].map(h => (
                        <th key={h} className="py-3 px-3 fw-bold text-secondary border-0" style={{ whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsFiltrados.map(t => {
                      const prio = getPrioridadInfo(t, prioridadesById);
                      return (
                        <tr key={t.id}>
                          <td className="px-3 py-3 fw-bold" style={{ color: "var(--primaryColor)" }}>
                            {t.noSolicitud}
                          </td>
                          <td className="px-3 py-3">{t.tipoTicket?.nombre || "—"}</td>
                          <td className="px-3 py-3">{t.solicitante?.nombre || "—"}</td>
                          <td className="px-3 py-3">{t.departamento?.abreviatura || t.departamento?.nombre || "—"}</td>
                          <td className="px-3 py-3">{t.edificio?.nombre || "—"}</td>
                          <td className="px-3 py-3">{t.nivel?.nombre || "—"}</td>
                          <td className="px-3 py-3">
{estadoBadge(t.estadoTicket?.nombre, t.estadoTicket?.nombreVerboso, t.fueReabierto)}                        
 </td>
                          <td className="px-3 py-3">
                            <span className="badge" style={{ background: prio.bg, color: prio.color, fontWeight: 700 }}>
                              {prio.label}
                            </span>
                          </td>
                          <td className="px-3 py-3" style={{ whiteSpace: "nowrap" }}>
                            {formatFechaHora(t.fechaSolicitud)}
                          </td>
                          <td className="px-3 py-3">
                            {(() => {
                              const r = calcularTiempoResolucion(t.fechaAsignacion, t.fechaResolucion);
                              if (!r) return <span className="text-muted" style={{ fontSize: ".82rem" }}>—</span>;
                              return (
                                <span style={{
                                  display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                  fontSize: ".75rem", fontWeight: 800, whiteSpace: "nowrap",
                                  background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}44`,
                                }}>
                                  {r.texto}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => setMostrarDetalle(t.id)}
                              className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                              style={{
                                background: "rgba(95,125,156,0.1)",
                                color: "var(--primaryColor)",
                                border: "none", borderRadius: 8,
                              }}
                            >
                              <FaCommentAlt style={{ fontSize: "0.7rem" }} /> Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center px-4 py-3"
                style={{ borderTop: "1px solid #f0f0f0" }}>
                <nav>
                  <ul className="pagination mb-0">
                    {[...Array(totalPages)].map((_, index) => {
                      const p = index + 1;
                      const active = page === p;
                      return (
                        <li key={p} className={`page-item ${active ? "active" : ""}`}>
                          <button
                            onClick={() => cargarTickets(p)}
                            className="page-link"
                            style={{
                              background: active ? "var(--primaryColor, #5f7d9c)" : "#fff",
                              color: active ? "#fff" : "var(--primaryColor, #5f7d9c)",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {mostrarDetalle && (
        <DetalleTicketTecnico
          ticketId={mostrarDetalle}
          estados={estados}
          prioridadesById={prioridadesById}
          onClose={() => setMostrarDetalle(null)}
          onActualizado={(ticketActualizado) => {
            if (ticketActualizado) {
              setTicketsList(prev => [
                ticketActualizado,
                ...prev.filter(t => t.id !== ticketActualizado.id)
              ]);
            } else {
              cargarTickets(page);
            }
          }}
        />
      )}

      <style>{`
        :root { --brandBlue: #5f7d9c; --brandBlueDark: #4f6b88; }
        .modern-input { border-radius: 10px !important; border: 1px solid #d9e3ee !important; }
        .modern-input:focus { border-color: rgba(95,125,156,.45) !important; box-shadow: 0 0 0 .2rem rgba(95,125,156,.18) !important; }
        .btn-save { background: var(--brandBlue) !important; border: 1px solid var(--brandBlue) !important; border-radius: 10px !important; color: #fff !important; }
        .btn-save:hover { background: var(--brandBlueDark) !important; border-color: var(--brandBlueDark) !important; }
        .btn-cancel { border-radius: 10px !important; }
        .table-hover tbody tr:hover { background: rgba(95,125,156,0.05) !important; }
      `}</style>
    </div>
  );
};

export default TecnicoDashboard;