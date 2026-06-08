// Componentes/ShowTickets.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Spinner, Modal, Form } from "react-bootstrap";
import { FaEye, FaEdit, FaTicketAlt, FaFilter, FaTimes, FaUserCog, FaCommentAlt } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Header from "../Header";
import Footer from "../Footer";
import useRol from "../../Hooks/useerol";

const API = "http://10.21.25.54:3001/api";

const PRIORIDAD_COLORS = {
  ALTA:        { bg: "rgba(176,42,55,0.12)",   color: "#842029", border: "rgba(176,42,55,0.3)"   },
  MEDIA:       { bg: "rgba(245,158,11,0.12)",  color: "#92400e", border: "rgba(245,158,11,0.3)"  },
  BAJA:        { bg: "rgba(25,135,84,0.12)",   color: "#0f5132", border: "rgba(25,135,84,0.3)"   },
  SIN_ASIGNAR: { bg: "rgba(108,117,125,0.12)", color: "#495057", border: "rgba(108,117,125,0.3)" },
};

const axiosCfg = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const CompShowTickets = () => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const { esAdmin, esSupervisor } = useRol();
  const puedeAsignar = esAdmin || esSupervisor;
  const puedeEditar  = esAdmin;

  const [tickets,         setTickets]         = useState([]);
  const [filtered,        setFiltered]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // Filtros
  const [busqueda,        setBusqueda]        = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("TODOS");
  const [filtroEstado,    setFiltroEstado]    = useState("TODOS");
  const [filtroDept,      setFiltroDept]      = useState("TODOS");
  const [estados,         setEstados]         = useState([]);
  const [departamentos,   setDepartamentos]   = useState([]);

  // Paginación
  const [pagina,          setPagina]          = useState(1);
  const POR_PAGINA = 10;

  // Ordenamiento
  const [sortField,       setSortField]       = useState("fechaSolicitud");
  const [sortOrder,       setSortOrder]       = useState("desc");

  // Modal detalle
  const [ticketVer,       setTicketVer]       = useState(null);
  const [tabDetalle,      setTabDetalle]      = useState("info");

  // Conversación
  const [comentariosAdmin,        setComentariosAdmin]        = useState([]);
  const [loadingComentariosAdmin, setLoadingComentariosAdmin] = useState(false);

  // Modal asignar técnico
  const [showAsignarModal,    setShowAsignarModal]    = useState(false);
  const [ticketToAsignar,     setTicketToAsignar]     = useState(null);
  const [tecnicos,            setTecnicos]            = useState([]);
  const [loadingTecnicos,     setLoadingTecnicos]     = useState(false);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [savingAsignacion,    setSavingAsignacion]    = useState(false);
  const [asignarError,        setAsignarError]        = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const cerrarModalDetalle = () => {
    setTicketVer(null);
    setTabDetalle("info");
    setComentariosAdmin([]);
  };

  // Carga principal
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resTickets, resEstados, resDepts] = await Promise.all([
        axios.get(`${API}/tickets`,                    axiosCfg()),
        axios.get(`${API}/tickets/estados`,            axiosCfg()),
        axios.get(`${API}/departamentos-solicitantes`, axiosCfg()),
      ]);
      const data = Array.isArray(resTickets.data)
        ? resTickets.data
        : resTickets.data?.tickets || [];
      setTickets(data);
      setFiltered(data);
      setEstados(Array.isArray(resEstados.data) ? resEstados.data : []);
      const depts = Array.isArray(resDepts.data) ? resDepts.data : [];
      setDepartamentos(depts.filter((d) => d.activo));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Carga comentarios del ticket
