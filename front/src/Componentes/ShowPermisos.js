// Componentes/ShowPermisos.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spinner, Alert, Button, Modal, Form } from "react-bootstrap";
import { FaShieldAlt, FaKey, FaUserShield, FaTimes, FaPlus, FaArrowLeft, FaChevronDown, FaChevronRight } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from "./Header";
import Footer from "./Footer";

const API_URL = "http://10.21.25.54:3001/api";

const decodeJWT = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch { return null; }
};

const esAdminLogueado = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  const payload = decodeJWT(token);
  return payload?.rolId === 1 || payload?.rol_id === 1;
};

const obtenerModulo = (nombre) => {
  const t = nombre.toLowerCase();
  if (t.startsWith("ticket"))       return "Tickets";
  if (t.startsWith("usuario"))      return "Usuarios";
  if (t.startsWith("rol"))          return "Roles";
  if (t.startsWith("permiso"))      return "Permisos";
  if (t.startsWith("departamento")) return "Departamentos";
  if (t.startsWith("reporte"))      return "Reportes";
  if (t.startsWith("config"))       return "Configuración";
  return "General";
};

const CompShowPermisos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const esAdmin = esAdminLogueado();

  const [usuario,            setUsuario]            = useState(null);
  const [permisosDeRol,      setPermisosDeRol]      = useState([]);
  const [permisosDirectos,   setPermisosDirectos]   = useState([]);
  const [todosPermisos,      setTodosPermisos]      = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [mensajeExito,       setMensajeExito]       = useState(null);

  // Módulos expandidos — por defecto todos abiertos
  const [modulosAbiertos, setModulosAbiertos] = useState({});

  const [showModalRol,     setShowModalRol]     = useState(false);
  const [roles,            setRoles]            = useState([]);
  const [rolSeleccionado,  setRolSeleccionado]  = useState("");
  const [guardandoRol,     setGuardandoRol]     = useState(false);
  const [errorModalRol,    setErrorModalRol]    = useState(null);

  const [showModalPermisos,     setShowModalPermisos]     = useState(false);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [guardandoPermisos,     setGuardandoPermisos]     = useState(false);
  const [errorModalPermisos,    setErrorModalPermisos]    = useState(null);
  const [quitandoId,            setQuitandoId]            = useState(null);

  const axiosCfg = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const mostrarExito = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };


  const fetchTodo = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resEfectivos, resDirectos, resUsuario] = await Promise.all([
        axios.get(`${API_URL}/usuarios/${id}/permisos-efectivos`, axiosCfg()),
        axios.get(`${API_URL}/usuarios/${id}/permisos-directos`,  axiosCfg()),
        axios.get(`${API_URL}/usuarios/${id}`,                    axiosCfg()),
      ]);
      setUsuario({ ...resEfectivos.data.usuario, Rols: resUsuario.data?.Rols || [] });
      setPermisosDeRol(resEfectivos.data.detalle?.deRoles || []);
      setPermisosDirectos(resDirectos.data.permisosDirectos || []);
    } catch (err) {
      setError("No pudimos cargar los permisos en este momento.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodo();
    if (esAdmin) {
      axios.get(`${API_URL}/permisos`, axiosCfg())
        .then((r) => setTodosPermisos(r.data || []))
        .catch(console.error);
      axios.get(`${API_URL}/roles`, axiosCfg())
        .then((r) => setRoles(r.data.roles || r.data || []))
        .catch(console.error);
    }
  }, [id]);

  // Cuando cargan los permisos, inicializar todos los módulos como abiertos
  useEffect(() => {
    const todosLos = [
      ...permisosDeRol.map((n) => obtenerModulo(n)),
      ...permisosDirectos.map((p) => obtenerModulo(p.nombre)),
    ];
    const inicial = {};
    [...new Set(todosLos)].forEach((m) => { inicial[m] = true; });
    setModulosAbiertos(inicial);
  }, [permisosDeRol, permisosDirectos]);

  const toggleModulo = (modulo) =>
    setModulosAbiertos((prev) => ({ ...prev, [modulo]: !prev[modulo] }));

  const expandirTodos = () => {
    const nuevo = {};
    modulosOrdenados.forEach(([m]) => { nuevo[m] = true; });
    setModulosAbiertos(nuevo);
  };

  const colapsarTodos = () => {
    const nuevo = {};
    modulosOrdenados.forEach(([m]) => { nuevo[m] = false; });
    setModulosAbiertos(nuevo);
  };

  const guardarRol = async () => {
    if (!rolSeleccionado) { setErrorModalRol("Debes seleccionar un rol."); return; }
    try {
      setGuardandoRol(true);
      setErrorModalRol(null);
      await axios.patch(`${API_URL}/usuarios/${id}/rol`, { rolId: parseInt(rolSeleccionado, 10) }, axiosCfg());
      setShowModalRol(false);
      mostrarExito("Rol asignado correctamente.");
      await fetchTodo();
    } catch (err) {
      setErrorModalRol(err.response?.data?.error || "No se pudo guardar el rol.");
    } finally {
      setGuardandoRol(false);
    }
  };

  const guardarPermisosDirectos = async () => {
    if (permisosSeleccionados.length === 0) { setErrorModalPermisos("Selecciona al menos un permiso."); return; }
    try {
      setGuardandoPermisos(true);
      setErrorModalPermisos(null);
      for (const permisoId of permisosSeleccionados) {
        await axios.post(`${API_URL}/usuarios/${id}/permisos-directos`, { permisoId }, axiosCfg());
      }
      setShowModalPermisos(false);
      mostrarExito(`${permisosSeleccionados.length} permiso(s) asignado(s) correctamente.`);
      await fetchTodo();
    } catch (err) {
      setErrorModalPermisos(err.response?.data?.error || "No se pudieron guardar los permisos.");
    } finally {
      setGuardandoPermisos(false);
    }
  };

  const quitarPermiso = async (permisoId) => {
    try {
      setQuitandoId(permisoId);
      await axios.delete(`${API_URL}/usuarios/${id}/permisos-directos/${permisoId}`, axiosCfg());
      mostrarExito("Permiso removido correctamente.");
      await fetchTodo();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo quitar el permiso.");
    } finally {
      setQuitandoId(null);
    }
  };

  const togglePermiso = (permisoId) =>
    setPermisosSeleccionados((prev) =>
      prev.includes(permisoId) ? prev.filter((x) => x !== permisoId) : [...prev, permisoId]
    );

  const permisosDisponibles = todosPermisos.filter(
    (p) => !permisosDirectos.find((d) => d.id === p.id)
  );

  const agrupar = (lista, getNombre) =>
    lista.reduce((acc, item) => {
      const mod = obtenerModulo(getNombre(item));
      acc[mod] = acc[mod] || [];
      acc[mod].push(item);
      return acc;
    }, {});

  const todosLosPermisos = [
    ...permisosDeRol.map((nombre) => ({ nombre, tipo: "rol", id: null })),
    ...permisosDirectos.map((p) => ({ nombre: p.nombre, tipo: "directo", id: p.id })),
  ];

  const porModulo = todosLosPermisos.reduce((acc, p) => {
    const mod = obtenerModulo(p.nombre);
    acc[mod] = acc[mod] || [];
    acc[mod].push(p);
    return acc;
  }, {});

  const modulosOrdenados = Object.entries(porModulo).sort(([a], [b]) => a.localeCompare(b));
  const todosAbiertos = modulosOrdenados.every(([m]) => modulosAbiertos[m]);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "var(--bgColor)" }}>
      <Header />

      <main className="container-fluid" style={{ paddingTop: 24 }}>
        <div className="permisos-shell">

          {/* Título */}
          <div className="permisos-top">
            <h2 className="permisos-title">PERMISOS DE USUARIO</h2>

            <div className="permisos-controls">
              {usuario && (
                <div className="d-flex align-items-center gap-3 flex-wrap justify-content-center">
                  <div className="usuario-avatar">{usuario.nombre?.[0]?.toUpperCase() || "?"}</div>
                  <div className="text-center text-md-start">
                    <div className="fw-bold" style={{ color: "var(--primaryColor)" }}>{usuario.nombre}</div>
                    <div className="text-muted small">{usuario.email}</div>
                  </div>
                  <span className={`estado-badge ${usuario.activo ? "activo" : "inactivo"}`}>
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                  {usuario.Rols?.[0]?.nombre && (
                    <span className="rol-badge">{usuario.Rols[0].nombre}</span>
                  )}
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap justify-content-center mt-2">
                <Button className="permisos-btn-secondary" onClick={() => navigate("/usuarios")}>
                  <FaArrowLeft className="me-2" />Volver
                </Button>
                {esAdmin && (
                  <>
                    <Button className="permisos-btn-primary"
                      onClick={() => { setPermisosSeleccionados([]); setErrorModalPermisos(null); setShowModalPermisos(true); }}>
                      <FaPlus className="me-2" />Agregar Permisos
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {mensajeExito && (
            <Alert variant="success" className="mx-auto mb-3" style={{ maxWidth: 800 }} onClose={() => setMensajeExito(null)} dismissible>
              {mensajeExito}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="mx-auto mb-3" style={{ maxWidth: 800 }} onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {/* Contenido principal */}
          <div className="permisos-card-wrap">
            {loading ? (
              <div className="card permisos-card text-center py-5">
                <Spinner animation="border" size="sm" className="me-2" />Cargando permisos...
              </div>
            ) : todosLosPermisos.length === 0 ? (
              <div className="card permisos-card text-center text-muted py-5">
                <FaShieldAlt size={32} className="mb-2 d-block mx-auto" />
                Este usuario no tiene permisos asignados.
                {esAdmin && (
                  <div className="mt-3">
                    <Button className="permisos-btn-primary"
                      onClick={() => { setPermisosSeleccionados([]); setErrorModalPermisos(null); setShowModalPermisos(true); }}>
                      <FaPlus className="me-2" />Agregar permisos
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Barra de control expandir/colapsar */}
                <div className="d-flex justify-content-between align-items-center mb-3" style={{ width: "min(1100px, 100%)", margin: "0 auto 12px auto" }}>
                  <span className="text-muted small">
                    <strong>{modulosOrdenados.length}</strong> módulo(s) —
                    <FaShieldAlt className="ms-2 me-1 text-muted" style={{ fontSize: ".8rem" }} />{permisosDeRol.length} del rol
                    <FaKey className="ms-2 me-1" style={{ fontSize: ".8rem", color: "var(--primaryColor)" }} />{permisosDirectos.length} directos
                  </span>
                  <div className="d-flex gap-2">
                    <button className="btn-expandir" onClick={expandirTodos} disabled={todosAbiertos}>
                      Expandir todo
                    </button>
                    <button className="btn-expandir" onClick={colapsarTodos} disabled={!todosAbiertos}>
                      Colapsar todo
                    </button>
                  </div>
                </div>

                {/* Acordeón de módulos */}
                <div className="modulos-acordeon">
                  {modulosOrdenados.map(([modulo, perms]) => {
                    const abierto = modulosAbiertos[modulo] ?? true;
                    return (
                      <div key={modulo} className="modulo-bloque">

                        {/* Cabecera del módulo — clickeable */}
                        <div className="modulo-header" onClick={() => toggleModulo(modulo)}>
                          <div className="d-flex align-items-center gap-2">
                            {abierto
                              ? <FaChevronDown style={{ fontSize: ".8rem" }} />
                              : <FaChevronRight style={{ fontSize: ".8rem" }} />}
                            <span className="modulo-nombre">{modulo}</span>
                            <span className="modulo-count">{perms.length}</span>
                          </div>
                          <div className="d-flex gap-2">
                            {perms.filter((p) => p.tipo === "rol").length > 0 && (
                              <span className="modulo-mini-badge gris">
                                <FaShieldAlt className="me-1" />{perms.filter((p) => p.tipo === "rol").length} rol
                              </span>
                            )}
                            {perms.filter((p) => p.tipo === "directo").length > 0 && (
                              <span className="modulo-mini-badge azul">
                                <FaKey className="me-1" />{perms.filter((p) => p.tipo === "directo").length} directo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tabla de permisos del módulo */}
                        {abierto && (
                          <div className="modulo-body">
                            <table className="table table-hover align-middle mb-0">
                              <thead className="permisos-subthead">
                                <tr>
                                  <th>Permiso</th>
                                  <th style={{ width: 120 }}>Origen</th>
                                  {esAdmin && <th style={{ width: 80 }}>Acción</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {perms.map((p, i) => (
                                  <tr key={`${p.tipo}-${p.nombre}-${i}`}>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        {p.tipo === "rol"
                                          ? <FaShieldAlt className="text-muted" style={{ flexShrink: 0 }} />
                                          : <FaKey style={{ color: "var(--primaryColor)", flexShrink: 0 }} />}
                                        <span className="fw-semibold">{p.nombre}</span>
                                      </div>
                                    </td>
                                    <td>
                                      {p.tipo === "rol"
                                        ? <span className="origen-badge rol">Rol</span>
                                        : <span className="origen-badge directo">Directo</span>}
                                    </td>
                                    {esAdmin && (
                                      <td>
                                        {p.tipo === "directo" && (
                                          <button className="btn-accion danger"
                                            title="Quitar permiso"
                                            onClick={() => quitarPermiso(p.id)}
                                            disabled={quitandoId === p.id}>
                                            {quitandoId === p.id
                                              ? <Spinner animation="border" size="sm" />
                                              : <FaTimes />}
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Modal cambiar rol ── */}
      <Modal show={showModalRol} onHide={() => setShowModalRol(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 800 }}>
            <FaUserShield className="me-2" />Asignar Rol a {usuario?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {errorModalRol && <Alert variant="danger" className="small py-2">{errorModalRol}</Alert>}
          <p className="text-muted small mb-3">El rol define el conjunto base de permisos del usuario.</p>
          <Form.Group>
            <Form.Label className="fw-bold small">Rol</Form.Label>
            {roles.length === 0
              ? <div className="text-muted small"><Spinner animation="border" size="sm" className="me-2" />Cargando roles...</div>
              : <Form.Select className="modern-select" value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value)}>
                  <option value="">— Selecciona un rol —</option>
                  {roles.map((r) => <option key={r.id} value={r.id.toString()}>{r.nombre}</option>)}
                </Form.Select>
            }
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button className="permisos-btn-secondary" onClick={() => setShowModalRol(false)}>Cancelar</Button>
          <Button className="permisos-btn-primary" onClick={guardarRol} disabled={guardandoRol || !rolSeleccionado}>
            {guardandoRol ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal asignar permisos directos ── */}
      <Modal show={showModalPermisos} onHide={() => setShowModalPermisos(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: "var(--primaryColor)", color: "white", borderBottom: "none" }}>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 800 }}>
            <FaKey className="me-2" />Agregar Permisos Directos a {usuario?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {errorModalPermisos && <Alert variant="danger" className="small py-2">{errorModalPermisos}</Alert>}
          <p className="text-muted small mb-3">Selecciona los permisos que deseas asignar directamente a este usuario.</p>

          {permisosDisponibles.length === 0 ? (
            <div className="text-center py-4 text-muted">
              El usuario ya tiene todos los permisos disponibles asignados directamente.
            </div>
          ) : (
            Object.entries(agrupar(permisosDisponibles, (p) => p.nombre))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([mod, perms]) => (
                <div key={mod} className="mb-4">
                  <div className="permisos-modulo-header">{mod}</div>
                  <div className="row g-2">
                    {perms.map((p) => {
                      const sel = permisosSeleccionados.includes(p.id);
                      return (
                        <div key={p.id} className="col-md-6">
                          <div className={`permiso-item ${sel ? "selected" : ""}`} onClick={() => togglePermiso(p.id)}>
                            <div className={`permiso-check ${sel ? "checked" : ""}`}>{sel && <span>✓</span>}</div>
                            <div>
                              <div className="small fw-bold">{p.nombre}</div>
                              {p.descripcion && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{p.descripcion}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 justify-content-between">
          <span className="text-muted small">
            {permisosSeleccionados.length > 0 ? `${permisosSeleccionados.length} seleccionado(s)` : "Ninguno seleccionado"}
          </span>
          <div className="d-flex gap-2">
            <Button className="permisos-btn-secondary" onClick={() => setShowModalPermisos(false)}>Cancelar</Button>
            <Button className="permisos-btn-primary" onClick={guardarPermisosDirectos}
              disabled={guardandoPermisos || permisosSeleccionados.length === 0}>
              {guardandoPermisos
                ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</>
                : `Asignar${permisosSeleccionados.length > 0 ? ` (${permisosSeleccionados.length})` : ""}`}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <style>{`
        .permisos-shell { padding: 10px 20px 20px 20px; }
        .permisos-top { display:flex; flex-direction:column; align-items:center; margin: 10px 0 18px 0; }
        .permisos-title { margin:0; font-weight:900; letter-spacing:1px; color:var(--primaryColor); }
        .permisos-controls { width:min(1100px,100%); margin-top:14px; display:flex; flex-direction:column; gap:10px; align-items:center; }

        .usuario-avatar {
          width:52px; height:52px; border-radius:50%;
          background:var(--primaryColor); color:white;
          font-size:1.4rem; font-weight:900;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .permisos-card-wrap { width:min(1100px,100%); margin:0 auto; }

        /* ── Acordeón de módulos ── */
        .modulos-acordeon { display:flex; flex-direction:column; gap:10px; }

        .modulo-bloque {
          border:1px solid rgba(0,0,0,0.08);
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 4px 14px rgba(0,0,0,0.06);
        }

        .modulo-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:12px 18px;
          background:var(--primaryColor);
          color:white;
          cursor:pointer;
          user-select:none;
          transition:background .15s;
        }
        .modulo-header:hover { filter:brightness(1.08); }

        .modulo-nombre { font-weight:900; font-size:.95rem; letter-spacing:.03em; }

        .modulo-count {
          background:rgba(255,255,255,0.25);
          color:white; font-size:.72rem; font-weight:800;
          padding:1px 8px; border-radius:999px; margin-left:6px;
        }

        .modulo-mini-badge {
          font-size:.7rem; font-weight:700;
          padding:2px 8px; border-radius:999px;
          display:flex; align-items:center; gap:3px;
        }
        .modulo-mini-badge.gris { background:rgba(255,255,255,0.18); color:white; }
        .modulo-mini-badge.azul { background:rgba(255,255,255,0.30); color:white; }

        .modulo-body { background:white; }

        .permisos-subthead th {
          background:#f1f3f5;
          color:#495057;
          font-weight:800;
          font-size:.8rem;
          border-bottom:1px solid rgba(0,0,0,0.08);
          text-transform:uppercase;
          letter-spacing:.04em;
        }

        /* Botones expandir/colapsar */
        .btn-expandir {
          background:#fff; border:1px solid rgba(0,0,0,0.12);
          color:#555; font-size:.78rem; font-weight:700;
          border-radius:8px; padding:4px 12px; cursor:pointer;
          transition:background .12s;
        }
        .btn-expandir:hover:not(:disabled) { background:#f0f0f0; }
        .btn-expandir:disabled { opacity:.4; cursor:not-allowed; }

        .estado-badge { display:inline-block; padding:4px 10px; border-radius:999px; font-weight:900; font-size:.75rem; }
        .estado-badge.activo { background:rgba(25,135,84,0.15); color:#0f5132; border:1px solid rgba(25,135,84,0.35); }
        .estado-badge.inactivo { background:rgba(176,42,55,0.15); color:#842029; border:1px solid rgba(176,42,55,0.35); }

        .rol-badge {
          display:inline-block; padding:4px 12px; border-radius:999px;
          font-weight:800; font-size:.75rem;
          background:rgba(13,110,253,0.12); color:#0a3d8f; border:1px solid rgba(13,110,253,0.25);
        }

        .origen-badge { display:inline-block; padding:3px 10px; border-radius:8px; font-size:.75rem; font-weight:800; }
        .origen-badge.rol { background:rgba(108,117,125,0.12); color:#495057; }
        .origen-badge.directo { background:rgba(13,110,253,0.12); color:#0a3d8f; }

        .btn-accion {
          width:34px; height:34px; border-radius:8px; border:1px solid rgba(0,0,0,0.08);
          background:#fff; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:transform .08s, background .12s;
          color:var(--primaryColor); font-size:.95rem;
        }
        .btn-accion:hover { transform:translateY(-1px); background:rgba(95,125,156,0.10); }
        .btn-accion.danger { color:#b02a37; }
        .btn-accion.danger:hover { background:rgba(176,42,55,0.10); }
        .btn-accion:disabled { opacity:.5; cursor:not-allowed; }

        .permisos-btn-primary { background:var(--primaryColor); border:none; color:#fff; font-weight:800; border-radius:12px; padding:8px 16px; }
        .permisos-btn-primary:hover { background:var(--hoverColor,#4a6a8a); color:#fff; }
        .permisos-btn-primary:disabled { opacity:.6; }
        .permisos-btn-secondary { background:#fff; border:1px solid rgba(0,0,0,0.15); color:#555; font-weight:800; border-radius:12px; padding:8px 16px; }
        .permisos-btn-secondary:hover { background:#f0f0f0; color:#333; }
        .permisos-btn-warning { background:#f59e0b; border:none; color:#fff; font-weight:800; border-radius:12px; padding:8px 16px; }
        .permisos-btn-warning:hover { background:#d97706; color:#fff; }

        .modern-select { border-radius:12px !important; border:1px solid rgba(0,0,0,0.12) !important; }
        .modern-select:focus { border-color:var(--primaryColor) !important; box-shadow:0 0 0 .2rem rgba(95,125,156,.18) !important; }

        .permisos-modulo-header {
          font-weight:900; font-size:.75rem; text-transform:uppercase;
          letter-spacing:.06em; color:var(--primaryColor);
          padding:4px 0 6px 0; border-bottom:2px solid var(--primaryColor); margin-bottom:8px;
        }

        .permiso-item {
          display:flex; align-items:flex-start; gap:10px; padding:8px 10px;
          border-radius:10px; border:1px solid rgba(0,0,0,0.08);
          background:#f8f9fa; cursor:pointer; transition:all .15s;
        }
        .permiso-item:hover { background:rgba(95,125,156,0.08); border-color:var(--primaryColor); }
        .permiso-item.selected { background:rgba(95,125,156,0.12); border-color:var(--primaryColor); }

        .permiso-check {
          width:18px; height:18px; border-radius:4px; border:2px solid #ccc;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; margin-top:2px; font-size:.7rem; font-weight:900; color:#fff; transition:all .15s;
        }
        .permiso-check.checked { background:var(--primaryColor); border-color:var(--primaryColor); }

        @media (max-width:576px) {
          .permisos-shell { padding:10px; }
          .permisos-title { font-size:1.4rem; }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default CompShowPermisos;
