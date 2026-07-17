// src/Componentes/CompAsignacionTickets.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaEye, FaUserCheck, FaFlag } from "react-icons/fa";
import Header from "../Header";
import Footer from "../Footer";
import logoMS from "../../assets/MS.png";

const URI_TICKETS = "http://localhost:3001/api/tickets";
const URI_USUARIOS = "http://localhost:3001/api/usuarios";
const URI_PRIORIDADES = "http://localhost:3001/api/prioridad-ticket";
const URI_ESTADOS = "http://10.21.25.54:3001/api/estado-ticket";

/* ===== Badge prioridad por nombre (ALTA rojo) ===== */
const PRIORIDAD_BADGE = {
  ALTA: {
    label: "Alta",
    bg: "rgba(220,53,69,0.12)",
    color: "#b02a37",
    border: "rgba(220,53,69,0.35)",
  },
  MEDIA: {
    label: "Media",
    bg: "rgba(255,193,7,0.15)",
    color: "#664d03",
    border: "rgba(255,193,7,0.35)",
  },
  BAJA: {
    label: "Baja",
    bg: "rgba(25,135,84,0.15)",
    color: "#0f5132",
    border: "rgba(25,135,84,0.35)",
  },
  SIN_ASIGNAR: {
    label: "Sin asignar",
    bg: "rgba(108,117,125,0.15)",
    color: "#343a40",
    border: "rgba(108,117,125,0.35)",
  },
};

