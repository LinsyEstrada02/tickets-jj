// src/Componentes/ShowDepartamentoSolicitante.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { FaEye, FaEdit, FaLayerGroup, FaToggleOn, FaToggleOff, FaPlus } from "react-icons/fa";

import Header from "./Header";
import Footer from "./Footer";

/* ===== Base URL (igual que Header.js) ===== */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const URI = `${API_BASE}/api/departamentos-solicitantes`;
const SUB_URI = `${API_BASE}/api/sub-departamentos-solicitantes`;

const CompShowDepartamentoSolicitante = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = user?.rol === "ADMIN";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const axiosCfg = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const getIdSafe = (d) => d?.id ?? d?.id_departamento ?? d?.idDepartamento ?? null;

  const [departamentos, setDepartamentos] = useState([]);
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [departamentosPerPage] = useState(10);

  const [sortOrder, setSortOrder] = useState("asc");
  const [sortField, setSortField] = useState("nombre");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ Modal SubDepartamentos
  const [showSubModal, setShowSubModal] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);

  const [subList, setSubList] = useState([]);

  // Form SubDept (crear/editar)
  const [subFormMode, setSubFormMode] = useState("create"); // create | edit
  const [subEditingId, setSubEditingId] = useState(null);
  const [subNombre, setSubNombre] = useState("");
  const [subAbreviatura, setSubAbreviatura] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizeUpper = (v) => String(v ?? "").trim().toUpperCase();
  const normalize = (v) => String(v ?? "").trim();

  const getDepartamentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(URI, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      setDepartamentos(data);
      setFilteredDepartamentos(data);
    } catch (err) {
      console.error("Error al obtener departamentos:", err);
      setError(err);
      setDepartamentos([]);
      setFilteredDepartamentos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDepartamentos();
  }, [getDepartamentos]);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    let filtered = departamentos;
    if (term) {
      filtered = departamentos.filter((d) => {
        const nombre = (d?.nombre ?? "").toLowerCase();
        const abrev = (d?.abreviatura ?? "").toLowerCase();
        return nombre.includes(term) || abrev.includes(term);
      });
    }
    setFilteredDepartamentos(filtered);
    setCurrentPage(1);
  }, [searchTerm, departamentos]);

  const sortDepartamentos = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    const sorted = [...filteredDepartamentos].sort((a, b) => {
      const A = (a?.[field] ?? "").toString().toLowerCase();
      const B = (b?.[field] ?? "").toString().toLowerCase();
      return order === "asc" ? (A < B ? -1 : A > B ? 1 : 0) : (A < B ? 1 : A > B ? -1 : 0);
    });
    setFilteredDepartamentos(sorted);
    setSortField(field);
    setSortOrder(order);
  };

  const renderSortArrow = (field) =>
    sortField === field ? <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span> : null;

  const indexOfLast = currentPage * departamentosPerPage;
  const indexOfFirst = indexOfLast - departamentosPerPage;
  const currentDepartamentos = filteredDepartamentos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDepartamentos.length / departamentosPerPage);

  const toggleEstado = async (dep) => {
    const id = getIdSafe(dep);
    if (!id) return;

    try {
      await axios.patch(`${URI}/${id}/estado`, { activo: !dep.activo }, axiosCfg());
      await getDepartamentos();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("No se pudo cambiar el estado.");
    }
  };

  const viewDepartamentoDetails = async (dep) => {
    const id = getIdSafe(dep);
    if (!id) return;

    try {
      const res = await axios.get(`${URI}/${id}`, axiosCfg());
      setSelectedDepartamento(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error al obtener detalles:", err);
      alert("No se pudieron cargar los detalles.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDepartamento(null);
  };

  /* ==========================
     SUBDEPARTAMENTOS MODAL
  ========================== */

  const resetSubForm = () => {
    setSubFormMode("create");
    setSubEditingId(null);
    setSubNombre("");
    setSubAbreviatura("");
  };

  const refreshSelectedDepartamento = useCallback(async (departamentoId) => {
    if (!departamentoId) return;
    const res = await axios.get(`${URI}/${departamentoId}`, axiosCfg());
    setSelectedDepartamento(res.data);

    const list = Array.isArray(res.data?.subDepartamentos) ? res.data.subDepartamentos : [];
    setSubList(list);
  }, []);

  const openSubModal = async (dep) => {
    const id = getIdSafe(dep);
    if (!id) return;

    try {
      setSubError(null);
      setSubLoading(true);
      resetSubForm();

      const res = await axios.get(`${URI}/${id}`, axiosCfg());
      setSelectedDepartamento(res.data);

      const list = Array.isArray(res.data?.subDepartamentos) ? res.data.subDepartamentos : [];
      setSubList(list);

      setShowSubModal(true);
    } catch (err) {
      console.error("openSubModal:", err);
      setSubError(err);
      alert("No se pudieron cargar los subdepartamentos.");
    } finally {
      setSubLoading(false);
    }
  };

  const closeSubModal = () => {
    setShowSubModal(false);
    setSubError(null);
    setSubLoading(false);
    resetSubForm();
  };

  const startEditSub = (sub) => {
    setSubFormMode("edit");
    setSubEditingId(sub?.id ?? null);
    setSubNombre(sub?.nombre ?? "");
    setSubAbreviatura(sub?.abreviatura ?? "");
  };

  const cancelEditSub = () => {
    resetSubForm();
  };

  const submitSub = async (e) => {
    e?.preventDefault?.();

    const departamentoId = getIdSafe(selectedDepartamento);
    if (!departamentoId) return;

    const nombre = normalize(subNombre);
    const abreviatura = normalizeUpper(subAbreviatura);

    if (!nombre) return alert("El nombre del subdepartamento es obligatorio.");
    if (!abreviatura) return alert("La abreviatura del subdepartamento es obligatoria.");

    try {
      setSubSubmitting(true);

      if (subFormMode === "create") {
        await axios.post(SUB_URI, { nombre, abreviatura, departamentoId, activo: true }, axiosCfg());
      } else {
        if (!subEditingId) return alert("ID de subdepartamento inválido.");
        await axios.put(`${SUB_URI}/${subEditingId}`, { nombre, abreviatura }, axiosCfg());
      }

      await refreshSelectedDepartamento(departamentoId);
      resetSubForm();
    } catch (err) {
      console.error("submitSub:", err);
      const msg = err?.response?.data?.error || "No se pudo guardar el subdepartamento.";
      alert(msg);
    } finally {
      setSubSubmitting(false);
    }
  };

  const toggleSubEstado = async (sub) => {
    const id = sub?.id;
    if (!id) return;

    try {
      await axios.patch(`${SUB_URI}/${id}/estado`, { activo: !sub.activo }, axiosCfg());
      const departamentoId = getIdSafe(selectedDepartamento);
      await refreshSelectedDepartamento(departamentoId);
    } catch (err) {
      console.error("toggleSubEstado:", err);
      alert("No se pudo cambiar el estado del subdepartamento.");
    }
  };

  /* ==========================
     EXPORTS (PDF/EXCEL con subdepartamentos + estados)
  ========================== */

  const flattenForReports = (deps) => {
    const rows = [];
    (deps || []).forEach((d) => {
      const depNombre = d?.nombre ?? "—";
      const depAbrev = d?.abreviatura ?? "—";
      const depEstado = d?.activo ? "Activo" : "Inactivo";
      const subs = Array.isArray(d?.subDepartamentos) ? d.subDepartamentos : [];

      if (!subs.length) {
        rows.push({
          depNombre,
          depAbrev,
          depEstado,
          subNombre: "—",
          subAbrev: "—",
          subEstado: "—",
        });
        return;
      }

      subs.forEach((s) => {
        rows.push({
          depNombre,
          depAbrev,
          depEstado,
          subNombre: s?.nombre ?? "—",
          subAbrev: s?.abreviatura ?? "—",
          subEstado: s?.activo ? "Activo" : "Inactivo",
        });
      });
    });
    return rows;
  };

  const downloadGeneralPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Listado de Departamentos y Subdepartamentos", 20, 20);

    const rows = flattenForReports(filteredDepartamentos);

    autoTable(doc, {
      head: [["Departamento", "Abrev.", "Estado", "Subdepartamento", "Abrev.", "Estado"]],
      body: rows.map((r) => [r.depNombre, r.depAbrev, r.depEstado, r.subNombre, r.subAbrev, r.subEstado]),
      startY: 30,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [95, 125, 156] },
    });

    doc.save("departamentos_y_subdepartamentos.pdf");
  };

  const downloadGeneralExcel = () => {
    const rows = flattenForReports(filteredDepartamentos);

    const data = rows.map((r) => ({
      Departamento: r.depNombre,
      "Abrev. Dep": r.depAbrev,
      "Estado Dep": r.depEstado,
      Subdepartamento: r.subNombre,
      "Abrev. Sub": r.subAbrev,
      "Estado Sub": r.subEstado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, "departamentos_y_subdepartamentos.xlsx");
  };

  const subCountLabel = useMemo(() => {
    const list = Array.isArray(selectedDepartamento?.subDepartamentos)
      ? selectedDepartamento.subDepartamentos
      : subList;
    const total = list?.length || 0;
    const activos = (list || []).filter((s) => s?.activo).length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [selectedDepartamento?.subDepartamentos, subList]);

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Cargando...
          </td>
        </tr>
      );
    }

    if (error?.response?.status === 403) {
      return (
        <tr>
          <td colSpan="4" className="text-center text-danger py-4">
            No tiene permisos para ver esta sección.
          </td>
        </tr>
      );
    }

    if (error?.response?.status === 401) {
      return (
        <tr>
          <td colSpan="4" className="text-center text-muted py-4">
            Sesión expirada o no autenticado.{" "}
            <button className="btn btn-link p-0" onClick={handleLogout}>
              Inicie sesión de nuevo
            </button>
            .
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan="4" className="text-center text-muted py-4">
            Ocurrió un error al cargar los departamentos.
          </td>
        </tr>
      );
    }

    if (!currentDepartamentos.length) {
      return (
        <tr>
          <td colSpan="4" className="text-center text-muted py-4">
            Sin resultados
          </td>
        </tr>
      );
    }

    return currentDepartamentos.map((d) => {
      const id = getIdSafe(d);

      return (
        <tr key={id ?? `${d.nombre}-${Math.random()}`}>
          <td>{d.nombre ?? "—"}</td>
          <td>{d.abreviatura ?? "—"}</td>
          <td>
            {d.activo ? (
              <span className="badge bg-success me-2">Activo</span>
            ) : (
              <span className="badge bg-secondary me-2">Inactivo</span>
            )}
            {esAdmin && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => toggleEstado(d)}
                title="Cambiar estado"
              >
                Cambiar
              </button>
            )}
          </td>
          <td>
            <div className="departamento-acciones">
              <Button className="departamento-btn-accion" onClick={() => viewDepartamentoDetails(d)} title="Ver">
                <FaEye />
              </Button>

              <button
                className="departamento-btn-accion"
                onClick={() => id && navigate(`/departamentos-solicitantes/edit/${id}`)}
                title="Editar"
                type="button"
                disabled={!id}
              >
                <FaEdit />
              </button>

              <Button className="departamento-btn-accion" onClick={() => openSubModal(d)} title="Subdepartamentos">
                <FaLayerGroup />
              </Button>
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
        <div className="departamento-shell">
          <div className="departamento-top">
            <h2 className="departamento-title">DEPARTAMENTOS</h2>
            <div className="departamento-controls">
              <input
                type="text"
                className="form-control departamento-search"
                placeholder="Buscar por nombre o abreviatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={downloadGeneralPDF} className="departamento-btn-pdf">
                  PDF
                </Button>
                <Button onClick={downloadGeneralExcel} className="departamento-btn-excel">
                  Excel
                </Button>
              </div>
              <Link
                to="/departamentos-solicitantes/crear"
                className="btn departamento-btn-primary d-flex align-items-center gap-2"
                title="Crear nuevo departamento"
              >
                <i className="fa-solid fa-plus"></i>
                Crear Departamento
              </Link>
            </div>
          </div>

          <div className="card departamento-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="departamento-thead">
                  <tr>
                    <th onClick={() => sortDepartamentos("nombre")} style={{ cursor: "pointer" }}>
                      Nombre {renderSortArrow("nombre")}
                    </th>
                    <th onClick={() => sortDepartamentos("abreviatura")} style={{ cursor: "pointer" }}>
                      Abreviatura {renderSortArrow("abreviatura")}
                    </th>
                    <th>Estado</th>
                    <th style={{ width: 200 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>

            <div className="departamento-pagination">
              <nav className="d-flex justify-content-center">
                <ul className="pagination mb-0">
                  {/* Primera */}
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{
                        background: "#fff",
                        color: "var(--primaryColor)",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                      title="Primera página"
                    >
                      «
                    </button>
                  </li>

                  {/* Anterior */}
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        background: "#fff",
                        color: "var(--primaryColor)",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                      title="Página anterior"
                    >
                      ‹
                    </button>
                  </li>

                  {/* Números */}
                  {[...Array(Math.max(totalPages, 1))].map((_, index) => {
                    const page = index + 1;
                    const active = currentPage === page;

                    return (
                      <li key={page} className={`page-item ${active ? "active" : ""}`}>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className="page-link"
                          style={{
                            background: active ? "var(--primaryColor)" : "#fff",
                            color: active ? "#fff" : "var(--primaryColor)",
                            border: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}

                  {/* Siguiente */}
                  <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      style={{
                        background: "#fff",
                        color: "var(--primaryColor)",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                      title="Página siguiente"
                    >
                      ›
                    </button>
                  </li>

                  {/* Última */}
                  <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      style={{
                        background: "#fff",
                        color: "var(--primaryColor)",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                      title="Última página"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .departamento-shell{ padding: 10px 20px 20px 20px; }
        .departamento-top{ display:flex; flex-direction:column; align-items:center; margin: 10px 0 18px 0; }
        .departamento-title{ margin: 0; font-weight: 900; letter-spacing: 1px; color: var(--primaryColor); }
        .departamento-controls{
          width: min(1100px, 100%);
          margin-top: 14px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .departamento-search{
          max-width: 360px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          background: var(--inputColor);
        }
        .departamento-card{
          width: min(1050px, 100%);
          margin: 0 auto;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
        }
        .departamento-thead th{
          background: var(--primaryColor);
          color: var(--whiteColor);
          font-weight: 800;
          border-bottom: 0;
          white-space: nowrap;
        }
        .departamento-btn-primary{
          background: var(--primaryColor);
          border: none;
          color: #fff;
          font-weight: 800;
          border-radius: 12px;
          padding: 9px 14px;
        }
        .departamento-btn-primary:hover{ background: var(--hoverColor); color:#fff; }
        .departamento-btn-pdf{
          background: #b02a37;
          border: none;
          border-radius: 12px;
          font-weight: 800;
        }
        .departamento-btn-pdf:hover{ background: #8f1f2a; }
        .departamento-btn-excel{
          background: #198754;
          border: none;
          border-radius: 12px;
          font-weight: 800;
        }
        .departamento-pagination{
          padding: 12px 12px 16px 12px;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        .departamento-acciones{
          display:flex;
          gap: 10px;
          align-items:center;
          justify-content:flex-start;
        }
        .departamento-btn-accion{
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor: pointer;
          transition: transform .08s ease, background .15s ease;
          color: var(--primaryColor);
        }
        .departamento-btn-accion:hover{
          transform: translateY(-1px);
          background: rgba(95, 125, 156, 0.10);
        }

        @media (max-width: 576px){
          .departamento-shell{ padding: 10px; }
          .departamento-title{ font-size: 1.4rem; }
          .departamento-card{ width: 100%; }
        }

        .sub-badge{
          display:inline-flex;
          align-items:center;
          gap:6px;
          border: 1px solid rgba(0,0,0,0.08);
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.85rem;
          background: #fff;
        }
        .sub-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding: 10px 12px;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          background: #fff;
        }
        .sub-row + .sub-row{ margin-top: 10px; }
        .sub-left{ display:flex; flex-direction:column; line-height:1.15; }
        .sub-name{ font-weight: 900; color: var(--blackColor); }
        .sub-abrev{ font-size: .85rem; color: var(--mediumGrey); }
        .sub-actions{ display:flex; gap: 8px; align-items:center; }
        .sub-btn{
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          color: var(--primaryColor);
        }
        .sub-btn:hover{ background: rgba(95, 125, 156, 0.10); }
        .sub-btn.off{ color: #6c757d; }
        .sub-btn.danger{ color: #b02a37; }
      `}</style>

      {/* ==========================
          MODAL DETALLE DEPARTAMENTO
      ========================== */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <h5 className="modal-title">Detalle del Departamento</h5>
        </Modal.Header>

        <Modal.Body className="p-4">
          {selectedDepartamento ? (
            <>
              <table className="table table-borderless mb-3">
                <tbody>
                  <tr>
                    <td style={{ width: 140 }}><strong>Nombre</strong></td>
                    <td>{selectedDepartamento.nombre ?? "—"}</td>
                  </tr>
                  <tr>
                    <td><strong>Abreviatura</strong></td>
                    <td>{selectedDepartamento.abreviatura ?? "—"}</td>
                  </tr>
                  <tr>
                    <td><strong>Estado</strong></td>
                    <td>
                      {selectedDepartamento.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontWeight: 900, color: "var(--blackColor)" }} className="mb-2">
                Subdepartamentos
              </div>

              {Array.isArray(selectedDepartamento.subDepartamentos) && selectedDepartamento.subDepartamentos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Abreviatura</th>
                        <th style={{ width: 120 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDepartamento.subDepartamentos.map((sub) => (
                        <tr key={sub.id}>
                          <td>{sub.nombre ?? "—"}</td>
                          <td>{sub.abreviatura ?? "—"}</td>
                          <td>
                            {sub.activo ? (
                              <span className="badge bg-success">Activo</span>
                            ) : (
                              <span className="badge bg-secondary">Inactivo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted">Este departamento no tiene subdepartamentos.</div>
              )}
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center py-4 text-muted">
              <Spinner className="me-2" /> Cargando...
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-center border-top-0">
          <Button
            variant="outline-primary"
            onClick={() => {
              const id = getIdSafe(selectedDepartamento);
              if (id) navigate(`/departamentos-solicitantes/edit/${id}`);
              closeModal();
            }}
            style={{ borderRadius: 12, fontWeight: 800 }}
          >
            Editar
          </Button>

          <Button variant="outline-danger" onClick={closeModal} style={{ borderRadius: 12, fontWeight: 800 }}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==========================
          MODAL SUBDEPARTAMENTOS
      ========================== */}
      <Modal show={showSubModal} onHide={closeSubModal} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h5 className="modal-title mb-0">Subdepartamentos</h5>
            <small style={{ opacity: 0.9 }}>
              {selectedDepartamento?.nombre ? `Departamento: ${selectedDepartamento.nombre}` : "—"}
            </small>
          </div>
        </Modal.Header>

        <Modal.Body className="p-4">
          {subLoading ? (
            <div className="d-flex align-items-center justify-content-center py-4 text-muted">
              <Spinner className="me-2" /> Cargando...
            </div>
          ) : subError ? (
            <div className="text-danger">Ocurrió un error al cargar subdepartamentos.</div>
          ) : (
            <>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <div className="sub-badge">Total: {subCountLabel.total}</div>
                <div className="sub-badge">Activos: {subCountLabel.activos}</div>
                <div className="sub-badge">Inactivos: {subCountLabel.inactivos}</div>
              </div>

              <div className="card" style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ fontWeight: 900, color: "var(--blackColor)" }}>
                      {subFormMode === "create" ? "Crear subdepartamento" : "Editar subdepartamento"}
                    </div>
                    {subFormMode === "edit" && (
                      <Button variant="outline-secondary" onClick={cancelEditSub} style={{ borderRadius: 12, fontWeight: 800 }}>
                        Cancelar edición
                      </Button>
                    )}
                  </div>

                  <Form onSubmit={submitSub} className="mt-3">
                    <div className="row g-2">
                      <div className="col-md-7">
                        <Form.Label className="mb-1">Nombre</Form.Label>
                        <Form.Control
                          value={subNombre}
                          onChange={(e) => setSubNombre(e.target.value)}
                          placeholder="Ej: Soporte Técnico"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="col-md-5">
                        <Form.Label className="mb-1">Abreviatura</Form.Label>
                        <Form.Control
                          value={subAbreviatura}
                          onChange={(e) => setSubAbreviatura(e.target.value)}
                          placeholder="Ej: ST"
                          style={{ borderRadius: 12, textTransform: "uppercase" }}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        type="submit"
                        className="departamento-btn-primary"
                        disabled={subSubmitting}
                        style={{ borderRadius: 12, fontWeight: 900 }}
                      >
                        {subSubmitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" /> Guardando...
                          </>
                        ) : subFormMode === "create" ? (
                          <>
                            <FaPlus className="me-2" /> Crear
                          </>
                        ) : (
                          <>
                            <FaEdit className="me-2" /> Guardar cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>

              <div className="mt-3">
                {(subList || []).length === 0 ? (
                  <div className="text-muted">Este departamento no tiene subdepartamentos aún.</div>
                ) : (
                  (subList || []).map((sub) => (
                    <div key={sub.id} className="sub-row">
                      <div className="sub-left">
                        <div className="sub-name">
                          {sub.nombre}{" "}
                          {sub.activo ? (
                            <span className="badge bg-success ms-2">Activo</span>
                          ) : (
                            <span className="badge bg-secondary ms-2">Inactivo</span>
                          )}
                        </div>
                        <div className="sub-abrev">Abreviatura: {sub.abreviatura}</div>
                      </div>

                      <div className="sub-actions">
                        <button className="sub-btn" title="Editar" type="button" onClick={() => startEditSub(sub)}>
                          <FaEdit />
                        </button>

                        <button
                          className={`sub-btn ${sub.activo ? "" : "off"}`}
                          title={sub.activo ? "Inactivar" : "Activar"}
                          type="button"
                          onClick={() => toggleSubEstado(sub)}
                        >
                          {sub.activo ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-between border-top-0">
          <Button
            variant="outline-secondary"
            onClick={() => {
              const departamentoId = getIdSafe(selectedDepartamento);
              if (departamentoId) refreshSelectedDepartamento(departamentoId).catch(() => {});
            }}
            style={{ borderRadius: 12, fontWeight: 800 }}
          >
            Refrescar
          </Button>

          <Button variant="outline-danger" onClick={closeSubModal} style={{ borderRadius: 12, fontWeight: 800 }}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CompShowDepartamentoSolicitante;
