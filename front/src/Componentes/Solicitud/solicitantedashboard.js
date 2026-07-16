// src/Componentes/SolicitanteDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner } from "react-bootstrap";
import {
  FaPlus, FaTimes, FaFilter, FaCommentAlt,
  FaBan, FaTicketAlt, FaPaperPlane,
  FaExclamationTriangle,
  FaUser, FaUserTie,
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

/* ===================================================
   Resuelve URL del archivo para ruta local:
   - Solo el nombre del archivo → prefija API_BASE/uploads/
=================================================== */
function resolverUrlArchivo(archivoUrl) {
  if (!archivoUrl) return null;
  // Si ya viene como URL completa (http/https), úsala directo
  if (archivoUrl.startsWith("http://") || archivoUrl.startsWith("https://")) {
    return archivoUrl;
  }
  // Si viene con /uploads/ al inicio
  if (archivoUrl.startsWith("/uploads/")) {
    return `${API_BASE}${archivoUrl}`;
  }
  // Si viene solo el nombre del archivo
  return `${API_BASE}/uploads/${archivoUrl}`;
}

function esImagen(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function estadoBadge(nombre, nombreVerboso) {
  const n = (nombre || "").toUpperCase().replace(/\s+/g, "_");
  const estilos = {
    ABIERTO: { bg: "rgba(25,135,84,0.12)", color: "#0f5132", border: "rgba(25,135,84,0.3)" },
    EN_PROCESO: { bg: "rgba(245,158,11,0.12)", color: "#92400e", border: "rgba(245,158,11,0.3)" },
    CERRADO: { bg: "rgba(13,110,253,0.12)", color: "#084298", border: "rgba(13,110,253,0.2)" },
    ANULADO: { bg: "rgba(176,42,55,0.12)", color: "#842029", border: "rgba(176,42,55,0.3)" },
  };
  const s = estilos[n] || { bg: "rgba(108,117,125,0.12)", color: "#495057", border: "rgba(108,117,125,0.3)" };
  return (
    <span style={{
      display: "inline-block", padding: "4px 10px", borderRadius: 999,
      fontSize: "0.72rem", fontWeight: 800,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {nombreVerboso || nombre}
    </span>
  );
}

function formatFechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
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
        <div style={{ 
          overflowY: "auto", 
          padding: "20px 24px",
          // Ocultar scrollbar en Firefox
          scrollbarWidth: "thin",
        }}>
          {/* Ocultar scrollbar en Chrome/Safari/Edge */}
          <style>{`
            .modal-body-content::-webkit-scrollbar {
              width: 6px;
            }
            .modal-body-content::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .modal-body-content::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 10px;
            }
            .modal-body-content::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>
          <div className="modal-body-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FORMULARIO CREAR TICKET
═══════════════════════════════════════════════ */
function FormCrearTicket({ onSuccess, onClose, tipos = [], edificios = [] }) {
  const [form, setForm] = useState({
    oficina: "", extension: "", tipoTicketId: "",
    tipoPersonalizado: "", descripcion: "", edificioId: "", nivelId: "",
  });
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  const [niveles, setNiveles] = useState([]);
  const [loadingNiveles, setLoadingNiveles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleEdificioChange = async (e) => {
    const edificioId = e.target.value;
    setForm(f => ({ ...f, edificioId, nivelId: "" }));
    setNiveles([]);
    setError("");
    if (!edificioId) return;
    setLoadingNiveles(true);
    try {
      const { data } = await api.get("/niveles", { params: { edificioId } });
      setNiveles(data);
    } catch { setNiveles([]); }
    finally { setLoadingNiveles(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oficina, extension, tipoTicketId, tipoPersonalizado, descripcion, edificioId, nivelId } = form;

    // Validar que haya tipo (ya sea del select o escrito)
    const tienetipoValido = modoPersonalizado
      ? tipoPersonalizado.trim() !== ""
      : tipoTicketId !== "";

    if (!oficina.trim() || !extension.trim() || !tienetipoValido || !descripcion.trim() || !edificioId || !nivelId) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const userDepartamento = JSON.parse(localStorage.getItem('userDepartamento') || 'null');
    const userSubDepartamento = JSON.parse(localStorage.getItem('userSubDepartamento') || 'null');

    setLoading(true);
    try {
      await api.post("/tickets", {
        oficina: oficina.trim(),
        extension: extension.trim(),
        // Si es personalizado, manda null en el id y el texto en tipoPersonalizado
        tipoTicketId: modoPersonalizado ? null : Number(tipoTicketId),
        tipoPersonalizado: modoPersonalizado ? tipoPersonalizado.trim() : null,
        descripcion: descripcion.trim(),
        id_edificio: Number(edificioId),
        id_nivel: Number(nivelId),
        departamentoId: userDepartamento?.id || null,
        subDepartamento_SolicitanteId: userSubDepartamento?.id || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear el ticket.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger small py-2 mb-3">
          <FaExclamationTriangle className="me-2" />{error}
        </div>
      )}

<div className="row g-3 mb-3">
  <div className="col-6">
    <label className="small fw-semibold mb-1" style={{ color: "#495057" }}>No. Oficina *</label>
    <input
      name="oficina"
      value={form.oficina}
      onChange={(e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) setForm({ ...form, oficina: value });
      }}
      type="text"
      className="form-control modern-input"
      placeholder="Ej. 10"
    />
  </div>
  <div className="col-6">
    <label className="small fw-semibold mb-1" style={{ color: "#495057" }}>No. Extensión *</label>
    <input
      name="extension"
      value={form.extension}
      onChange={(e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) setForm({ ...form, extension: value });
      }}
      type="text"
      className="form-control modern-input"
      placeholder="Ej. 1550"
    />
  </div>
</div>

      <div className="form-floating mb-3">
        <select name="edificioId" value={form.edificioId} onChange={handleEdificioChange}
          className="form-select modern-input">
          <option value="">Seleccionar edificio...</option>
          {edificios.map(e => <option key={e.id_edificio} value={e.id_edificio}>{e.nombre}</option>)}
        </select>
        <label>Edificio *</label>
      </div>

      {form.edificioId && (
        <div className="form-floating mb-3">
          <select name="nivelId" value={form.nivelId} onChange={handleChange}
            className="form-select modern-input" disabled={loadingNiveles}>
            <option value="">{loadingNiveles ? "Cargando niveles..." : "Seleccionar nivel..."}</option>
            {niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
          </select>
          <label>Nivel *</label>
        </div>
      )}

      {/* ── Tipo de ticket con toggle ── */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="small fw-semibold" style={{ color: "#495057" }}>
            Tipo de Ticket *
          </label>
          <button
            type="button"
            onClick={() => {
              setModoPersonalizado(!modoPersonalizado);
              setForm(f => ({ ...f, tipoTicketId: "", tipoPersonalizado: "" }));
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 700,
              color: "var(--primaryColor, #5f7d9c)",
              textDecoration: "underline",
            }}
          >
            {modoPersonalizado ? "← Elegir de la lista" : "✏️ Escribir tipo personalizado"}
          </button>
        </div>

        {modoPersonalizado ? (
          <input
            name="tipoPersonalizado"
            value={form.tipoPersonalizado}
            onChange={handleChange}
            type="text"
            className="form-control modern-input"
            placeholder="Describe el tipo de ticket..."
            maxLength={100}
          />
        ) : (
          <select name="tipoTicketId" value={form.tipoTicketId} onChange={handleChange}
            className="form-select modern-input">
            <option value="">Seleccionar tipo...</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        )}
      </div>

      <div className="form-floating mb-4">
        <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
          className="form-control modern-input" placeholder="Descripción"
          style={{ height: 110, resize: "vertical" }} />
        <label>Descripción *</label>
      </div>

      <div className="d-flex justify-content-between gap-2">
        <button type="button" onClick={onClose} className="btn btn-cancel btn-outline-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn btn-save px-4 fw-semibold">
          {loading
            ? <><Spinner animation="border" size="sm" className="me-2" />Creando...</>
            : <><FaPlus className="me-2" />Crear Ticket</>}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════
   DETALLE TICKET - MODIFICADO PARA ELIMINAR SCROLLBAR INTERNO
═══════════════════════════════════════════════ */
function DetalleTicket({ ticketId, onClose, onAnulado }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");

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
    } catch { setError("Error al cargar el ticket."); }
    finally { setLoading(false); }
  }, [ticketId]);

  const cargarComentarios = useCallback(async () => {
    try {
      const { data } = await api.get( `/ticket-comentarios/ticket/${ticketId}` );
      const lista = Array.isArray(data) ? data : Array.isArray(data?.comentarios) ? data.comentarios : [];
      setComentarios(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const nuevos = lista.filter(c => !existingIds.has(c.id));
        return [...prev, ...nuevos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    } catch (err) { console.error("Error cargando comentarios", err); }
  }, [ticketId]);

  const enviarComentario = async () => {
    if (!comentario.trim() && !archivo) return;
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("ticketId", ticketId);
      formData.append("autorTipo", "SOLICITANTE");
      formData.append("comentario", comentario);
      if (archivo) formData.append("archivo", archivo);

      const { data: nuevoComentario } = await api.post("/ticket-comentarios", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setComentario("");
      setArchivo(null);
      const inputFile = document.getElementById("inputArchivoSolicitante");
      if (inputFile) inputFile.value = "";

      setComentarios(prev =>
        [...prev, nuevoComentario].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      );
    } catch (err) {
      setError(err.response?.data?.error || "Error al enviar comentario.");
    } finally { setEnviando(false); }
  };

  useEffect(() => {
    cargar();
    cargarComentarios();
    const interval = setInterval(cargarComentarios, 5000);
    return () => clearInterval(interval);
  }, [cargar, cargarComentarios]);

  const anular = async () => {
    setAnulando(true);
    try {
      await api.patch(`/tickets/${ticketId}/anular`, { anulatedBySolicitante: true });
      onAnulado();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error al anular el ticket.");
      setConfirmar(false);
    } finally { setAnulando(false); }
  };

  const reabrir = async () => {
  try {
    await api.patch(`/tickets/${ticketId}/reabrir`);

    await cargar();

    alert("Ticket reabierto correctamente");
  } catch (err) {
    setError(
      err.response?.data?.error ||
      "Error al reabrir el ticket"
    );
  }
};

  const limpiarArchivo = () => {
    setArchivo(null);
    const inputFile = document.getElementById("inputArchivoSolicitante");
    if (inputFile) inputFile.value = "";
  };

  const puedeAnular = ticket?.estadoTicket?.nombre?.toUpperCase() === "ABIERTO" && !ticket?.anulado;
  const esCerrado = ticket?.estadoTicket?.nombre?.toUpperCase() === "CERRADO";

  return (
    <Modal title={ticket ? `Ticket — ${ticket.noSolicitud}` : "Cargando..."} onClose={onClose} maxWidth={680}>
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
            {estadoBadge(ticket.estadoTicket?.nombre, ticket.estadoTicket?.nombreVerboso)}
            {ticket.anulado && <span className="badge bg-danger">Anulado</span>}
          </div>

          <div className="rounded-3 p-3 mb-4" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
            <div className="row g-2">
              {[
                ["Tipo", ticket.tipoTicket?.nombre || ticket.tipoPersonalizado],
                ["Departamento", ticket.departamento?.nombre],
                ["Subdepartamento", ticket.subDepartamento?.nombre || "—"],
                ["Edificio", ticket.edificio?.nombre],
                ["Nivel", ticket.nivel?.nombre],
                ["Oficina", ticket.oficina],
                ["Extensión", ticket.extension],
                ["Técnico", ticket.tecnico?.nombre || "Sin asignar"],
                ["Fecha creación", formatFechaHora(ticket.fechaSolicitud)],
              ].map(([k, v]) => (
                <div className="col-6" key={k}>
                  <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600, marginBottom: 8 }}>DESCRIPCIÓN</div>
            <div className="rounded-3 p-3" style={{ background: "#fafafa", border: "1px solid #f0f0f0", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {ticket.descripcion}
            </div>
          </div>

          {/* ══ COMENTARIOS - SIN SCROLLBAR INTERNO ══ */}
          <div className="mb-4">
            <div style={{ fontSize: "0.8rem", color: "#6c757d", fontWeight: 600, marginBottom: 12 }}>
              COMENTARIOS ({comentarios.length})
            </div>

            {/* ELIMINÉ maxHeight y overflowY para que no tenga scroll interno */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {comentarios.length === 0 ? (
                <div className="text-center text-muted py-5" style={{ fontSize: "0.9rem" }}>
                  <FaCommentAlt style={{ fontSize: "1.8rem", opacity: 0.3, marginBottom: 8 }} /><br />
                  Aún no hay comentarios en este ticket.
                </div>
              ) : (
                comentarios.map(c => {
                  const esSolicitante = c.autorTipo === "SOLICITANTE";
                  const autorNombre = c.autor?.nombre || (esSolicitante ? "Tú" : "Técnico");
                  const urlArchivo = resolverUrlArchivo(c.archivoUrl);

                  return (
                    <div key={c.id} style={{ alignSelf: esSolicitante ? "flex-start" : "flex-end", maxWidth: "82%", marginBottom: 4 }}>

                      {/* Cabecera */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, justifyContent: esSolicitante ? "flex-start" : "flex-end" }}>
                        {esSolicitante ? (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e6f4ff", color: "#096dd9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaUser />
                          </div>
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f6ffed", color: "#389e0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaUserTie />
                          </div>
                        )}
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: esSolicitante ? "#0958d3" : "#2f9e44" }}>
                          {autorNombre}
                        </div>
                        <small style={{ color: "#adb5bd", fontSize: "0.74rem", marginLeft: "auto" }}>
                          {new Date(c.createdAt).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                        </small>
                      </div>

                      {/* Burbuja */}
                      <div style={{
                        padding: "10px 14px", borderRadius: 12,
                        background: esSolicitante ? "#e6f4ff" : "#f6ffed",
                        border: `1px solid ${esSolicitante ? "#91caff" : "#c3f0ca"}`,
                        borderTopLeftRadius: esSolicitante ? 4 : 12,
                        borderTopRightRadius: esSolicitante ? 12 : 4,
                        fontSize: "0.9rem", lineHeight: 1.45,
                      }}>
                        {/* Texto */}
                        {c.comentario && <div>{c.comentario}</div>}

                        {/* Archivo adjunto */}
                        {urlArchivo && (
                          <div style={{ marginTop: c.comentario ? 8 : 0 }}>
                            {esImagen(urlArchivo) ? (
                              <img
                                src={urlArchivo}
                                alt="adjunto"
                                onClick={() => window.open(urlArchivo, "_blank")}
                                onError={e => { e.target.style.display = "none"; }}
                                style={{
                                  maxWidth: "100%", maxHeight: 220,
                                  borderRadius: 8, cursor: "pointer",
                                  display: "block", objectFit: "contain",
                                }}
                              />
                            ) : (
                              <a
                                href={urlArchivo}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "0.82rem", color: "#096dd9", display: "flex", alignItems: "center", gap: 4 }}
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

            {/* Input comentario + adjunto */}
            {!ticket.anulado && !esCerrado && (
              <div className="mt-3">
                {/* Preview archivo seleccionado */}
                {archivo && (
                  <div className="d-flex align-items-center gap-2 mb-2 p-2 rounded-3"
                    style={{ background: "#f0f7ff", border: "1px solid #91caff", fontSize: "0.82rem" }}>
                    <span>📎 {archivo.name}</span>
                    <button onClick={limpiarArchivo}
                      style={{ background: "none", border: "none", color: "#ff4d4f", cursor: "pointer", marginLeft: "auto" }}>
                      <FaTimes />
                    </button>
                  </div>
                )}

                <div className="d-flex gap-2">
                  {/* Botón adjuntar */}
                  <label htmlFor="inputArchivoSolicitante" title="Adjuntar imagen o PDF"
                    style={{
                      cursor: "pointer", padding: "8px 12px", borderRadius: 12,
                      background: archivo ? "#e6f4ff" : "#f0f0f0",
                      border: `1px solid ${archivo ? "#91caff" : "#d9e3ee"}`,
                      display: "flex", alignItems: "center",
                      color: archivo ? "#096dd9" : "#5f7d9c", flexShrink: 0,
                    }}>
                    📎
                    <input
                      id="inputArchivoSolicitante"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,.pdf"
                      style={{ display: "none" }}
                      onChange={e => setArchivo(e.target.files[0] || null)}
                    />
                  </label>

                  <input
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarComentario(); } }}
                    placeholder="Escribe tu comentario aquí..."
                    className="form-control modern-input"
                    style={{ fontSize: "0.9rem", borderRadius: 12 }}
                    disabled={enviando}
                  />

                  <button
                    onClick={enviarComentario}
                    disabled={enviando || (!comentario.trim() && !archivo)}
                    className="btn btn-save px-3 d-flex align-items-center"
                    style={{ borderRadius: 12 }}>
                    {enviando ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {puedeAnular && (
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
              {!confirmar ? (
                <button onClick={() => setConfirmar(true)}
                  className="btn btn-outline-danger btn-cancel"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaBan /> Anular ticket
                </button>
              ) : (
                <div className="alert alert-danger py-2 px-3 mb-0">
                  <div className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>¿Confirmas que deseas anular este ticket?</div>
                  <div className="d-flex gap-2">
                    <button onClick={anular} disabled={anulando} className="btn btn-danger btn-sm fw-bold">
                      {anulando ? <><Spinner animation="border" size="sm" className="me-1" />Anulando...</> : "Sí, anular"}
                    </button>
                    <button onClick={() => setConfirmar(false)} className="btn btn-outline-secondary btn-sm">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {esCerrado && !ticket?.anulado && (
  <div
    style={{
      borderTop: "1px solid #f0f0f0",
      paddingTop: 12,
      marginTop: 12,
    }}
  >
    <button
      onClick={reabrir}
      className="btn btn-outline-success"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      🔓 Reabrir ticket
    </button>
  </div>
)}
        </>
      )}
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
const SolicitanteDashboard = () => {
  useServerWatch(15);
  const [ticketsList, setTicketsList] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [ticketDetalle, setTicketDetalle] = useState(null);

  const userId = useMemo(() => localStorage.getItem("id_usuario"), []);

  const cargarTickets = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 6, solicitanteId: userId };
      if (filtroEstado) params.estadoId = filtroEstado;
      if (filtroFechaDesde) params.fechaDesde = filtroFechaDesde;
      if (filtroFechaHasta) params.fechaHasta = filtroFechaHasta;
      const { data } = await api.get("/tickets", { params });
      setTicketsList(data.tickets);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (error) {
      console.error("error tickets:", { message: error.message, response: error.response?.data, status: error.response?.status });
    } finally { setLoading(false); }
  }, [filtroEstado, filtroFechaDesde, filtroFechaHasta, userId]);

  useEffect(() => {
    api.get("/estado-ticket").then(r => setEstados(r.data)).catch(() => { });
    api.get("/tipo-ticket").then(r => setTipos(r.data)).catch(() => { });
    api.get("/departamentos-solicitantes").then(r => setDepartamentos(r.data)).catch(() => { });
    api.get("/edificios").then(r => setEdificios(r.data)).catch(() => { });
    cargarTickets(1);
  }, [cargarTickets]);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
      <Header logoPath={null} />
      <main className="flex-grow-1 px-3 py-4">
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-0">
                <FaTicketAlt className="me-2" style={{ color: "var(--primaryColor)" }} />
                Mis Tickets
              </h4>
              <p className="text-muted small mb-0">{total} ticket{total !== 1 ? "s" : ""} registrados</p>
            </div>
            <button onClick={() => setMostrarCrear(true)} className="btn btn-save fw-semibold d-flex align-items-center gap-2">
              <FaPlus /> Nuevo Ticket
            </button>
          </div>

          {/* Filtros */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
            <div className="d-flex flex-wrap gap-3 align-items-end">
              <div>
                <label className="form-label small fw-semibold mb-1">Estado</label>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                  className="form-select form-select-sm modern-input" style={{ minWidth: 160 }}>
                  <option value="">Todos</option>
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombreVerboso}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label small fw-semibold mb-1">Desde</label>
                <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)}
                  className="form-control form-control-sm modern-input" />
              </div>
              <div>
                <label className="form-label small fw-semibold mb-1">Hasta</label>
                <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)}
                  className="form-control form-control-sm modern-input" />
              </div>
              <div className="d-flex gap-2">
                <button onClick={() => cargarTickets(1)} className="btn btn-save btn-sm d-flex align-items-center gap-1">
                  <FaFilter /> Filtrar
                </button>
                <button onClick={() => { setFiltroEstado(""); setFiltroFechaDesde(""); setFiltroFechaHasta(""); setTimeout(() => cargarTickets(1), 0); }}
                  className="btn btn-outline-secondary btn-sm btn-cancel">
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" className="me-2" />Cargando tickets...
              </div>
            ) : ticketsList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaTicketAlt style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.3 }} />
                <div className="fw-semibold">No tienes tickets</div>
                <div className="small">Crea tu primer ticket con el botón "Nuevo Ticket"</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: "0.90rem" }}>
                  <thead style={{ background: "#fafafa" }}>
                    <tr>
                      {["No. Solicitud", "Tipo", "Departamento", "Edificio", "Nivel", "Estado", "Fecha creación", "Técnico", ""].map(h => (
                        <th key={h} className="py-3 px-3 fw-bold text-secondary border-0" style={{ whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsList.map(t => (
                      <tr key={t.id} style={{ opacity: t.anulado ? 0.55 : 1 }}>
                        <td className="px-3 py-3 fw-bold" style={{ color: "var(--primaryColor)" }}>
                          {t.noSolicitud}
                          {t.anulado && <span className="badge bg-danger ms-2" style={{ fontSize: "0.65rem" }}>ANULADO</span>}
                        </td>
                        <td className="px-3 py-3">{t.tipoTicket?.nombre || t.tipoPersonalizado || "—"}</td>                        <td className="px-3 py-3">{t.departamento?.abreviatura || t.departamento?.nombre || "—"}</td>
                        <td className="px-3 py-3">{t.edificio?.nombre || "—"}</td>
                        <td className="px-3 py-3">{t.nivel?.nombre || "—"}</td>
                        <td className="px-3 py-3">{estadoBadge(t.estadoTicket?.nombre, t.estadoTicket?.nombreVerboso)}</td>
                        <td className="px-3 py-3" style={{ whiteSpace: "nowrap" }}>{formatFechaHora(t.fechaSolicitud)}</td>
                        <td className="px-3 py-3">{t.tecnico?.nombre || <span className="text-muted">Sin asignar</span>}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => setTicketDetalle(t.id)}
                            className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                            style={{ background: "rgba(95,125,156,0.1)", color: "var(--primaryColor)", border: "none", borderRadius: 8 }}>
                            <FaCommentAlt style={{ fontSize: "0.7rem" }} /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center px-4 py-3" style={{ borderTop: "1px solid #f0f0f0" }}>
                <nav>
                  <ul className="pagination mb-0">
                    {[...Array(totalPages)].map((_, index) => {
                      const p = index + 1;
                      const active = page === p;
                      return (
                        <li key={p} className={`page-item ${active ? "active" : ""}`}>
                          <button onClick={() => cargarTickets(p)} className="page-link"
                            style={{
                              background: active ? "var(--primaryColor, #5f7d9c)" : "#fff",
                              color: active ? "#fff" : "var(--primaryColor, #5f7d9c)",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}>
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

      {mostrarCrear && (
        <Modal title="Crear Nuevo Ticket" onClose={() => setMostrarCrear(false)}>
          <FormCrearTicket
            tipos={tipos} departamentos={departamentos} edificios={edificios}
            onClose={() => setMostrarCrear(false)}
            onSuccess={() => { setMostrarCrear(false); cargarTickets(1); }}
          />
        </Modal>
      )}

      {ticketDetalle && (
        <DetalleTicket
          ticketId={ticketDetalle}
          onClose={() => setTicketDetalle(null)}
          onAnulado={() => cargarTickets(page)}
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
        /* Ocultar scrollbar en el modal */
        .modal-body-content::-webkit-scrollbar {
          width: 6px;
        }
        .modal-body-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .modal-body-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .modal-body-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default SolicitanteDashboard;