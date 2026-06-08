// Componentes/Encuesta/ResultadosEncuesta.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner } from "react-bootstrap";
import {
  FaStar, FaChartBar, FaTicketAlt, FaUserTie, FaCommentAlt, FaTrophy,
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import Header from "../Header";
import Footer from "../Footer";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const api = axios.create({ baseURL: `${API_BASE}/api`, withCredentials: true });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const LABELS      = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
const COLORES     = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const COLORES_BAR = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function Estrellas({ n, size = "0.9rem" }) {
  return (
    <span>
      {[1,2,3,4,5].map((i) => (
        <FaStar key={i} style={{ color: i <= n ? "#f59e0b" : "#e5e7eb", fontSize: size, marginRight: 1 }} />
      ))}
    </span>
  );
}

function KpiCard({ label, valor, sub, color = "var(--brandBlue, #5f7d9c)" }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
      <div style={{ fontSize: "0.75rem", color: "#8c8c8c", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{valor ?? "—"}</div>
      {sub && <div style={{ fontSize: "0.78rem", color: "#adb5bd", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { calificacion, cantidad } = payload[0].payload;
  return (
    <div className="card border-0 shadow-sm p-2" style={{ fontSize: "0.82rem" }}>
      <div className="fw-bold">{LABELS[calificacion]}</div>
      <div>{cantidad} respuesta{cantidad !== 1 ? "s" : ""}</div>
    </div>
  );
}

/* ══ RESUMEN MENSUAL ══ */
function ResumenMensual() {
  const ahora = new Date();
  const [mes,     setMes]     = useState(ahora.getMonth() + 1);
  const [anio,    setAnio]    = useState(ahora.getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get(`/encuesta/resumen-mensual?mes=${mes}&anio=${anio}`);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => { cargar(); }, [cargar]);

  const anios = [];
  for (let y = ahora.getFullYear(); y >= ahora.getFullYear() - 2; y--) anios.push(y);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <FaTrophy style={{ color: "#f59e0b", fontSize: "1.2rem" }} />
          <span className="fw-bold" style={{ fontSize: "0.95rem" }}>Resumen Mensual — Mejor Técnico</span>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm modern-input" value={mes}
            onChange={e => setMes(Number(e.target.value))} style={{ minWidth: 130 }}>
            {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select form-select-sm modern-input" value={anio}
            onChange={e => setAnio(Number(e.target.value))} style={{ minWidth: 90 }}>
            {anios.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="text-center py-4 text-muted"><Spinner animation="border" size="sm" className="me-2" />Cargando resumen...</div>}
      {error && <div className="alert alert-danger small py-2">{error}</div>}

      {!loading && !error && data && (
        <>
          {data.totalEncuestas === 0 ? (
            <div className="text-center text-muted py-4">
              <FaTrophy style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 8 }} />
              <div className="fw-semibold">Sin encuestas en {MESES[mes-1]} {anio}</div>
              <div className="small">No hay datos para este período</div>
            </div>
          ) : (
            <>
              {data.mejorTecnico && (
                <div className="rounded-4 p-4 mb-4 text-center"
                  style={{ background: "linear-gradient(135deg, #fef9c3, #fef3c7)", border: "2px solid #f59e0b" }}>
                  <div style={{ fontSize: "2.5rem" }}>🏆</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#92400e", letterSpacing: "0.08em" }}>
                    MEJOR TÉCNICO — {MESES[mes-1].toUpperCase()} {anio}
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#78350f", margin: "6px 0" }}>
                    {data.mejorTecnico.tecnico.nombre}
                  </div>
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                    <Estrellas n={Math.round(data.mejorTecnico.promedio)} size="1.1rem" />
                    <span style={{ fontWeight: 800, color: "#92400e", fontSize: "1rem" }}>
                      {data.mejorTecnico.promedio} / 5
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#92400e" }}>
                    {data.mejorTecnico.totalTickets} ticket{data.mejorTecnico.totalTickets !== 1 ? "s" : ""} evaluados
                  </div>
                  {data.mejorTecnico.comentarios.length > 0 && (
                    <div className="mt-3 text-start">
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", marginBottom: 6 }}>COMENTARIOS RECIBIDOS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {data.mejorTecnico.comentarios.slice(0, 3).map((c, i) => (
                          <div key={i} className="rounded-3 px-3 py-2"
                            style={{ background: "rgba(255,255,255,0.6)", fontSize: "0.82rem", color: "#78350f" }}>
                            <FaCommentAlt style={{ marginRight: 6, opacity: 0.6 }} />"{c}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>
                RANKING DEL MES ({data.tecnicos.length} técnico{data.tecnicos.length !== 1 ? "s" : ""})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.tecnicos.map((t, idx) => (
                  <div key={t.tecnico.id} className="rounded-3 px-3 py-2 d-flex align-items-center gap-3"
                    style={{
                      background: idx === 0 ? "rgba(245,158,11,0.08)" : "#f9fafb",
                      border: idx === 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid #f0f0f0",
                    }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: idx === 0 ? "#f59e0b" : idx === 1 ? "#9ca3af" : idx === 2 ? "#cd7c2f" : "#e5e7eb",
                      color: "white", fontWeight: 900, fontSize: "0.85rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{idx + 1}</div>
                    <div className="flex-grow-1">
                      <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{t.tecnico.nombre}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{t.totalTickets} ticket{t.totalTickets !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-end">
                      <Estrellas n={Math.round(t.promedio)} size="0.8rem" />
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: COLORES[Math.round(t.promedio)] }}>
                        {t.promedio} / 5
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ══ */
const ResultadosEncuesta = () => {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState(""); // ← NUEVO

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get("/encuesta/resultados");
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar los resultados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Lista de técnicos únicos para el selector
  const tecnicosUnicos = data?.resultados
    ? [...new Map(
        data.resultados
          .filter(r => r.ticket?.tecnico?.id)
          .map(r => [r.ticket.tecnico.id, r.ticket.tecnico])
      ).values()]
    : [];

  // Resultados filtrados por técnico Y búsqueda
  const resultadosFiltrados = (data?.resultados || []).filter((r) => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      r.ticket?.noSolicitud?.toLowerCase().includes(q) ||
      r.ticket?.solicitante?.nombre?.toLowerCase().includes(q) ||
      r.ticket?.tecnico?.nombre?.toLowerCase().includes(q);

    const coincideTecnico = filtroTecnico
      ? String(r.ticket?.tecnico?.id) === filtroTecnico
      : true;

    return coincideBusqueda && coincideTecnico;
  });

  // KPIs calculados sobre los resultados filtrados
  const totalFiltrado    = resultadosFiltrados.length;
  const promedioFiltrado = totalFiltrado > 0
    ? Number((resultadosFiltrados.reduce((s, r) => s + r.calificacion, 0) / totalFiltrado).toFixed(2))
    : null;
  const mejorFiltrado = totalFiltrado > 0 ? Math.max(...resultadosFiltrados.map(r => r.calificacion)) : null;
  const peorFiltrado  = totalFiltrado > 0 ? Math.min(...resultadosFiltrados.map(r => r.calificacion)) : null;
  const distribucionFiltrada = [1,2,3,4,5].map(n => ({
    calificacion: n,
    cantidad: resultadosFiltrados.filter(r => r.calificacion === n).length,
  }));

  const tecnicoSeleccionado = filtroTecnico
    ? tecnicosUnicos.find(t => String(t.id) === filtroTecnico)
    : null;

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#eef2f6" }}>
      <Header logoPath={null} />
      <main className="flex-grow-1 px-3 py-4">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-0">
                <FaChartBar className="me-2" style={{ color: "var(--brandBlue, #5f7d9c)" }} />
                Resultados de Encuestas
              </h4>
              <p className="text-muted small mb-0">Satisfacción de los solicitantes con el servicio técnico</p>
            </div>
          </div>

          <ResumenMensual />

          {loading && <div className="text-center py-5 text-muted"><Spinner animation="border" size="sm" className="me-2" />Cargando resultados...</div>}
          {error && <div className="alert alert-danger small py-2">{error}</div>}

          {!loading && !error && data && (
            <>
              {/* ── Selector de técnico ── */}
              <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <FaUserTie style={{ color: "var(--brandBlue, #5f7d9c)" }} />
                    <span className="fw-bold small">Filtrar por técnico:</span>
                  </div>
                  <select
                    className="form-select form-select-sm modern-input"
                    value={filtroTecnico}
                    onChange={e => { setFiltroTecnico(e.target.value); setBusqueda(""); }}
                    style={{ maxWidth: 260 }}
                  >
                    <option value="">Todos los técnicos</option>
                    {tecnicosUnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  {filtroTecnico && (
                    <button
                      onClick={() => setFiltroTecnico("")}
                      className="btn btn-sm btn-outline-secondary"
                      style={{ borderRadius: 8 }}
                    >
                      ✕ Quitar filtro
                    </button>
                  )}
                  {tecnicoSeleccionado && (
                    <span className="ms-auto text-muted small">
                      Mostrando estadísticas de <strong>{tecnicoSeleccionado.nombre}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* KPIs — calculados sobre filtro */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <KpiCard
                    label={filtroTecnico ? "ENCUESTAS DEL TÉCNICO" : "TOTAL ENCUESTAS"}
                    valor={totalFiltrado}
                    sub="respuestas registradas"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard
                    label="PROMEDIO"
                    valor={promedioFiltrado ? `${promedioFiltrado} / 5` : "—"}
                    sub={promedioFiltrado ? LABELS[Math.round(promedioFiltrado)] : "Sin datos"}
                    color={promedioFiltrado ? COLORES[Math.round(promedioFiltrado)] : "#adb5bd"}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard
                    label="MEJOR CALIFICACIÓN"
                    valor={mejorFiltrado ? `${mejorFiltrado} ★` : "—"}
                    sub="máximo registrado" color="#22c55e"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard
                    label="PEOR CALIFICACIÓN"
                    valor={peorFiltrado ? `${peorFiltrado} ★` : "—"}
                    sub="mínimo registrado" color="#ef4444"
                  />
                </div>
              </div>

              {/* Gráfica — calculada sobre filtro */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <div className="fw-bold mb-3" style={{ fontSize: "0.95rem" }}>
                  Distribución de calificaciones
                  {tecnicoSeleccionado && <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.85rem" }}>— {tecnicoSeleccionado.nombre}</span>}
                </div>
                {totalFiltrado === 0 ? (
                  <div className="text-center text-muted py-4">Sin datos para mostrar.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={distribucionFiltrada} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="calificacion" tickFormatter={(v) => LABELS[v]}
                        tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="cantidad" radius={[6,6,0,0]}>
                        {distribucionFiltrada.map((_, i) => <Cell key={i} fill={COLORES_BAR[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Tabla */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="px-4 py-3 d-flex justify-content-between align-items-center"
                  style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <span className="fw-bold">
                    Detalle de respuestas
                    {totalFiltrado !== data.total && (
                      <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.82rem" }}>
                        ({totalFiltrado} de {data.total})
                      </span>
                    )}
                  </span>
                  <input type="text" className="form-control form-control-sm modern-input"
                    placeholder="Buscar por ticket, solicitante o técnico..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    style={{ maxWidth: 280 }} />
                </div>

                {resultadosFiltrados.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaTicketAlt style={{ fontSize: "2rem", opacity: 0.3, marginBottom: 8 }} />
                    <div className="fw-semibold">Sin resultados</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0" style={{ fontSize: "0.88rem" }}>
                      <thead style={{ background: "#fafafa" }}>
                        <tr>
                          {["No. Solicitud","Solicitante","Técnico","Departamento","Calificación","Comentario","Fecha"].map(h => (
                            <th key={h} className="py-3 px-3 fw-bold text-secondary border-0" style={{ whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosFiltrados.map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-3 fw-bold" style={{ color: "var(--brandBlue, #5f7d9c)" }}>
                              {r.ticket?.noSolicitud || "—"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <FaTicketAlt style={{ color: "#adb5bd", fontSize: "0.8rem" }} />
                                {r.ticket?.solicitante?.nombre || "—"}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <FaUserTie style={{ color: "#adb5bd", fontSize: "0.8rem" }} />
                                {r.ticket?.tecnico?.nombre || <span className="text-muted">Sin asignar</span>}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {r.ticket?.departamento?.abreviatura || r.ticket?.departamento?.nombre || "—"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <Estrellas n={r.calificacion} />
                                <span style={{ fontSize: "0.78rem", color: COLORES[r.calificacion], fontWeight: 700 }}>
                                  {LABELS[r.calificacion]}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3" style={{ maxWidth: 220 }}>
                              {r.comentario ? (
                                <div className="d-flex align-items-start gap-1">
                                  <FaCommentAlt style={{ color: "#adb5bd", fontSize: "0.75rem", marginTop: 2, flexShrink: 0 }} />
                                  <span style={{ fontSize: "0.82rem", color: "#495057" }}>{r.comentario}</span>
                                </div>
                              ) : (
                                <span className="text-muted" style={{ fontSize: "0.82rem" }}>Sin comentario</span>
                              )}
                            </td>
                            <td className="px-3 py-3" style={{ whiteSpace: "nowrap", color: "#6b7280" }}>
                              {r.respondidoAt
                                ? new Date(r.respondidoAt).toLocaleDateString("es-GT", { dateStyle: "medium" })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        :root { --brandBlue: #5f7d9c; --brandBlueDark: #4f6b88; }
        .modern-input { border-radius: 10px !important; border: 1px solid #d9e3ee !important; }
        .modern-input:focus { border-color: rgba(95,125,156,.45) !important; box-shadow: 0 0 0 .2rem rgba(95,125,156,.18) !important; }
        .table-hover tbody tr:hover { background: rgba(95,125,156,0.05) !important; }
      `}</style>
    </div>
  );
};

export default ResultadosEncuesta;