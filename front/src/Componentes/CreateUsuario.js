// src/Componentes/CreateUsuario.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Spinner } from "react-bootstrap";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import Header from "./Header";
import Footer from "./Footer";
import useRol from "../Hooks/useerol.js";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const api = axios.create({ baseURL: `${API_BASE}/api`, withCredentials: true });

const ROLES_DISPONIBLES = [
  { value: "ADMIN",       label: "Administrador" },
  { value: "TECNICO",     label: "Técnico"       },
  { value: "SOLICITANTE", label: "Solicitante"   },
];

const DESCRIPCION_ROL = {
  ADMIN:       "Acceso total al sistema.",
  TECNICO:     "Recibe y gestiona los tickets asignados.",
  SOLICITANTE: "Puede crear y dar seguimiento a sus propios tickets. No requiere contraseña.",
};

const CompCreateUsuario = () => {
  const navigate = useNavigate();
  const { esAdmin } = useRol();

  const [nombre,          setNombre]          = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [rol,             setRol]             = useState("ADMIN");
  const [activo,          setActivo]          = useState(true);
  const [showPassword,    setShowPassword]    = useState(false);

  const [departamentoId,    setDepartamentoId]    = useState("");
  const [subDepartamentoId, setSubDepartamentoId] = useState("");
  const [departamentos,     setDepartamentos]     = useState([]);
  const [subDepartamentos,  setSubDepartamentos]  = useState([]);

  const [searchDepto,    setSearchDepto]    = useState("");
  const [searchSubDepto, setSearchSubDepto] = useState("");
  const [showDeptoList,  setShowDeptoList]  = useState(false);
  const [showSubList,    setShowSubList]    = useState(false);

  const [loading,      setLoading]      = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [error,        setError]        = useState(null);

  const axiosCfg = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  // ── Cargar departamentos ─────────────────────────────────────────────
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        setLoadingDepts(true);
        const res  = await api.get("/departamentos-solicitantes", axiosCfg);
        const data = Array.isArray(res.data) ? res.data : [];
        setDepartamentos(data.filter((d) => d.activo === true));
      } catch {
        setError("No se pudieron cargar los departamentos");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartamentos();
  }, [axiosCfg]);

  // ── Cargar subdepartamentos ──────────────────────────────────────────
  useEffect(() => {
    if (!departamentoId) {
      setSubDepartamentos([]);
      setSubDepartamentoId("");
      setSearchSubDepto("");
      return;
    }
    const fetchSub = async () => {
      try {
        const res     = await api.get(
          `/sub-departamentos-solicitantes?departamentoId=${departamentoId}`,
          axiosCfg
        );
        const activos = Array.isArray(res.data)
          ? res.data.filter((s) => s.activo === true)
          : [];
        setSubDepartamentos(activos);
        if (!activos.length) setSubDepartamentoId("");
      } catch {
        setSubDepartamentos([]);
        setSubDepartamentoId("");
      }
    };
    fetchSub();
  }, [departamentoId, axiosCfg]);

  // ── Filtros búsqueda ─────────────────────────────────────────────────
  const deptosFiltrados = useMemo(() => {
    const q = searchDepto.toLowerCase().trim();
    return !q
      ? departamentos
      : departamentos.filter(
          (d) =>
            (d.nombre || "").toLowerCase().includes(q) ||
            (d.abreviatura || "").toLowerCase().includes(q)
        );
  }, [departamentos, searchDepto]);

  const subDeptosFiltrados = useMemo(() => {
    const q = searchSubDepto.toLowerCase().trim();
    return !q
      ? subDepartamentos
      : subDepartamentos.filter(
          (s) =>
            (s.nombre || "").toLowerCase().includes(q) ||
            (s.abreviatura || "").toLowerCase().includes(q)
        );
  }, [subDepartamentos, searchSubDepto]);

  const tieneSubdepartamentos = subDepartamentos.length > 0;
  const esSolicitante         = rol === "SOLICITANTE";

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!esAdmin) {
      setError("Solo el administrador puede crear usuarios.");
      return;
    }
    if (!nombre.trim() || !email.trim()) {
      setError("Nombre y email son obligatorios.");
      return;
    }
    if (!esSolicitante && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body = {
        nombre:  nombre.trim(),
        email:   email.trim(),
        rol:     rol.toUpperCase(),
        activo,
        departamentoSolicitanteId:    departamentoId || null,
        subDepartamentoSolicitanteId: tieneSubdepartamentos
          ? subDepartamentoId || null
          : null,
      };
      if (!esSolicitante) body.password = password;

      await api.post("/usuarios", body, axiosCfg);
      navigate("/usuarios");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error al crear el usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="d-flex flex-column min-vh-100 create-page">
      <Header />

      <main className="flex-grow-1 d-flex justify-content-center align-items-center px-3 py-4">
        <div className="card shadow-sm border-0 rounded-4 p-4 create-card">

          {/* Cabecera */}
          <div className="text-center mb-4">
            <div className="icon-circle mb-3">
              <FaUserPlus className="icon-user" />
            </div>
            <h3 className="fw-bold mb-1">Crear Usuario</h3>
            <p className="text-muted small mb-0">
              Completa la información para registrar un nuevo usuario
            </p>
          </div>

          {/* Sin permisos */}
          {!esAdmin && (
            <div className="alert alert-warning text-center small py-2 mb-3">
              No tiene permisos para crear usuarios.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-danger text-center small py-2 mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Rol ── */}
            <div className="mb-3">
              <label className="form-label small text-muted fw-semibold">Rol</label>
              <select
                className="form-select modern-input"
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value);
                  if (e.target.value === "SOLICITANTE") setPassword("");
                }}
                disabled={!esAdmin || loading}
              >
                {ROLES_DISPONIBLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {DESCRIPCION_ROL[rol] && (
                <small className="text-muted d-block mt-1">
                  {DESCRIPCION_ROL[rol]}
                </small>
              )}
            </div>

            {/* ── Nombre ── */}
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control modern-input"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={!esAdmin || loading}
              />
              <label>Nombre</label>
            </div>

            {/* ── Email ── */}
<div className="form-floating mb-3">
  <input
    type="email"
    className="form-control modern-input"
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    disabled={!esAdmin || loading}
    autoComplete="off"
  />
  <label>Email</label>
</div>

            {/* ── Contraseña (no aplica para SOLICITANTE) ── */}
            {!esSolicitante && (
<div className="form-floating mb-3 position-relative">
  <input
    type={showPassword ? "text" : "password"}
    className="form-control modern-input pe-5"
    placeholder="Contraseña"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    minLength={6}
    required
    disabled={!esAdmin || loading}
    autoComplete="new-password"
  />
  <label>Contraseña</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!esAdmin || loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            )}

            {/* ── Departamento ── */}
            <div className="mb-3">
              <label className="form-label small text-muted fw-semibold">
                Departamento Solicitante
              </label>
              {loadingDepts ? (
                <div className="text-center py-2">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : departamentos.length === 0 ? (
                <div className="alert alert-info small py-2 mb-2">
                  No hay departamentos activos registrados
                </div>
              ) : (
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="Escribe para buscar o selecciona..."
                    value={searchDepto}
                    onChange={(e) => setSearchDepto(e.target.value)}
                    onFocus={() => {
                      setShowDeptoList(true);
                      if (!searchDepto.trim()) setSearchDepto("");
                    }}
                    onBlur={() => setTimeout(() => setShowDeptoList(false), 200)}
                    disabled={!esAdmin || loading}
                  />
                  {showDeptoList && (
                    <ul
                      className="list-group position-absolute w-100 mt-1 shadow-sm"
                      style={{
                        maxHeight: 240, overflowY: "auto", zIndex: 1050,
                        background: "#fff", borderRadius: 12,
                        border: "1px solid #ced4da",
                      }}
                    >
                      {deptosFiltrados.length === 0 ? (
                        <li className="list-group-item text-muted text-center py-3">
                          No se encontraron departamentos
                        </li>
                      ) : (
                        deptosFiltrados.map((d) => (
                          <li
                            key={d.id}
                            className="list-group-item list-group-item-action"
                            style={{ cursor: "pointer" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setDepartamentoId(d.id);
                              setSearchDepto(
                                d.nombre + (d.abreviatura ? ` (${d.abreviatura})` : "")
                              );
                              setShowDeptoList(false);
                            }}
                          >
                            {d.nombre}{d.abreviatura ? ` (${d.abreviatura})` : ""}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  {departamentoId && !searchDepto.trim() && (
                    <small className="text-primary d-block mt-1">
                      Seleccionado:{" "}
                      {departamentos.find((d) => d.id === departamentoId)?.nombre || ""}
                    </small>
                  )}
                </div>
              )}
            </div>

            {/* ── Subdepartamento ── */}
            {tieneSubdepartamentos && (
              <div className="mb-4">
                <label className="form-label small text-muted fw-semibold">
                  Subdepartamento (opcional)
                </label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="Escribe para buscar o selecciona..."
                    value={searchSubDepto}
                    onChange={(e) => setSearchSubDepto(e.target.value)}
                    onFocus={() => setShowSubList(true)}
                    onBlur={() => setTimeout(() => setShowSubList(false), 200)}
                    disabled={!esAdmin || loading}
                  />
                  {showSubList && (
                    <ul
                      className="list-group position-absolute w-100 mt-1 shadow-sm"
                      style={{
                        maxHeight: 240, overflowY: "auto", zIndex: 1050,
                        background: "#fff", borderRadius: 12,
                        border: "1px solid #ced4da",
                      }}
                    >
                      {subDeptosFiltrados.length === 0 ? (
                        <li className="list-group-item text-muted text-center py-3">
                          No se encontraron subdepartamentos
                        </li>
                      ) : (
                        subDeptosFiltrados.map((s) => (
                          <li
                            key={s.id}
                            className="list-group-item list-group-item-action"
                            style={{ cursor: "pointer" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSubDepartamentoId(s.id);
                              setSearchSubDepto(
                                s.nombre + (s.abreviatura ? ` (${s.abreviatura})` : "")
                              );
                              setShowSubList(false);
                            }}
                          >
                            {s.nombre}{s.abreviatura ? ` (${s.abreviatura})` : ""}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {departamentoId && !tieneSubdepartamentos && (
              <small className="text-muted d-block mb-4">
                Este departamento no tiene subdepartamentos registrados.
              </small>
            )}

            {/* ── Activo ── */}
            <div className="form-check form-switch mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="activoSwitch"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                disabled={!esAdmin || loading}
              />
              <label className="form-check-label" htmlFor="activoSwitch">
                {activo ? "Usuario Activo" : "Usuario Inactivo"}
              </label>
            </div>

            {/* ── Botones ── */}
            <div className="d-flex justify-content-between gap-2">
              <Button
                variant="outline-secondary"
                className="btn-cancel"
                onClick={() => navigate("/usuarios")}
                type="button"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !esAdmin || loadingDepts}
                className="px-4 fw-semibold btn-save"
              >
                {loading ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Guardando...</>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      <style>{`
        :root {
          --brandBlue: #5f7d9c;
          --brandBlueDark: #4f6b88;
          --pageBg: #eef2f6;
          --cardBorder: #e4ebf2;
        }
        .create-page { background: var(--pageBg); }
        .create-card {
          width: 100%; max-width: 520px;
          background: #fff;
          border: 1px solid var(--cardBorder);
          box-shadow: 0 12px 30px rgba(31,42,54,.10);
        }
        .icon-circle {
          width: 64px; height: 64px; margin: 0 auto;
          border-radius: 50%; background: var(--brandBlue);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 20px rgba(95,125,156,.25);
        }
        .icon-user { font-size: 24px; color: #fff; }
        .modern-input {
          border-radius: 12px !important;
          border: 1px solid #d9e3ee !important;
        }
        .modern-input:focus {
          border-color: rgba(95,125,156,.45) !important;
          box-shadow: 0 0 0 .2rem rgba(95,125,156,.18) !important;
        }
        .password-toggle {
          position: absolute; right: 15px; top: 50%;
          transform: translateY(-50%); border: none;
          background: transparent; color: #6c757d;
          font-size: 16px; cursor: pointer;
        }
        .password-toggle:hover { color: var(--brandBlue); }
        .btn-save {
          background: var(--brandBlue) !important;
          border: 1px solid var(--brandBlue) !important;
          border-radius: 12px !important;
        }
        .btn-save:hover {
          background: var(--brandBlueDark) !important;
          border-color: var(--brandBlueDark) !important;
        }
        .btn-cancel { border-radius: 12px !important; }
        .list-group-item:hover { background-color: #e9ecef !important; }
        .list-group-item-action:active { background-color: #dee2e6 !important; }
      `}</style>
    </div>
  );
};

export default CompCreateUsuario;