const axiosCfg = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const CompAsignacionTickets = () => {
  const navigate = useNavigate();
  const [tabDetalle, setTabDetalle] = useState("info");
  const [comentariosAdmin, setComentariosAdmin] = useState([]);
  const [loadingComentariosAdmin, setLoadingComentariosAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ── State ─────────────────────────────────────────── */
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [estados, setEstados] = useState([]);

  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterPrioridad, setFilterPrioridad] = useState("todos");

  const [sortField, setSortField] = useState("fechaSolicitud");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  const [totalBackend, setTotalBackend] = useState(0);

  const [showDetail, setShowDetail] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const [showPriority, setShowPriority] = useState(false);
  const [prioridadSel, setPrioridadSel] = useState("");
  const [savingPriority, setSavingPriority] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tecnicoSel, setTecnicoSel] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [loadingPrioridades, setLoadingPrioridades] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastCount, setToastCount] = useState(0);

  /* ── Map id -> prioridad ───────────────────────────── */
  const prioridadById = useMemo(() => {
    const m = new Map();
    (prioridades || []).forEach((p) => m.set(String(p.id), p));
    return m;
  }, [prioridades]);

  /* ── Helpers ───────────────────────────────────────── */
  const getPrioridadObj = (ticket) => {
    if (ticket?.prioridadTicket) return ticket.prioridadTicket;
    const id = ticket?.prioridadTicketId;
    return id ? prioridadById.get(String(id)) : null;
  };

  /* ===== TIEMPO LABORAL 8:00 AM A 4:30 PM ===== */
  const MINUTOS_INICIO_JORNADA = 8 * 60;
  const MINUTOS_FIN_JORNADA = 16 * 60 + 30;

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
      const tramoInicio = new Date(Math.max(cursor.getTime(), inicioDia.getTime()));
      const tramoFin = new Date(Math.min(finReal.getTime(), finDia.getTime()));
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

  const calcularTiempoEspera = (fechaSolicitud, fechaAsignacion) => {
    if (!fechaSolicitud) return null;
    const fin = fechaAsignacion ? new Date(fechaAsignacion) : new Date();
    const diff = obtenerMinutosLaborales(fechaSolicitud, fin);
    const texto = formatearMinutosLaborales(diff);
    const color = diff <= 30 ? "#198754" : diff <= 120 ? "#e65100" : "#dc3545";
    return { texto: `🕐 ${texto}`, color, asignado: !!fechaAsignacion };
  };

  const calcularTiempoResolucion = (fechaAsignacion, fechaResolucion) => {
    if (!fechaAsignacion) return null;
    const fin = fechaResolucion ? new Date(fechaResolucion) : new Date();
    const diff = Math.floor((fin - new Date(fechaAsignacion)) / 1000 / 60);
    let texto = "";
    if (diff < 60) texto = `${diff} min`;
    else if (diff < 1440) texto = `${Math.floor(diff / 60)}h ${diff % 60}m`;
    else texto = `${Math.floor(diff / 1440)}d ${Math.floor((diff % 1440) / 60)}h`;
    const color = diff <= 60 ? "#198754" : diff <= 480 ? "#e65100" : "#dc3545";
    return { texto: `⏱ ${texto}`, color, enCurso: !fechaResolucion };
  };

  const cargarComentariosAdmin = useCallback(async (ticketId) => {
    setLoadingComentariosAdmin(true);
    try {
      const res = await axios.get(
        `http://10.21.25.54:3001/api/ticket-comentarios/ticket/${ticketId}`,
        axiosCfg()
      );
      const lista = Array.isArray(res.data) ? res.data : res.data?.comentarios || [];
      setComentariosAdmin(lista.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
      setComentariosAdmin([]);
    } finally {
      setLoadingComentariosAdmin(false);
    }
  }, []);

  const isPrioridadSinAsignar = (ticket) => {
    const prioridad = getPrioridadObj(ticket);
    const nombre = (prioridad?.nombre || "").toUpperCase().trim();
    return !prioridad || nombre === "SIN_ASIGNAR";
  };
  const hasPriorityAssigned = (ticket) => !isPrioridadSinAsignar(ticket);
  const canChangePriority = (ticket) => isPrioridadSinAsignar(ticket);
  const isTicketAssigned = (ticket) => Boolean(ticket?.tecnicoId || ticket?.tecnico?.id || ticket?.tecnico?.nombre);
  const isTicketCancelled = (ticket) => (ticket?.estadoTicket?.nombre || "").toUpperCase() === "ANULADO";
  const canAssignTicket = (ticket) => !isTicketAssigned(ticket) && !isTicketCancelled(ticket);

  const renderPrioridadBadge = (ticketOrPrioridad) => {
    const p = ticketOrPrioridad?.nombre
      ? ticketOrPrioridad
      : getPrioridadObj(ticketOrPrioridad);

    if (!p) {
      const cfg = PRIORIDAD_BADGE.SIN_ASIGNAR;
      return (
        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, fontWeight: 800, fontSize: ".75rem", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
          {cfg.label}
        </span>
      );
    }

    const nombre = (p.nombre || "").toUpperCase();
    const cfg = PRIORIDAD_BADGE[nombre] || {
      label: p.nombreVerboso || p.nombre,
      bg: "rgba(108,117,125,0.15)",
      color: "#343a40",
      border: "rgba(108,117,125,0.35)",
    };

    return (
      <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, fontWeight: 800, fontSize: ".75rem", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
        {p.nombreVerboso || cfg.label}
      </span>
    );
  };

  /* ── renderEstadoBadge — muestra doble badge si fueReabierto ── */
  const renderEstadoBadge = (estadoTicket, fueReabierto = false) => {
    if (!estadoTicket) return <span className="text-muted">—</span>;

    const nombre = (estadoTicket.nombre ?? "").toUpperCase();
    const label = estadoTicket.nombreVerboso ?? estadoTicket.nombre;

    const estilos = {
      ABIERTO: { bg: "rgba(13,110,253,0.12)", color: "#084298", border: "rgba(13,110,253,0.30)" },
      EN_PROCESO: { bg: "rgba(255,193,7,0.15)", color: "#664d03", border: "rgba(255,193,7,0.35)" },
      RESUELTO: { bg: "rgba(25,135,84,0.15)", color: "#0f5132", border: "rgba(25,135,84,0.35)" },
      CERRADO: { bg: "rgba(108,117,125,0.15)", color: "#343a40", border: "rgba(108,117,125,0.35)" },
      ANULADO: { bg: "rgba(220,53,69,0.12)", color: "#b02a37", border: "rgba(220,53,69,0.35)" },
      REABIERTO: { bg: "rgba(111,66,193,0.12)", color: "#6f42c1", border: "rgba(111,66,193,0.3)" },
    };

    const cfg = estilos[nombre] || estilos.CERRADO;
    const rCfg = estilos["REABIERTO"];

    const badgeStyle = {
      display: "inline-block", padding: "4px 10px", borderRadius: 999,
      fontWeight: 800, fontSize: ".75rem", whiteSpace: "nowrap",
    };

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {fueReabierto && (
          <span style={{ ...badgeStyle, background: rCfg.bg, color: rCfg.color, border: `1px solid ${rCfg.border}` }}>
            Reabierto
          </span>
        )}
        <span style={{ ...badgeStyle, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          {label}
        </span>
      </span>
    );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatHora = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  };

  const renderFechaDobleLinea = (fecha) => {
    if (!fecha) return <span className="text-muted">—</span>;
    return (
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontWeight: 700 }}>{formatFecha(fecha)}</div>
        <div style={{ fontSize: ".78rem", color: "#8a8a8a" }}>{formatHora(fecha)}</div>
      </div>
    );
  };

  const formatFechaHora = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /* ── Cargar prioridades ────────────────────────────── */
  const getPrioridades = useCallback(async () => {
    try {
      setLoadingPrioridades(true);
      const res = await axios.get(URI_PRIORIDADES, axiosCfg());
      setPrioridades(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener prioridades:", err);
      setPrioridades([]);
    } finally {
      setLoadingPrioridades(false);
    }
  }, []);

  /* ── Cargar técnicos ───────────────────────────────── */
  const getTecnicos = useCallback(async () => {
    try {
      setLoadingTecnicos(true);
      const res = await axios.get(URI_USUARIOS, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      const soloTecnicos = data.filter(
        (u) => u.activo !== false && (u.rol?.nombre === "TECNICO" || u.Rols?.some((r) => r.nombre === "TECNICO"))
      );
      setTecnicos(soloTecnicos);
    } catch (err) {
      console.error("Error al obtener técnicos:", err);
    } finally {
      setLoadingTecnicos(false);
    }
  }, []);

  /* ── Cargar tickets ────────────────────────────────── */
  const getTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: 1, limit: 500 });

      if (filterEstado !== "todos") {
        params.append("estadoId", filterEstado);
      }

      if (filterPrioridad !== "todos") {
        params.append("prioridad", filterPrioridad);
      }

      const res = await axios.get(`${URI_TICKETS}?${params}`, axiosCfg());
      const data = res.data;

      const lista = Array.isArray(data.tickets) ? data.tickets : [];
      setTickets(lista);
      setFilteredTickets(lista);
      setTotalBackend(data.total ?? lista.length);

      const ahora = new Date();
      const sinAsignar = lista.filter(
        (t) => !isTicketCancelled(t) && !isTicketAssigned(t) && ahora - new Date(t.fechaSolicitud) < 24 * 60 * 60 * 1000
      ).length;

      if (sinAsignar > 0) {
        setToastCount(sinAsignar);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (err) {
      console.error("Error al obtener tickets:", err);
      setError(err);
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterPrioridad]);

  useEffect(() => {
    getPrioridades();
    getTickets();
    getTecnicos();
    axios.get("http://localhost:3001/api/estado-ticket", axiosCfg())
      .then(res => setEstados(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEstados([]));
  }, [getPrioridades, getTickets, getTecnicos]);

  /* ── Filtro local ──────────────────────────────────── */
  useEffect(() => {
    let filtered = tickets;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => {
        const p = getPrioridadObj(t);
        return (
          (t.noSolicitud || "").toLowerCase().includes(term) ||
          (t.descripcion || "").toLowerCase().includes(term) ||
          (t.solicitante?.nombre || "").toLowerCase().includes(term) ||
          (t.tipoTicket?.nombre || "").toLowerCase().includes(term) ||
          (t.departamento?.nombre || "").toLowerCase().includes(term) ||
          (t.tipoPersonalizado || "").toLowerCase().includes(term) || 
          (t.tecnico?.nombre || "").toLowerCase().includes(term) ||
          (p?.nombreVerboso || p?.nombre || "").toLowerCase().includes(term)
        );
      });
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, tickets]);

  /* ── Ordenamiento ───────────────────────────────────── */
  const sortTickets = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    const sorted = [...filteredTickets].sort((a, b) => {
      if (field === "prioridad") {
        const pa = (getPrioridadObj(a)?.nombre || "").toLowerCase();
        const pb = (getPrioridadObj(b)?.nombre || "").toLowerCase();
        return order === "asc" ? (pa < pb ? -1 : pa > pb ? 1 : 0) : (pa < pb ? 1 : pa > pb ? -1 : 0);
      }
      const va = (a[field] ?? "").toString().toLowerCase();
      const vb = (b[field] ?? "").toString().toLowerCase();
      return order === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
    });
    setFilteredTickets(sorted);
    setSortField(field);
    setSortOrder(order);
  };

  /* ── Paginación ─────────────────────────────────────── */
  const indexOfLast = currentPage * ticketsPerPage;
  const indexOfFirst = indexOfLast - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  /* ── Acciones ───────────────────────────────────────── */
  const openDetail = (ticket) => { setSelectedTicket(ticket); setShowDetail(true); };

  const openAssign = (ticket) => {
    if (!canAssignTicket(ticket)) return;
    setSelectedTicket(ticket);
    setTecnicoSel("");
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!tecnicoSel || !selectedTicket || !canAssignTicket(selectedTicket)) return;
    try {
      setSaving(true);
      await axios.patch(`${URI_TICKETS}/${selectedTicket.id}/asignar-tecnico`, { tecnicoId: Number(tecnicoSel) }, axiosCfg());
      setShowAssign(false);
      setSelectedTicket(null);
      setSaving(false);
      getTickets();
    } catch (err) {
      console.error("Error al asignar técnico:", err);
      alert(`Error al asignar: ${err.response?.data?.message ?? err.message}`);
      setSaving(false);
    }
  };

  /* ── Modal prioridad ────────────────────────────────── */
  const openPriority = (ticket) => {
    if (!canChangePriority(ticket)) return;
    setSelectedTicket(ticket);
    const currentId = ticket?.prioridadTicket?.id ?? ticket?.prioridadTicketId ?? "";
    setPrioridadSel(currentId ? String(currentId) : "");
    setShowPriority(true);
  };

  const handleChangePriority = async () => {
    if (!selectedTicket || !canChangePriority(selectedTicket)) return;
    try {
      setSavingPriority(true);
      await axios.put(`${URI_TICKETS}/${selectedTicket.id}`, { prioridadTicketId: prioridadSel ? Number(prioridadSel) : null }, axiosCfg());
      setShowPriority(false);
      setSelectedTicket(null);
      setPrioridadSel("");
      setSavingPriority(false);
      getTickets();
    } catch (err) {
      console.error("Error al cambiar prioridad:", err);
      alert(`Error: ${err.response?.data?.message ?? err.message}`);
      setSavingPriority(false);
    }
  };

  /* ── Exportar ───────────────────────────────────────── */
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const ahora = new Date().toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    doc.addImage(logoMS, "PNG", 10, 8, 55, 18);
    doc.setDrawColor(26, 54, 93);
    doc.setLineWidth(0.5);
    doc.line(10, 28, pageW - 10, 28);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("REPORTE DE ASIGNACIÓN DE TICKETS", pageW / 2, 36, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Ministerio de Salud Pública y Asistencia Social — Guatemala", pageW / 2, 42, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Generado: ${ahora}`, pageW - 12, 42, { align: "right" });
    doc.text(`Total de registros: ${filteredTickets.length}`, pageW - 12, 47, { align: "right" });

    autoTable(doc, {
      head: [["No. Solicitud", "Tipo", "Prioridad", "Estado", "Técnico", "Solicitante", "Depto.", "Fecha/Hora", "Espera asignación", "Tiempo resolución"]],
      body: filteredTickets.map((t) => {
        const p = getPrioridadObj(t);
        const espera = calcularTiempoEspera(t.fechaSolicitud, t.fechaAsignacion);
        const resolucion = calcularTiempoResolucion(t.fechaAsignacion, t.fechaResolucion);
        const estadoLabel = t.fueReabierto
          ? `Reabierto / ${t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? "—"}`
          : (t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? "—");
        return [
          t.noSolicitud ?? "—",
          t.tipoTicket?.nombre ?? t.tipoPersonalizado ?? "—",
          p?.nombreVerboso ?? p?.nombre ?? "Sin asignar",
          estadoLabel,
          t.tecnico?.nombre ?? "—",
          t.solicitante?.nombre ?? "—",
          t.departamento?.abreviatura ?? t.departamento?.nombre ?? "—",
          formatFechaHora(t.fechaSolicitud),
          espera ? espera.texto.replace("🕐 ", "") : "—",
          resolucion ? resolucion.texto.replace("⏱ ", "") : "—",
        ];
      }),
      startY: 52,
      theme: "striped",
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [26, 54, 93], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Ministerio de Salud Pública y Asistencia Social — Página ${data.pageNumber} de ${pageCount}`, pageW / 2, pageH - 8, { align: "center" });
      },
    });

    doc.save(`tickets_asignacion_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadExcel = () => {
    const ahora = new Date().toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const encabezado = [
      ["Ministerio de Salud Pública y Asistencia Social"],
      ["Reporte de Asignación de Tickets"],
      [`Generado: ${ahora}     Total: ${filteredTickets.length} registros`],
      [],
    ];

    const data = filteredTickets.map((t) => {
      const p = getPrioridadObj(t);
      const espera = calcularTiempoEspera(t.fechaSolicitud, t.fechaAsignacion);
      const resolucion = calcularTiempoResolucion(t.fechaAsignacion, t.fechaResolucion);
      const estadoLabel = t.fueReabierto
        ? `Reabierto / ${t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? "—"}`
        : (t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? "—");
      return {
        "No. Solicitud": t.noSolicitud ?? "",
        "Tipo": t.tipoTicket?.nombre ?? t.tipoPersonalizado ?? "",
        "Prioridad": p?.nombreVerboso ?? p?.nombre ?? "Sin asignar",
        "Estado": estadoLabel,
        "Técnico Asignado": t.tecnico?.nombre ?? "",
        "Correo Técnico": t.tecnico?.email ?? "",
        "Solicitante": t.solicitante?.nombre ?? "",
        "Departamento": t.departamento?.nombre ?? "",
        "Descripción": t.descripcion ?? "",
        "Oficina": t.oficina ?? "",
        "Extensión": t.extension ?? "",
        "Fecha Solicitud": formatFechaHora(t.fechaSolicitud),
        "Fecha Asignación": formatFechaHora(t.fechaAsignacion),
        "Fecha Resolución": formatFechaHora(t.fechaResolucion),
        "Espera Asignación": espera ? espera.texto.replace("🕐 ", "") : "—",
        "Tiempo Resolución": resolucion ? resolucion.texto.replace("⏱ ", "") : "—",
      };
    });

    const ws = XLSX.utils.aoa_to_sheet(encabezado);
    XLSX.utils.sheet_add_json(ws, data, { origin: "A5" });
    ws["!cols"] = [
      { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 26 },
      { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, `tickets_asignacion_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ── Tabla body ─────────────────────────────────────── */
  const renderTableBody = () => {
    if (loading || loadingTecnicos || loadingPrioridades) {
      return (
        <tr><td colSpan="9" className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" /> Cargando tickets...
        </td></tr>
      );
    }

    if (error?.response?.status === 403) {
      return <tr><td colSpan="9" className="text-center text-danger py-4">No tiene permisos para ver esta sección.</td></tr>;
    }
    if (error?.response?.status === 401) {
      return (
        <tr><td colSpan="9" className="text-center text-muted py-4">
          Sesión expirada.{" "}
          <button className="btn btn-link p-0" onClick={handleLogout}>Inicie sesión</button>
        </td></tr>
      );
    }
    if (error) {
      return <tr><td colSpan="9" className="text-center text-muted py-4">Error al cargar los tickets.</td></tr>;
    }
    if (!currentTickets.length) {
      return <tr><td colSpan="9" className="text-center text-muted py-4">Sin resultados.</td></tr>;
    }

    return currentTickets.map((ticket) => {
      const yaAsignado = isTicketAssigned(ticket);
      const anulado = isTicketCancelled(ticket);
      const puedeAsignarse = canAssignTicket(ticket);
      const prioridadYaAsignada = hasPriorityAssigned(ticket);
      const puedeCambiarPrioridad = canChangePriority(ticket);

      return (
        <tr key={ticket.id}>
          <td>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ fontWeight: 900, color: "var(--primaryColor)", whiteSpace: "nowrap" }}>
                {ticket.noSolicitud ?? `#${ticket.id}`}
              </span>
              {!anulado && !yaAsignado && new Date() - new Date(ticket.fechaSolicitud) < 24 * 60 * 60 * 1000 && (
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 999,
                  fontSize: "0.68rem", fontWeight: 900, letterSpacing: 0.3,
                  background: "rgba(220,53,69,0.12)", color: "#b02a37",
                  border: "1px solid rgba(220,53,69,0.35)",
                  animation: "pulse-badge 1.8s ease-in-out infinite",
                }}>
                  ● NUEVO
                </span>
              )}
            </div>
          </td>

          <td style={{ maxWidth: 220 }}>
            <div style={{ fontSize: ".88rem", fontWeight: 800 }}>{ticket.tipoPersonalizado ?? ticket.tipoTicket?.nombre ?? "—"}</div>
            <small className="text-muted">
              {ticket.descripcion?.substring(0, 55)}{ticket.descripcion?.length > 55 ? "…" : ""}
            </small>
          </td>

          <td>{renderPrioridadBadge(ticket)}</td>

          <td>{renderEstadoBadge(ticket.estadoTicket, ticket.fueReabierto)}</td>

          <td>
            <div style={{ fontSize: ".88rem" }}>{ticket.solicitante?.nombre ?? "—"}</div>
            <small className="text-muted">{ticket.departamento?.abreviatura ?? ticket.departamento?.nombre ?? ""}</small>
          </td>

          <td>
            {ticket.tecnico?.nombre ? (
              <>
                <div style={{ fontWeight: 800, fontSize: ".88rem" }}>{ticket.tecnico.nombre}</div>
                <small className="text-muted">{ticket.tecnico.email ?? ""}</small>
              </>
            ) : (
              <span className="text-muted fst-italic" style={{ fontSize: ".83rem" }}>Sin asignar</span>
            )}
          </td>

          <td style={{ whiteSpace: "nowrap" }}>{renderFechaDobleLinea(ticket.fechaSolicitud)}</td>

          <td>
            {(() => {
              const r = calcularTiempoEspera(ticket.fechaSolicitud, ticket.fechaAsignacion);
              if (!r) return <span className="text-muted">—</span>;
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

          <td>
            <div className="acciones">
              <Button className="btn-accion" title="Ver detalle" onClick={() => openDetail(ticket)}>
                <FaEye />
              </Button>
              <Button
                className="btn-accion"
                title={prioridadYaAsignada ? "La prioridad ya fue asignada" : "Cambiar prioridad"}
                onClick={() => openPriority(ticket)}
                disabled={!puedeCambiarPrioridad}
              >
                <FaFlag />
              </Button>
              {puedeAsignarse && (
                <Button className="btn-accion ok" title="Asignar técnico" onClick={() => openAssign(ticket)}>
                  <FaUserCheck />
                </Button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  /* ── Render principal ───────────────────────────────── */
  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "var(--bgColor)" }}>
      <Header onLogout={handleLogout} />

      {showToast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: "#fff", borderRadius: 14, padding: "14px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)", border: "1px solid rgba(220,53,69,0.25)",
          display: "flex", alignItems: "center", gap: 12, minWidth: 280,
          animation: "slide-in-toast 0.3s ease",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: "rgba(220,53,69,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            🎫
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: "0.9rem", color: "#b02a37" }}>
              {toastCount} ticket{toastCount !== 1 ? "s" : ""} Nuevos
            </div>
            <div style={{ fontSize: "0.78rem", color: "#888", marginTop: 2 }}>
              Revisa y asigna un técnico para continuar.
            </div>
          </div>
          <button onClick={() => setShowToast(false)} style={{ border: "none", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "1rem", padding: 0 }}>✕</button>
        </div>
      )}

      <main className="container-fluid" style={{ paddingTop: 24 }}>
        <div className="asign-shell">
          <div className="asign-top">
            <h2 className="asign-title">ASIGNACIÓN DE TICKETS</h2>
            <div style={{ fontSize: ".82rem", color: "#888", marginTop: 2 }}>
              {filteredTickets.length} de {totalBackend} ticket{totalBackend !== 1 ? "s" : ""}
            </div>

            <div className="asign-controls">
              <input
                type="text"
                className="form-control asign-search"
                placeholder="Buscar por no. solicitud, solicitante, tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="form-select asign-filter"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="REABIERTO">Reabierto</option>
                {estados
                  .filter(e => e.nombre?.toUpperCase() !== "REABIERTO")
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nombreVerboso || e.nombre}
                    </option>
                  ))
                }
              </select>

              <select
                className="form-select asign-filter"
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                disabled={loadingPrioridades}
              >
                <option value="todos">Todas las prioridades</option>
                {prioridades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombreVerboso || p.nombre}</option>
                ))}
              </select>

              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={getTickets} className="asign-btn-reload" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "↻ Actualizar"}
                </Button>
                <Button onClick={downloadPDF} className="asign-btn-pdf">PDF</Button>
                <Button onClick={downloadExcel} className="asign-btn-success">Excel</Button>
              </div>
            </div>
          </div>

          <div className="card asign-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="asign-thead">
                  <tr>
                    <th onClick={() => sortTickets("noSolicitud")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                      No. Solicitud {sortField === "noSolicitud" ? <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span> : null}
                    </th>
                    <th>Tipo / Descripción</th>
                    <th onClick={() => sortTickets("prioridad")} style={{ cursor: "pointer" }}>
                      Prioridad {sortField === "prioridad" ? <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span> : null}
                    </th>
                    <th>Estado</th>
                    <th onClick={() => sortTickets("solicitanteId")} style={{ cursor: "pointer" }}>
                      Solicitante {sortField === "solicitanteId" ? <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span> : null}
                    </th>
                    <th>Técnico Asignado</th>
                    <th onClick={() => sortTickets("fechaSolicitud")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                      Fecha {sortField === "fechaSolicitud" ? <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span> : null}
                    </th>
                    <th style={{ whiteSpace: "nowrap" }}>Espera asignación</th>
                    <th style={{ width: 140, textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="asign-pagination">
                <nav className="d-flex justify-content-center">
                  <ul className="pagination mb-0">
                    {[...Array(totalPages)].map((_, index) => {
                      const p = index + 1;
                      const active = currentPage === p;
                      return (
                        <li key={p} className={`page-item ${active ? "active" : ""}`}>
                          <button
                            onClick={() => setCurrentPage(p)}
                            className="page-link"
                            style={{ background: active ? "var(--primaryColor)" : "#fff", color: active ? "#fff" : "var(--primaryColor)", border: "1px solid rgba(0,0,0,0.08)" }}
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

      {/* ── Modal Detalle ── */}
      <Modal
        show={showDetail}
        onHide={() => {
          setShowDetail(false);
          setTabDetalle("info");
          setComentariosAdmin([]);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <h5 className="modal-title">Detalle del Ticket</h5>
        </Modal.Header>

        <Modal.Body
          className="p-0"
          style={{
            maxHeight: "75vh",
            overflowY: "auto",
          }}
        >
          {/* CSS para ocultar el scrollbar en la conversación */}
          <style>
            {`
              .modal-body {
                scrollbar-width: thin;
              }
              .modal-body::-webkit-scrollbar {
                width: 6px;
              }
              .modal-body::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .modal-body::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 10px;
              }
              .modal-body::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              /* Forzar que la conversación NO tenga scroll */
              .conversacion-container {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
              }
              .conversacion-container * {
                overflow: visible !important;
              }
            `}
          </style>

          {selectedTicket && (
            <>
              <div className="d-flex border-bottom" style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <button onClick={() => setTabDetalle("info")} style={{
                  flex: 1, padding: "12px", border: "none", background: "none",
                  fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                  borderBottom: tabDetalle === "info" ? "3px solid var(--primaryColor)" : "3px solid transparent",
                  color: tabDetalle === "info" ? "var(--primaryColor)" : "#6b7280",
                }}>
                  📋 Información
                </button>
                <button onClick={() => { setTabDetalle("conversacion"); cargarComentariosAdmin(selectedTicket.id); }} style={{
                  flex: 1, padding: "12px", border: "none", background: "none",
                  fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                  borderBottom: tabDetalle === "conversacion" ? "3px solid var(--primaryColor)" : "3px solid transparent",
                  color: tabDetalle === "conversacion" ? "var(--primaryColor)" : "#6b7280",
                }}>
                  💬 Conversación
                </button>
              </div>

              {tabDetalle === "info" && (
                <div className="p-4">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      {[
                        ["No. Solicitud", selectedTicket.noSolicitud ?? `#${selectedTicket.id}`],
                        ["Tipo", selectedTicket.tipoPersonalizado ?? selectedTicket.tipoTicket?.nombre ?? "—"],
                        ["Descripción", selectedTicket.descripcion ?? "—"],
                        ["Oficina", selectedTicket.oficina ?? "—"],
                        ["Extensión", selectedTicket.extension ?? "—"],
                        ["Edificio", selectedTicket.edificio?.nombre ?? "—"],
                        ["Nivel", selectedTicket.nivel?.nombre ?? "—"],
                        ["Prioridad", renderPrioridadBadge(selectedTicket)],
                        ["Estado", renderEstadoBadge(selectedTicket.estadoTicket, selectedTicket.fueReabierto)],
                        ["Departamento", selectedTicket.departamento?.nombre ?? "—"],
                        ["Solicitante", selectedTicket.solicitante?.nombre ?? "—"],
                        ["Correo solicitante", selectedTicket.solicitante?.email ?? "—"],
                        ["Fecha solicitud", formatFechaHora(selectedTicket.fechaSolicitud)],
                        ["Fecha asignación", formatFechaHora(selectedTicket.fechaAsignacion)],
                        ["Tiempo de espera", (() => {
                          const r = calcularTiempoEspera(selectedTicket.fechaSolicitud, selectedTicket.fechaAsignacion);
                          if (!r) return "—";
                          return <span style={{ fontWeight: 800, color: r.color }}>{r.texto}</span>;
                        })()],
                        ["Técnico asignado", selectedTicket.tecnico?.nombre
                          ? `${selectedTicket.tecnico.nombre} (${selectedTicket.tecnico.email ?? ""})`
                          : "— Sin asignar"],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td style={{ width: 190, fontWeight: 800 }}>{label}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tabDetalle === "conversacion" && (
                <div className="p-4 conversacion-container">
                  {loadingComentariosAdmin ? (
                    <div className="text-center py-4 text-muted">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Cargando conversación...
                    </div>
                  ) : comentariosAdmin.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <div style={{ fontSize: "2rem", opacity: .2 }}>💬</div>
                      <div className="fw-semibold">Sin mensajes aún</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {comentariosAdmin.map((c) => {
                        const esSolicitante = c.autorTipo === "SOLICITANTE";
                        return (
                          <div
                            key={c.id}
                            style={{
                              alignSelf: esSolicitante ? "flex-start" : "flex-end",
                              maxWidth: "80%"
                            }}
                          >
                            <div
                              style={{
                                fontSize: ".72rem",
                                fontWeight: 700,
                                marginBottom: 3,
                                color: esSolicitante ? "#0958d3" : "#2f9e44",
                                textAlign: esSolicitante ? "left" : "right"
                              }}
                            >
                              {esSolicitante ? "👤 " : "🔧 "}
                              {c.autor?.nombre || (esSolicitante ? "Solicitante" : "Técnico")}
                              <span style={{ color: "#adb5bd", marginLeft: 6, fontWeight: 400 }}>
                                {new Date(c.createdAt).toLocaleString("es-GT", {
                                  dateStyle: "short",
                                  timeStyle: "short"
                                })}
                              </span>
                            </div>
                            <div
                              style={{
                                padding: "10px 14px",
                                borderRadius: 12,
                                background: esSolicitante ? "#e6f4ff" : "#f6ffed",
                                border: `1px solid ${esSolicitante ? "#91caff" : "#c3f0ca"}`,
                                borderTopLeftRadius: esSolicitante ? 4 : 12,
                                borderTopRightRadius: esSolicitante ? 12 : 4
                              }}
                            >
                              {c.comentario}
                              {c.archivoUrl && (
                                <a
                                  href={`http://10.21.25.54:3001/uploads/${c.archivoUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: "block", marginTop: 6 }}
                                >
                                  📎 Ver archivo
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

        <Modal.Footer className="justify-content-center border-top-0">
          {canChangePriority(selectedTicket) && (
            <Button variant="outline-warning" style={{ borderRadius: 12, fontWeight: 900 }}
              onClick={() => { setShowDetail(false); openPriority(selectedTicket); }}>
              Cambiar prioridad
            </Button>
          )}
          {canAssignTicket(selectedTicket) && (
            <Button variant="outline-primary" style={{ borderRadius: 12, fontWeight: 900 }}
              onClick={() => { setShowDetail(false); openAssign(selectedTicket); }}>
              Asignar técnico
            </Button>
          )}
          <Button variant="outline-danger" style={{ borderRadius: 12, fontWeight: 900 }}
            onClick={() => { setShowDetail(false); setTabDetalle("info"); setComentariosAdmin([]); }}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Asignar ── */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title>Asignar Técnico</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedTicket && (
            <div className="mb-3 p-3 rounded-3" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 800, fontSize: ".9rem" }}>{selectedTicket.noSolicitud ?? `#${selectedTicket.id}`}</div>
              <div style={{ fontSize: ".85rem", color: "#555", marginTop: 2 }}>{selectedTicket.tipoPersonalizado ?? selectedTicket.tipoTicket?.nombre ?? ""}</div>
              {selectedTicket.descripcion && (
                <div style={{ fontSize: ".82rem", color: "#888", marginTop: 4 }}>
                  {selectedTicket.descripcion.substring(0, 120)}{selectedTicket.descripcion.length > 120 ? "…" : ""}
                </div>
              )}
            </div>
          )}
          <Form.Group>
            <Form.Label style={{ fontWeight: 800 }}>Seleccionar técnico</Form.Label>
            {loadingTecnicos ? (
              <div className="text-center py-2"><Spinner size="sm" className="me-2" /> Cargando técnicos...</div>
            ) : tecnicos.length === 0 ? (
              <div className="alert alert-warning" style={{ fontSize: ".88rem" }}>
                No se encontraron técnicos activos. Verifique que existan usuarios con rol <strong>TECNICO</strong>.
              </div>
            ) : (
              <Form.Select value={tecnicoSel} onChange={(e) => setTecnicoSel(e.target.value)} style={{ borderRadius: 12 }}>
                <option value="">-- Seleccione un técnico --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}{t.email ? ` — ${t.email}` : ""}</option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)} style={{ border: "none", borderRadius: 12 }}>Cancelar</Button>
          <Button variant="primary" onClick={handleAssign} disabled={!tecnicoSel || saving}
            style={{ border: "none", borderRadius: 12, fontWeight: 900, background: "var(--primaryColor)" }}>
            {saving ? <><Spinner size="sm" className="me-2" />Guardando...</> : "Confirmar asignación"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Prioridad ── */}
      <Modal show={showPriority} onHide={() => setShowPriority(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title>Cambiar Prioridad</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedTicket && (
            <div className="mb-3 p-3 rounded-3" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 900 }}>{selectedTicket.noSolicitud ?? `#${selectedTicket.id}`}</div>
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <span className="text-muted" style={{ fontSize: ".85rem" }}>Actual:</span>
                {renderPrioridadBadge(selectedTicket)}
              </div>
            </div>
          )}
          <Form.Group>
            <Form.Label style={{ fontWeight: 800 }}>Seleccionar prioridad</Form.Label>
            {loadingPrioridades ? (
              <div className="text-center py-2"><Spinner size="sm" className="me-2" /> Cargando prioridades...</div>
            ) : (
              <Form.Select value={prioridadSel} onChange={(e) => setPrioridadSel(e.target.value)} style={{ borderRadius: 12 }}>
                <option value="">-- Seleccione una prioridad --</option>
                {prioridades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombreVerboso || p.nombre}</option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPriority(false)} style={{ border: "none", borderRadius: 12 }} disabled={savingPriority}>Cancelar</Button>
          <Button variant="danger" onClick={handleChangePriority} disabled={savingPriority || loadingPrioridades || !prioridadSel}
            style={{ border: "none", borderRadius: 12, fontWeight: 900 }}>
            {savingPriority ? <><Spinner size="sm" className="me-2" />Guardando...</> : "Guardar prioridad"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .asign-shell { padding: 10px 20px 20px 20px; }
        .asign-top { display: flex; flex-direction: column; align-items: center; margin: 10px 0 18px 0; }
        .asign-title { margin: 0; font-weight: 900; letter-spacing: 1px; color: var(--primaryColor); }
        .asign-controls {
          width: min(1300px, 100%); margin-top: 14px;
          display: flex; gap: 10px; flex-wrap: wrap;
          align-items: center; justify-content: center;
        }
        .asign-search { max-width: 360px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); background: var(--inputColor); }
        .asign-filter { max-width: 190px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); background: #fff; }
        .asign-card {
          width: min(1400px, 100%); margin: 0 auto;
          border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; overflow: hidden;
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
        }
        .asign-thead th { background: var(--primaryColor); color: var(--whiteColor); font-weight: 800; border-bottom: 0; white-space: nowrap; }
        .asign-btn-reload { background: #6c757d; border: none; border-radius: 12px; font-weight: 900; }
        .asign-btn-reload:hover { background: #5a6268; }
        .asign-btn-pdf { background: #b02a37; border: none; border-radius: 12px; font-weight: 900; }
        .asign-btn-pdf:hover { background: #8f1f2a; }
        .asign-btn-success { background: #198754; border: none; border-radius: 12px; font-weight: 900; }
        .asign-pagination { padding: 12px 12px 16px 12px; background: #fff; border-top: 1px solid rgba(0,0,0,0.06); }
        .acciones { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }
        .btn-accion {
          width: 34px; height: 34px; border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08) !important;
          background: #fff !important;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform .08s ease, background .15s ease, opacity .15s ease;
          color: var(--primaryColor) !important; font-size: 1rem; padding: 0;
        }
        .btn-accion:hover:not(:disabled) { transform: translateY(-1px); background: rgba(95,125,156,0.10) !important; }
        .btn-accion.ok { color: #198754 !important; }
        .btn-accion.ok:hover:not(:disabled) { background: rgba(25,135,84,0.10) !important; }
        .btn-accion:disabled { opacity: 0.45 !important; cursor: not-allowed !important; transform: none !important; box-shadow: none !important; }
        @keyframes pulse-badge { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slide-in-toast { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 576px) {
          .asign-shell { padding: 10px; }
          .asign-title { font-size: 1.3rem; }
          .asign-card { width: 100%; }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default CompAsignacionTickets;