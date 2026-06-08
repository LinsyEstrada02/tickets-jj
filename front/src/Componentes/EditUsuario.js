// src/Componentes/CompEditUsuario.js
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Spinner } from "react-bootstrap";
import { FaUserEdit, FaEye, FaEyeSlash } from "react-icons/fa";

import Header from "./Header";
import Footer from "./Footer";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

const CompEditUsuario = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nombre,          setNombre]          = useState("");
  const [email,           setEmail]           = useState("");
  const [activo,          setActivo]          = useState(true);
  const [newPassword,     setNewPassword]     = useState("");
  const [showPass,        setShowPass]        = useState(false);

  // Rol
  const [roles,           setRoles]           = useState([]);
  const [rolId,           setRolId]           = useState("");

  // Departamentos
  const [departamentoId,    setDepartamentoId]    = useState("");
  const [subDepartamentoId, setSubDepartamentoId] = useState("");
  const [searchDepto,       setSearchDepto]       = useState("");
  const [searchSubDepto,    setSearchSubDepto]    = useState("");
  const [showDeptoList,     setShowDeptoList]     = useState(false);
  const [showSubList,       setShowSubList]       = useState(false);
  const [departamentos,     setDepartamentos]     = useState([]);
  const [subDepartamentos,  setSubDepartamentos]  = useState([]);

  const [loading,      setLoading]      = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [exito,        setExito]        = useState(null);

  const axiosCfg = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  // Cargar usuario + departamentos + roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resUser, resDepts, resRoles] = await Promise.all([
          api.get(`/usuarios/${id}`, axiosCfg),
          api.get("/departamentos-solicitantes", axiosCfg),
          api.get("/roles", axiosCfg),
        ]);

        const u = resUser.data;
        setNombre(u?.nombre ?? "");
        setEmail(u?.email ?? "");
        setActivo(Boolean(u?.activo));
        setDepartamentoId(u?.departamentoSolicitanteId ?? "");
        setSubDepartamentoId(u?.subDepartamentoSolicitanteId ?? "");

        // Rol actual — viene en Rols[0].id (many-to-many) o en rolId (FK directo)
        const rolActual = u?.Rols?.[0]?.id ?? u?.rolId ?? "";
        setRolId(rolActual ? String(rolActual) : "");

        if (u?.departamentoSolicitante?.nombre) {
          setSearchDepto(
            u.departamentoSolicitante.nombre +
              (u.departamentoSolicitante.abreviatura ? ` (${u.departamentoSolicitante.abreviatura})` : "")
          );
        }
        if (u?.subDepartamentoSolicitante?.nombre) {
          setSearchSubDepto(
            u.subDepartamentoSolicitante.nombre +
              (u.subDepartamentoSolicitante.abreviatura ? ` (${u.subDepartamentoSolicitante.abreviatura})` : "")
          );
        }

        const dataDepts = Array.isArray(resDepts.data) ? resDepts.data : [];
        setDepartamentos(dataDepts.filter((d) => d.activo === true));

        const dataRoles = resRoles.data.roles || resRoles.data || [];
        setRoles(Array.isArray(dataRoles) ? dataRoles : []);

        if (u?.departamentoSolicitanteId) {
          const resSubs = await api.get(
            `/sub-departamentos-solicitantes?departamentoId=${u.departamentoSolicitanteId}`,
            axiosCfg
          );
          const dataSubs = Array.isArray(resSubs.data) ? resSubs.data : [];
          setSubDepartamentos(dataSubs.filter((s) => s.activo === true));
        }
      } catch (err) {
        setError(err?.response?.data?.error || err?.response?.data?.message || "Error al cargar datos.");
      } finally {
        setLoading(false);
        setLoadingDepts(false);
      }
    };

    if (id) fetchData();
    else { setError("ID inválido."); setLoading(false); setLoadingDepts(false); }
  }, [id, axiosCfg]);

  // Cargar subdepartamentos cuando cambia departamento
  useEffect(() => {
    if (!departamentoId) {
      setSubDepartamentos([]);
      setSubDepartamentoId("");
      setSearchSubDepto("");
      return;
    }
    const fetchSub = async () => {
      try {
        const res = await api.get(
          `/sub-departamentos-solicitantes?departamentoId=${departamentoId}`,
          axiosCfg
        );
        const data = Array.isArray(res.data) ? res.data : [];
        const activos = data.filter((s) => s.activo === true);
        setSubDepartamentos(activos);
        if (!activos.some((s) => s.id === subDepartamentoId)) {
          setSubDepartamentoId("");
          setSearchSubDepto("");
        }
      } catch {
        setSubDepartamentos([]);
        setSubDepartamentoId("");
        setSearchSubDepto("");
      }
    };
    fetchSub();
  }, [departamentoId, axiosCfg]);

  const deptosFiltrados = useMemo(() => {
    const q = searchDepto.toLowerCase().trim();
    if (!q) return departamentos;
    return departamentos.filter(
      (d) => (d.nombre || "").toLowerCase().includes(q) || (d.abreviatura || "").toLowerCase().includes(q)
    );
  }, [departamentos, searchDepto]);

  const subDeptosFiltrados = useMemo(() => {
    const q = searchSubDepto.toLowerCase().trim();
    if (!q) return subDepartamentos;
    return subDepartamentos.filter(
      (s) => (s.nombre || "").toLowerCase().includes(q) || (s.abreviatura || "").toLowerCase().includes(q)
    );
  }, [subDepartamentos, searchSubDepto]);

  const tieneSubdepartamentos = subDepartamentos.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) { setError("Nombre y Email son obligatorios."); return; }
    if (newPassword.trim().length > 0 && newPassword.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Actualizar datos básicos
      await api.put(
        `/usuarios/${id}`,
        {
          nombre: nombre.trim(),
          email: email.trim(),
          activo: Boolean(activo),
          departamentoSolicitanteId: departamentoId || null,
          subDepartamentoSolicitanteId: tieneSubdepartamentos ? (subDepartamentoId || null) : null,
        },
        axiosCfg
      );

      // 2. Cambiar rol si fue seleccionado
      if (rolId) {
        await api.patch(`/usuarios/${id}/rol`, { rolId: parseInt(rolId, 10) }, axiosCfg);
      }

      // 3. Cambiar contraseña si se proporcionó
      if (newPassword.trim().length > 0) {
        await api.patch(`/usuarios/${id}/password`, { newPassword: newPassword.trim() }, axiosCfg);
      }

      navigate("/usuarios");
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Error al actualizar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 edit-page">
      <Header />

      <main className="flex-grow-1 d-flex justify-content-center align-items-center px-3 py-4">
        <div className="card shadow-sm border-0 rounded-4 p-4 edit-card">
          <div className="text-center mb-4">
            <div className="icon-circle mb-3">
              <FaUserEdit className="icon-user" />
            </div>
            <h3 className="fw-bold mb-1">Editar Usuario</h3>
            <p className="text-muted small mb-0">Actualiza la información del usuario</p>
          </div>

          {error && <div className="alert alert-danger text-center small py-2 mb-3">{error}</div>}

          {loading || loadingDepts ? (
            <div className="text-center text-muted py-4">
              <Spinner animation="border" size="sm" className="me-2" />Cargando datos...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              {/* Nombre */}
              <div className="form-floating mb-3">
                <input type="text" className="form-control modern-input" placeholder="Nombre"
                  value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                <label>Nombre</label>
              </div>

              {/* Email */}
              <div className="form-floating mb-3">
                <input type="email" className="form-control modern-input" placeholder="Email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label>Email</label>
              </div>

              {/* Rol */}
              <div className="mb-3">
                <label className="form-label small text-muted">Rol</label>
                {roles.length === 0 ? (
                  <div className="text-muted small"><Spinner animation="border" size="sm" className="me-2" />Cargando roles...</div>
                ) : (
                  <select
                    className="form-select modern-input"
                    value={rolId}
                    onChange={(e) => setRolId(e.target.value)}
                  >
                    <option value="">— Sin rol asignado —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Contraseña */}
              <div className="mb-3">
                <label className="form-label small text-muted">Contraseña (opcional)</label>
                <div className="password-wrapper">
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-control password-input"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span className="password-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <small className="text-muted">Déjala vacía si no deseas cambiarla.</small>
              </div>

              {/* Departamento */}
              <div className="mb-3">
                <label className="form-label small text-muted">Departamento Solicitante</label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="Escribe para buscar o selecciona..."
                    value={searchDepto}
                    onChange={(e) => setSearchDepto(e.target.value)}
                    onFocus={() => { setShowDeptoList(true); if (!searchDepto.trim()) setSearchDepto(""); }}
                    onBlur={() => setTimeout(() => setShowDeptoList(false), 200)}
                  />
                  {showDeptoList && (
                    <ul className="list-group position-absolute w-100 mt-1 shadow-sm"
                      style={{ maxHeight: "240px", overflowY: "auto", zIndex: 1050, background: "#fff", borderRadius: "12px", border: "1px solid #ced4da" }}>
                      {deptosFiltrados.length === 0 ? (
                        <li className="list-group-item text-muted text-center py-3">No se encontraron departamentos</li>
                      ) : deptosFiltrados.map((d) => (
                        <li key={d.id} className="list-group-item list-group-item-action" style={{ cursor: "pointer" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDepartamentoId(d.id);
                            setSearchDepto(d.nombre + (d.abreviatura ? ` (${d.abreviatura})` : ""));
                            setShowDeptoList(false);
                          }}>
                          {d.nombre} {d.abreviatura ? `(${d.abreviatura})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Subdepartamento */}
              {tieneSubdepartamentos && (
                <div className="mb-4">
                  <label className="form-label small text-muted">Subdepartamento (opcional)</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control modern-input"
                      placeholder="Escribe para buscar o selecciona..."
                      value={searchSubDepto}
                      onChange={(e) => setSearchSubDepto(e.target.value)}
                      onFocus={() => setShowSubList(true)}
                      onBlur={() => setTimeout(() => setShowSubList(false), 200)}
                    />
                    {showSubList && (
                      <ul className="list-group position-absolute w-100 mt-1 shadow-sm"
                        style={{ maxHeight: "240px", overflowY: "auto", zIndex: 1050, background: "#fff", borderRadius: "12px", border: "1px solid #ced4da" }}>
                        {subDeptosFiltrados.length === 0 ? (
                          <li className="list-group-item text-muted text-center py-3">No se encontraron subdepartamentos</li>
                        ) : subDeptosFiltrados.map((s) => (
                          <li key={s.id} className="list-group-item list-group-item-action" style={{ cursor: "pointer" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSubDepartamentoId(s.id);
                              setSearchSubDepto(s.nombre + (s.abreviatura ? ` (${s.abreviatura})` : ""));
                              setShowSubList(false);
                            }}>
                            {s.nombre} {s.abreviatura ? `(${s.abreviatura})` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {departamentoId && !tieneSubdepartamentos && (
                <small className="text-muted d-block mb-4">Este departamento no tiene subdepartamentos registrados.</small>
              )}

              {/* Activo */}
              <div className="form-check form-switch mb-4">
                <input className="form-check-input modern-switch" type="checkbox"
                  checked={activo} onChange={() => setActivo((v) => !v)} id="switchActivo" />
                <label className="form-check-label" htmlFor="switchActivo">
                  {activo ? "Usuario Activo" : "Usuario Inactivo"}
                </label>
              </div>

              <div className="d-flex justify-content-between gap-2">
                <Button variant="outline-secondary" onClick={() => navigate("/usuarios")}
                  type="button" disabled={saving} className="btn-cancel">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="px-4 fw-semibold btn-save">
                  {saving ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar cambios"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        :root { --brandBlue:#5f7d9c; --brandBlueDark:#4f6b88; --pageBg:#eef2f6; }
        .edit-page { background:var(--pageBg); }
        .edit-card { width:100%; max-width:520px; background:#ffffff; box-shadow:0 12px 30px rgba(31,42,54,.10); }
        .icon-circle { width:64px; height:64px; margin:0 auto; border-radius:50%; background:var(--brandBlue); display:flex; align-items:center; justify-content:center; }
        .icon-user { font-size:24px; color:#ffffff; }
        .modern-input { border-radius:12px !important; }
        .password-wrapper { position:relative; }
        .password-input { background:#e9eef5 !important; border-radius:14px !important; border:none !important; padding-right:45px !important; }
        .password-input:focus { box-shadow:0 0 0 .2rem rgba(95,125,156,.18) !important; }
        .password-toggle { position:absolute; top:50%; right:15px; transform:translateY(-50%); cursor:pointer; color:#6c757d; font-size:15px; }
        .password-toggle:hover { color:var(--brandBlue); }
        .modern-switch:checked { background-color:var(--brandBlue) !important; border-color:var(--brandBlue) !important; }
        .btn-save { background:var(--brandBlue) !important; border-radius:12px !important; }
        .btn-save:hover { background:var(--brandBlueDark) !important; }
        .btn-cancel { border-radius:12px !important; }
        .list-group-item:hover { background-color:#e9ecef !important; }
        .list-group-item-action:active { background-color:#dee2e6 !important; }
      `}</style>
    </div>
  );
};

export default CompEditUsuario;