const cargarComentariosAdmin = useCallback(async (ticketId) => {
  setLoadingComentariosAdmin(true);
  try {
    const res = await axios.get(`${API}/ticket-comentarios`, { ...axiosCfg(), params: { ticketId } }); // ← CAMBIO
    console.log("respuesta comentarios:", res.data);
    const lista = Array.isArray(res.data) ? res.data : res.data?.comentarios || [];
    console.log("lista procesada:", lista);
    setComentariosAdmin(lista.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  } catch (err) {
    console.error("error comentarios:", err);
    setComentariosAdmin([]);
  } finally {
    setLoadingComentariosAdmin(false);
  }
}, []);

  // Carga técnicos
  const fetchTecnicos = useCallback(async () => {
    try {
      setLoadingTecnicos(true);
      const res  = await axios.get(`${API}/usuarios/tecnicos`, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      setTecnicos(data.filter((u) => Boolean(u.activo)));
    } catch {
      setTecnicos([]);
    } finally {
      setLoadingTecnicos(false);
    }
  }, []);

  // Filtros
  useEffect(() => {
    let data = [...tickets];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      data = data.filter(
        (t) =>
          (t.noSolicitud || "").toLowerCase().includes(q) ||
          (t.solicitante?.nombre || "").toLowerCase().includes(q) ||
          (t.descripcion || "").toLowerCase().includes(q),
      );
    }
    if (filtroPrioridad !== "TODOS") data = data.filter((t) => t.prioridad === filtroPrioridad);
    if (filtroEstado    !== "TODOS") data = data.filter((t) => t.estadoTicket?.id === parseInt(filtroEstado));
    if (filtroDept      !== "TODOS") data = data.filter((t) => String(t.departamentoId) === filtroDept);

    data.sort((a, b) => {
      let A = a[sortField], B = b[sortField];
      if (sortField === "fechaSolicitud") { A = new Date(A); B = new Date(B); }
      else { A = String(A || "").toLowerCase(); B = String(B || "").toLowerCase(); }
      if (A < B) return sortOrder === "asc" ? -1 : 1;
      if (A > B) return sortOrder === "asc" ?  1 : -1;
      return 0;
    });

    setFiltered(data);
    setPagina(1);
  }, [busqueda, filtroPrioridad, filtroEstado, filtroDept, tickets, sortField, sortOrder]);

  const sort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };
  const arrow = (field) => (sortField === field ? (sortOrder === "asc" ? " ↑" : " ↓") : "");

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroPrioridad("TODOS");
    setFiltroEstado("TODOS"); setFiltroDept("TODOS");
  };
  const hayFiltros =
    busqueda || filtroPrioridad !== "TODOS" || filtroEstado !== "TODOS" || filtroDept !== "TODOS";

  const totalPaginas = Math.ceil(filtered.length / POR_PAGINA);
  const paginados    = filtered.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Listado de Tickets", 20, 20);
    autoTable(doc, {
      head: [["No. Solicitud", "Solicitante", "Departamento", "Prioridad", "Estado", "Técnico", "Fecha"]],
      body: filtered.map((t) => [
        t.noSolicitud,
        t.solicitante?.nombre ?? "—",
        t.departamentoSolicitante?.nombre ?? "—",
        t.prioridad,
        t.estadoTicket?.nombreVerboso ?? "—",
        t.tecnico?.nombre ?? "Sin asignar",
        t.fechaSolicitud ? new Date(t.fechaSolicitud).toLocaleDateString("es-GT") : "—",
      ]),
      startY: 30, theme: "striped", styles: { fontSize: 9 },
    });
    doc.save("tickets.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((t) => ({
        "No. Solicitud": t.noSolicitud,
        Solicitante:     t.solicitante?.nombre ?? "",
        Departamento:    t.departamentoSolicitante?.nombre ?? "",
        Prioridad:       t.prioridad,
        Estado:          t.estadoTicket?.nombreVerboso ?? "",
        Técnico:         t.tecnico?.nombre ?? "Sin asignar",
        Fecha:           t.fechaSolicitud ? new Date(t.fechaSolicitud).toLocaleDateString("es-GT") : "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, "tickets.xlsx");
  };

  const openAsignarModal = async (ticket) => {
    setTicketToAsignar(ticket);
    setTecnicoSeleccionado(ticket.tecnico?.id ? String(ticket.tecnico.id) : "");
    setAsignarError("");
    setShowAsignarModal(true);
    await fetchTecnicos();
  };

  const closeAsignarModal = () => {
    setShowAsignarModal(false);
    setTicketToAsignar(null);
    setTecnicoSeleccionado("");
    setAsignarError("");
  };

  const handleAsignarTecnico = async () => {
    if (!tecnicoSeleccionado) { setAsignarError("Debes seleccionar un técnico."); return; }
    try {
      setSavingAsignacion(true);
      setAsignarError("");
      await axios.patch(
        `${API}/tickets/${ticketToAsignar.id}/asignar`,
        { tecnicoId: Number(tecnicoSeleccionado) },
        axiosCfg(),
      );
      await fetchTickets();
      closeAsignarModal();
    } catch {
      setAsignarError("No se pudo asignar el técnico. Intenta de nuevo.");
    } finally {
      setSavingAsignacion(false);
    }
  };

  const handleReabrir = async (ticketId) => {
  try {
    await axios.patch(`${API}/tickets/${ticketId}/reabrir`, {}, axiosCfg());
    await fetchTickets();
  } catch {
    alert("No se pudo reabrir el ticket.");
  }
};

  const renderBody = () => {
    if (loading) return (
      <tr><td colSpan="8" className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />Cargando tickets...
      </td></tr>
    );
    if (error?.response?.status === 403) return (
      <tr><td colSpan="8" className="text-center text-danger py-4">No tienes permisos para ver esta sección.</td></tr>
    );
    if (!paginados.length) return (
      <tr><td colSpan="8" className="text-center text-muted py-5">
        <FaTicketAlt size={28} className="d-block mx-auto mb-2" />
        {hayFiltros ? "No hay tickets con esos filtros." : "No hay tickets registrados."}
      </td></tr>
    );

    return paginados.map((t) => {
      const pc      = PRIORIDAD_COLORS[t.prioridad] || PRIORIDAD_COLORS.SIN_ASIGNAR;
      const anulado = Boolean(t.anulado);
      return (
        <tr key={t.id} style={{ opacity: anulado ? 0.55 : 1 }}>
          <td>
            <span className="fw-bold" style={{ color: "var(--primaryColor)" }}>{t.noSolicitud}</span>
            {anulado && <span className="badge bg-danger ms-2" style={{ fontSize: ".65rem" }}>ANULADO</span>}
          </td>
          <td>{t.solicitante?.nombre ?? "—"}</td>
          <td>
            <span title={t.departamentoSolicitante?.nombre}>
              {t.departamentoSolicitante?.abreviatura ?? t.departamentoSolicitante?.nombre ?? "—"}
            </span>
          </td>
          <td>
            <span className="ticket-badge" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
              {t.prioridad?.replace("_", " ")}
            </span>
          </td>
          <td>
            <span className="ticket-badge estado-badge-ticket">
              {t.estadoTicket?.nombreVerboso ?? "—"}
            </span>
          </td>
          <td>{t.tecnico?.nombre ?? <span className="text-muted fst-italic small">Sin asignar</span>}</td>
          <td className="text-muted small">
            {t.fechaSolicitud
              ? new Date(t.fechaSolicitud).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })
              : "—"}
          </td>
          <td>
            <div className="acciones">
              <button className="btn-accion" title="Ver detalle" onClick={() => { setTicketVer(t); setTabDetalle("info"); setComentariosAdmin([]); }}>
                <FaEye />
              </button>
              {t.estadoTicket?.nombre === "CERRADO" &&
 t.solicitanteId === usuario?.id && (
  <button
    className="btn-accion"
    title="Reabrir ticket"
    onClick={() => handleReabrir(t.id)}
  >
    🔓
  </button>
)}
              {puedeEditar && (
                <button className="btn-accion" title="Editar" onClick={() => navigate(`/tickets/edit/${t.id}`)}>
                  <FaEdit />
                </button>
              )}
              {puedeAsignar && (
                <button className="btn-accion asignar" title="Asignar técnico" onClick={() => openAsignarModal(t)}>
                  <FaUserCog />
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "var(--bgColor)" }}>
      <Header onLogout={handleLogout} />

      <main className="container-fluid" style={{ paddingTop: 24 }}>
        <div className="tickets-shell">
          <div className="tickets-top">
            <h2 className="tickets-title">TICKETS</h2>

            {esSupervisor && (
              <div className="supervisor-badge">
                👁️ Modo Supervisor — Puedes asignar técnicos
              </div>
            )}

            <div className="tickets-controls">
              <input type="text" className="form-control tickets-search"
                placeholder="Buscar por No., solicitante, descripción..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

              <select className="form-select tickets-filter" value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}>
                <option value="TODOS">Todas las prioridades</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
                <option value="SIN_ASIGNAR">Sin asignar</option>
              </select>

              <select className="form-select tickets-filter" value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombreVerboso || e.nombre}</option>
                ))}
              </select>

              <select className="form-select tickets-filter" value={filtroDept}
                onChange={(e) => setFiltroDept(e.target.value)}>
                <option value="TODOS">Todos los departamentos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.abreviatura || d.nombre}</option>
                ))}
              </select>

              {hayFiltros && (
                <button className="btn-limpiar" onClick={limpiarFiltros}>
                  <FaTimes className="me-1" />Limpiar
                </button>
              )}

              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={exportPDF}   className="tickets-btn-pdf">PDF</Button>
                <Button onClick={exportExcel} className="tickets-btn-success">Excel</Button>
                {puedeEditar && (
                  <Link to="/tickets/crear" className="btn tickets-btn-primary d-flex align-items-center gap-2">
                    <FaTicketAlt />Nuevo Ticket
                  </Link>
                )}
              </div>
            </div>

            {!loading && (
              <div className="tickets-counter">
                Mostrando <strong>{filtered.length}</strong> de <strong>{tickets.length}</strong> tickets
                {hayFiltros && (
                  <span className="ms-2 text-primary">
                    <FaFilter size={11} className="me-1" />Filtros activos
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="card tickets-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="tickets-thead">
                  <tr>
                    <th onClick={() => sort("noSolicitud")} style={{ cursor: "pointer" }}>No. Solicitud{arrow("noSolicitud")}</th>
                    <th>Solicitante</th>
                    <th>Departamento</th>
                    <th onClick={() => sort("prioridad")} style={{ cursor: "pointer" }}>Prioridad{arrow("prioridad")}</th>
                    <th>Estado</th>
                    <th>Técnico</th>
                    <th onClick={() => sort("fechaSolicitud")} style={{ cursor: "pointer" }}>Fecha{arrow("fechaSolicitud")}</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>{renderBody()}</tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="tickets-pagination">
                <nav>
                  <ul className="pagination mb-0">
                    {[...Array(totalPaginas)].map((_, i) => {
                      const p = i + 1;
                      const active = pagina === p;
                      return (
                        <li key={p} className={`page-item ${active ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setPagina(p)}
                            style={{
                              background: active ? "var(--primaryColor)" : "#fff",
                              color:      active ? "#fff" : "var(--primaryColor)",
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

      {/* ── Modal detalle con tabs ── */}
      <Modal show={!!ticketVer} onHide={cerrarModalDetalle} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 800 }}>
            <FaTicketAlt className="me-2" />Ticket {ticketVer?.noSolicitud}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0">
          {ticketVer && (
            <>
              {/* Tabs */}
              <div className="d-flex border-bottom">
                <button onClick={() => setTabDetalle("info")} style={{
                  flex: 1, padding: "12px", border: "none", background: "none",
                  fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                  borderBottom: tabDetalle === "info" ? "3px solid var(--primaryColor)" : "3px solid transparent",
                  color: tabDetalle === "info" ? "var(--primaryColor)" : "#6b7280",
                }}>
                  📋 Información
                </button>
<button onClick={() => { setTabDetalle("conversacion"); cargarComentariosAdmin(ticketVer?.id); console.log("cargando comentarios de ticket:", ticketVer?.id); }}                  style={{
                    flex: 1, padding: "12px", border: "none", background: "none",
                    fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                    borderBottom: tabDetalle === "conversacion" ? "3px solid var(--primaryColor)" : "3px solid transparent",
                    color: tabDetalle === "conversacion" ? "var(--primaryColor)" : "#6b7280",
                  }}>
                  💬 Conversación
                </button>
              </div>

              {/* Tab: Información */}
              {tabDetalle === "info" && (
                <div className="p-4">
                  <table className="table table-borderless mb-0 small">
                    <tbody>
                      {[
                        ["No. Solicitud",   ticketVer.noSolicitud],
                        ["Solicitante",     ticketVer.solicitante?.nombre ?? "—"],
                        ["Oficina",         ticketVer.oficina],
                        ["Extensión",       ticketVer.extension],
                        ["Departamento",    ticketVer.departamentoSolicitante?.nombre ?? "—"],
                        ["Tipo",            ticketVer.tipoTicket?.nombre ?? ticketVer.tipoPersonalizado ?? "—"],
                        ["Prioridad",       ticketVer.prioridad?.replace("_", " ")],
                        ["Estado",          ticketVer.estadoTicket?.nombreVerboso ?? "—"],
                        ["Técnico",         ticketVer.tecnico?.nombre ?? "Sin asignar"],
                        ["Fecha solicitud", ticketVer.fechaSolicitud ? new Date(ticketVer.fechaSolicitud).toLocaleString("es-GT") : "—"],
                        ["Descripción",     ticketVer.descripcion],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td style={{ width: 160, fontWeight: 700, color: "#555" }}>{label}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Conversación */}
              {tabDetalle === "conversacion" && (
                <div className="p-4">
                  {loadingComentariosAdmin ? (
                    <div className="text-center py-4 text-muted">
                      <Spinner animation="border" size="sm" className="me-2" />Cargando conversación...
                    </div>
                  ) : comentariosAdmin.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FaCommentAlt style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 8 }} />
                      <div className="fw-semibold">Sin mensajes aún</div>
                      <div className="small">No hay conversación en este ticket</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                      {comentariosAdmin.map((c) => {
                        const esSolicitante = c.autorTipo === "SOLICITANTE";
                        return (
                          <div key={c.id} style={{ alignSelf: esSolicitante ? "flex-start" : "flex-end", maxWidth: "80%" }}>
                            <div style={{
                              fontSize: "0.72rem", fontWeight: 700, marginBottom: 3,
                              color: esSolicitante ? "#0958d3" : "#2f9e44",
                              textAlign: esSolicitante ? "left" : "right",
                            }}>
                              {esSolicitante ? "👤 " : "🔧 "}
                              {c.autor?.nombre || (esSolicitante ? "Solicitante" : "Técnico")}
                              <span style={{ color: "#adb5bd", fontWeight: 400, marginLeft: 6 }}>
                                {new Date(c.createdAt).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>
                            <div style={{
                              padding: "10px 14px", borderRadius: 12,
                              background: esSolicitante ? "#e6f4ff" : "#f6ffed",
                              border: `1px solid ${esSolicitante ? "#91caff" : "#c3f0ca"}`,
                              borderTopLeftRadius:  esSolicitante ? 4 : 12,
                              borderTopRightRadius: esSolicitante ? 12 : 4,
                              fontSize: "0.88rem", lineHeight: 1.5,
                            }}>
                              {c.comentario && <div>{c.comentario}</div>}
                              {c.archivoUrl && (
                                <a href={`http://10.21.25.54:3001/uploads/${c.archivoUrl}`}
                                  target="_blank" rel="noreferrer"
                                  style={{ fontSize: "0.8rem", color: "#096dd9", display: "block", marginTop: 4 }}>
                                  📎 Ver archivo adjunto
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-top-0 justify-content-between">
          <Button variant="outline-secondary" style={{ borderRadius: 12 }} onClick={cerrarModalDetalle}>
            Cerrar
          </Button>
          <div className="d-flex gap-2">
            {puedeAsignar && ticketVer && (
              <Button
                style={{ background: "var(--primaryColor)", border: "none", borderRadius: 12, fontWeight: 800 }}
                onClick={() => { cerrarModalDetalle(); openAsignarModal(ticketVer); }}
              >
                <FaUserCog className="me-1" />Asignar técnico
              </Button>
            )}
            {ticketVer?.estadoTicket?.nombre === "CERRADO" &&
 ticketVer?.solicitanteId === usuario?.id && (
  <Button
    variant="outline-success"
    style={{ borderRadius: 12, fontWeight: 800 }}
    onClick={() => { handleReabrir(ticketVer.id); cerrarModalDetalle(); }}
  >
    🔓 Reabrir ticket
  </Button>
)}
          </div>
        </Modal.Footer>
      </Modal>

      {/* ── Modal asignar técnico ── */}
      <Modal show={showAsignarModal} onHide={closeAsignarModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 800 }}>
            <FaUserCog className="me-2" />Asignar Técnico
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {ticketToAsignar && (
            <p className="text-muted mb-3" style={{ fontSize: ".9rem" }}>
              Ticket <strong>{ticketToAsignar.noSolicitud}</strong>
              {ticketToAsignar.descripcion && (
                <span className="d-block text-truncate" style={{ maxWidth: 380 }}>
                  {ticketToAsignar.descripcion}
                </span>
              )}
            </p>
          )}
          {loadingTecnicos ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />Cargando técnicos...
            </div>
          ) : (
            <Form.Group>
              <Form.Label className="fw-bold">Selecciona un técnico</Form.Label>
              <Form.Select value={tecnicoSeleccionado}
                onChange={(e) => { setTecnicoSeleccionado(e.target.value); setAsignarError(""); }}
                style={{ borderRadius: 10 }}>
                <option value="">— Seleccionar técnico —</option>
                {tecnicos.map((tec) => {
                  const tecId = tec.id ?? tec.id_usuario ?? tec.idUsuario;
                  return (
                    <option key={tecId} value={tecId}>
                      {tec.nombre}{tec.email ? ` (${tec.email})` : ""}
                    </option>
                  );
                })}
              </Form.Select>
              {asignarError && (
                <div className="text-danger mt-2" style={{ fontSize: ".82rem" }}>{asignarError}</div>
              )}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAsignarModal} style={{ border: "none", borderRadius: 10 }}>
            Cancelar
          </Button>
          <Button onClick={handleAsignarTecnico} disabled={savingAsignacion || loadingTecnicos}
            style={{ background: "var(--primaryColor)", border: "none", borderRadius: 10, fontWeight: 800 }}>
            {savingAsignacion
              ? <><Spinner animation="border" size="sm" className="me-1" />Guardando...</>
              : "Asignar"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .tickets-shell { padding: 10px 20px 20px 20px; }
        .tickets-top { display: flex; flex-direction: column; align-items: center; margin: 10px 0 18px 0; }
        .tickets-title { margin: 0; font-weight: 900; letter-spacing: 1px; color: var(--primaryColor); }
        .supervisor-badge {
          margin-top: 8px; padding: 6px 16px;
          background: rgba(255,193,7,0.15); border: 1px solid rgba(255,193,7,0.5);
          border-radius: 999px; color: #856404; font-weight: 700; font-size: .82rem;
        }
        .tickets-controls {
          width: min(1300px, 100%); margin-top: 14px;
          display: flex; gap: 10px; flex-wrap: wrap;
          align-items: center; justify-content: center;
        }
        .tickets-search { max-width: 280px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); background: var(--inputColor, #fff); }
        .tickets-filter { max-width: 180px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); background: #fff; }
        .btn-limpiar {
          background: none; border: 1px solid rgba(176,42,55,0.3); border-radius: 12px;
          padding: 6px 14px; color: #b02a37; font-weight: 700; font-size: .85rem;
          cursor: pointer; display: flex; align-items: center; transition: background .15s;
        }
        .btn-limpiar:hover { background: rgba(176,42,55,0.08); }
        .tickets-counter { margin-top: 8px; font-size: .82rem; color: #6c757d; }
        .tickets-card {
          width: min(1300px, 100%); margin: 0 auto;
          border: 1px solid rgba(0,0,0,0.06); border-radius: 16px;
          overflow: hidden; box-shadow: 0 10px 28px rgba(0,0,0,0.08);
        }
        .tickets-thead th { background: var(--primaryColor); color: var(--whiteColor, #fff); font-weight: 800; border-bottom: 0; white-space: nowrap; }
        .tickets-pagination { padding: 12px; background: #fff; border-top: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: center; }
        .ticket-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
        .estado-badge-ticket { background: rgba(13,110,253,0.1); color: #084298; border: 1px solid rgba(13,110,253,0.2); }
        .acciones { display: flex; gap: 6px; align-items: center; justify-content: flex-start; }
        .btn-accion {
          width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform .08s, background .15s; color: var(--primaryColor); font-size: 1rem;
        }
        .btn-accion:hover         { transform: translateY(-1px); background: rgba(95,125,156,0.10); }
        .btn-accion.danger        { color: #b02a37; }
        .btn-accion.danger:hover  { background: rgba(176,42,55,0.10); }
        .btn-accion.asignar       { color: #0d6efd; }
        .btn-accion.asignar:hover { background: rgba(13,110,253,0.10); }
        .tickets-btn-primary { background: var(--primaryColor); border: none; color: #fff; font-weight: 800; border-radius: 12px; padding: 9px 14px; }
        .tickets-btn-primary:hover { background: var(--hoverColor, #4a6a8a); color: #fff; }
        .tickets-btn-pdf     { background: #b02a37; border: none; border-radius: 12px; font-weight: 800; }
        .tickets-btn-pdf:hover { background: #8f1f2a; }
        .tickets-btn-success { background: #198754; border: none; border-radius: 12px; font-weight: 800; }
        @media (max-width: 576px) {
          .tickets-shell { padding: 10px; }
          .tickets-title { font-size: 1.4rem; }
          .tickets-card  { width: 100%; }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default CompShowTickets;