import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaEye, FaEdit, FaBan, FaCheck } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://10.21.25.54:3001';

const URI = `${API_BASE}/api/usuarios`;
const URI_DEPTOS = `${API_BASE}/api/departamentos-solicitantes`;

const CompShowUsuario = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usuariosPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('email');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [filterActivo, setFilterActivo] = useState('todos');
  const [filterDepartamento, setFilterDepartamento] = useState('todos'); // nuevo filtro
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Nuevos estados para departamentos
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Permisos por rol
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoaded, setPermsLoaded] = useState(false);

  const axiosCfg = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const getIdSafe = (u) => u?.id ?? u?.id_usuario ?? u?.idUsuario ?? null;

  // Cargar usuarios
  const getUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(URI, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError(err);
      setUsuarios([]);
      setFilteredUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar departamentos (nuevo)
  const getDepartamentos = useCallback(async () => {
    try {
      setLoadingDepts(true);
      const res = await axios.get(URI_DEPTOS, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      setDepartamentos(data.filter(d => d.activo === true));
    } catch (err) {
      console.error('Error al obtener departamentos:', err);
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => {
    getUsuarios();
    getDepartamentos(); // nuevo
  }, [getUsuarios, getDepartamentos]);

  // Filtro por departamento + búsqueda + activo
  useEffect(() => {
    let filtered = usuarios;

    // Búsqueda por email o nombre
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.email || '').toLowerCase().includes(term) ||
          (u.nombre || '').toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (filterActivo !== 'todos') {
      filtered = filtered.filter((u) =>
        filterActivo === 'activos' ? Boolean(u.activo) : !Boolean(u.activo)
      );
    }

    // Filtro por departamento
    if (filterDepartamento !== 'todos') {
      filtered = filtered.filter(
        (u) => String(u.departamentoSolicitanteId) === String(filterDepartamento)
      );
    }

    setFilteredUsuarios(filtered);
    setCurrentPage(1);
  }, [searchTerm, usuarios, filterActivo, filterDepartamento]);

  const sortUsuarios = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...filteredUsuarios].sort((a, b) => {
      const A = a[field];
      const B = b[field];
      if (field === 'activo') {
        const nA = Number(Boolean(A));
        const nB = Number(Boolean(B));
        return order === 'asc' ? nA - nB : nB - nA;
      }
      const sa = (A ?? '').toString().toLowerCase();
      const sb = (B ?? '').toString().toLowerCase();
      return order === 'asc' ? (sa < sb ? -1 : sa > sb ? 1 : 0) : (sa < sb ? 1 : sa > sb ? -1 : 0);
    });
    setFilteredUsuarios(sorted);
    setSortField(field);
    setSortOrder(order);
  };

  const renderSortArrow = (field) =>
    sortField === field ? <span className="ms-1">{sortOrder === 'asc' ? '↑' : '↓'}</span> : null;

  const indexOfLastUser = currentPage * usuariosPerPage;
  const indexOfFirstUser = indexOfLastUser - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsuarios.length / usuariosPerPage);

  const viewUsuarioDetails = (usuario) => {
    setSelectedUsuario(usuario);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUsuario(null);
  };

  const toggleActivoConfirmation = (usuario) => {
    setUserToToggle(usuario);
    setShowConfirmModal(true);
  };

  const handleToggleActivo = async () => {
    setShowConfirmModal(false);
    if (!userToToggle) return;
    const tid = getIdSafe(userToToggle);
    if (!tid) return;

    try {
      const nuevoEstado = userToToggle.activo ? 0 : 1;
      await axios.patch(`${URI}/${tid}/estado`, { activo: nuevoEstado }, axiosCfg());
      await getUsuarios();

      if (selectedUsuario && getIdSafe(selectedUsuario) === tid) {
        setSelectedUsuario({ ...selectedUsuario, activo: nuevoEstado });
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setUserToToggle(null);
    }
  };

  const downloadGeneralPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Listado de Usuarios', 20, 20);
    autoTable(doc, {
      head: [['Nombre', 'E-mail', 'Departamento', 'Subdepartamento', 'Estado']],
      body: filteredUsuarios.map((u) => [
        u.nombre ?? '—',
        u.email ?? '—',
        u.departamentoSolicitante?.nombre ?? '—',
        u.subDepartamentoSolicitante?.nombre ?? '—',
        Boolean(u.activo) ? 'Activo' : 'Inactivo',
      ]),
      startY: 30,
      theme: 'striped',
      styles: { fontSize: 10 },
    });
    doc.save('usuarios.pdf');
  };

  const downloadGeneralExcel = () => {
    const data = filteredUsuarios.map((u) => ({
      Nombre: u.nombre ?? '',
      Email: u.email ?? '',
      Departamento: u.departamentoSolicitante?.nombre ?? '',
      Subdepartamento: u.subDepartamentoSolicitante?.nombre ?? '',
      Estado: Boolean(u.activo) ? 'Activo' : 'Inactivo',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
    XLSX.writeFile(workbook, 'usuarios.xlsx');
  };

  const renderTableBody = () => {
    if (loading || loadingDepts) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Cargando...
          </td>
        </tr>
      );
    }
    if (error?.response?.status === 403) {
      return (
        <tr>
          <td colSpan="5" className="text-center text-danger py-4">
            No tiene permisos para ver esta sección.
          </td>
        </tr>
      );
    }
    if (error?.response?.status === 401) {
      return (
        <tr>
          <td colSpan="5" className="text-center text-muted py-4">
            Sesión expirada.{' '}
            <button className="btn btn-link p-0" onClick={handleLogout}>
              Inicie sesión
            </button>
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan="5" className="text-center text-muted py-4">
            Error al cargar los usuarios
          </td>
        </tr>
      );
    }
    if (!currentUsuarios.length) {
      return (
        <tr>
          <td colSpan="5" className="text-center text-muted py-4">
            Sin resultados
          </td>
        </tr>
      );
    }

    return currentUsuarios.map((u) => {
      const uid = getIdSafe(u);
      const isActivo = Boolean(u.activo);

      return (
        <tr key={uid ?? `${u.email}-${Math.random()}`}>
          <td>{u.nombre ?? '—'}</td>
          <td>{u.email ?? '—'}</td>
          <td>
            {u.departamentoSolicitante?.nombre ?? '—'}
            {u.departamentoSolicitante?.abreviatura && (
              <small className="text-muted d-block">({u.departamentoSolicitante.abreviatura})</small>
            )}
          </td>
          <td>
            {u.subDepartamentoSolicitante?.nombre ?? '—'}
            {u.subDepartamentoSolicitante?.abreviatura && (
              <small className="text-muted d-block">({u.subDepartamentoSolicitante.abreviatura})</small>
            )}
          </td>
          <td>
            <span className={`estado-badge ${isActivo ? 'activo' : 'inactivo'}`}>
              {isActivo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td>
            <div className="acciones">
              <Button
                className="btn-accion"
                onClick={() => viewUsuarioDetails(u)}
                title="Ver"
              >
                <FaEye />
              </Button>

              <button
                className="btn-accion"
                onClick={() => uid && navigate(`/usuarios/edit/${uid}`)}
                title="Editar"
                type="button"
                disabled={!uid}
              >
                <FaEdit />
              </button>

              <Button
                className={`btn-accion ${isActivo ? 'danger' : 'ok'}`}
                onClick={() => toggleActivoConfirmation(u)}
                title={isActivo ? 'Desactivar' : 'Activar'}
              >
                {isActivo ? <FaBan /> : <FaCheck />}
              </Button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bgColor)' }}>
      <Header onLogout={handleLogout} />

      <main className="container-fluid" style={{ paddingTop: 24 }}>
        <div className="usuarios-shell">
          <div className="usuarios-top">
            <h2 className="usuarios-title">USUARIOS</h2>

            <div className="usuarios-controls">
              <input
                type="text"
                className="form-control usuarios-search"
                placeholder="Buscar por correo o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="form-select usuarios-filter"
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>

              {/* Nuevo filtro por departamento */}
              <select
                className="form-select usuarios-filter"
                value={filterDepartamento}
                onChange={(e) => setFilterDepartamento(e.target.value)}
              >
                <option value="todos">Todos los departamentos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} {d.abreviatura ? `(${d.abreviatura})` : ''}
                  </option>
                ))}
              </select>

              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={downloadGeneralPDF} className="usuarios-btn-pdf">
                  PDF
                </Button>
                <Button onClick={downloadGeneralExcel} className="usuarios-btn-success">
                  Excel
                </Button>
                <Link
                  to="/usuarios/crear"
                  className="btn usuarios-btn-primary d-flex align-items-center gap-2"
                  title="Crear nuevo usuario"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Crear Usuario
                </Link>
              </div>
            </div>
          </div>

          <div className="card usuarios-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="usuarios-thead">
                  <tr>
                    <th onClick={() => sortUsuarios('nombre')} style={{ cursor: 'pointer' }}>
                      Nombre {renderSortArrow('nombre')}
                    </th>
                    <th onClick={() => sortUsuarios('email')} style={{ cursor: 'pointer' }}>
                      E-mail {renderSortArrow('email')}
                    </th>
                    <th style={{ minWidth: 180 }}>
                      Departamento
                    </th>
                    <th style={{ minWidth: 180 }}>
                      Subdepartamento
                    </th>
                    <th onClick={() => sortUsuarios('activo')} style={{ cursor: 'pointer', width: 140 }}>
                      Estado {renderSortArrow('activo')}
                    </th>
                    <th style={{ width: 260 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>

            <div className="usuarios-pagination">
              <nav className="d-flex justify-content-center">
                <ul className="pagination mb-0">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const active = currentPage === page;
                    return (
                      <li key={page} className={`page-item ${active ? 'active' : ''}`}>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className="page-link"
                          style={{
                            background: active ? 'var(--primaryColor)' : '#fff',
                            color: active ? '#fff' : 'var(--primaryColor)',
                            border: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de detalle */}
      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Modal.Header
          closeButton
          style={{
            backgroundColor: 'var(--primaryColor)',
            color: 'white',
            borderBottom: 'none',
          }}
        >
          <h5 className="modal-title">Detalle del Usuario</h5>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedUsuario ? (
            <table className="table table-borderless mb-0">
              <tbody>
                <tr>
                  <td style={{ width: 160 }}>
                    <strong>Nombre</strong>
                  </td>
                  <td>{selectedUsuario.nombre ?? '—'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Correo</strong>
                  </td>
                  <td>{selectedUsuario.email ?? '—'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Departamento</strong>
                  </td>
                  <td>
                    {selectedUsuario.departamentoSolicitante?.nombre ?? '—'}
                    {selectedUsuario.departamentoSolicitante?.abreviatura && (
                      <small className="text-muted d-block">
                        ({selectedUsuario.departamentoSolicitante.abreviatura})
                      </small>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Subdepartamento</strong>
                  </td>
                  <td>
                    {selectedUsuario.subDepartamentoSolicitante?.nombre ?? '—'}
                    {selectedUsuario.subDepartamentoSolicitante?.abreviatura && (
                      <small className="text-muted d-block">
                        ({selectedUsuario.subDepartamentoSolicitante.abreviatura})
                      </small>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Estado</strong>
                  </td>
                  <td>
                    <span
                      className={`estado-badge ${Boolean(selectedUsuario.activo) ? 'activo' : 'inactivo'}`}
                    >
                      {Boolean(selectedUsuario.activo) ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
              const sid = getIdSafe(selectedUsuario);
              if (sid) navigate(`/usuarios/edit/${sid}`);
              closeModal();
            }}
            style={{ borderRadius: 12, fontWeight: 800 }}
          >
            Editar
          </Button>
          <Button
            variant="outline-danger"
            onClick={closeModal}
            style={{ borderRadius: 12, fontWeight: 800 }}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header
          closeButton
          style={{ backgroundColor: 'var(--primaryColor)', color: 'white', borderBottom: 'none' }}
        >
          <Modal.Title>
            {Boolean(userToToggle?.activo) ? 'Desactivar Usuario' : 'Activar Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {`¿Seguro que deseas ${Boolean(userToToggle?.activo) ? 'desactivar' : 'activar'} este usuario?`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} style={{ border: 'none' }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleToggleActivo} style={{ border: 'none' }}>
            {Boolean(userToToggle?.activo) ? 'Desactivar' : 'Activar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Estilos (agregué algo para las nuevas columnas) */}
      <style>{`
        .usuarios-shell { padding: 10px 20px 20px 20px; }
        .usuarios-top { display:flex; flex-direction:column; align-items:center; margin: 10px 0 18px 0; }
        .usuarios-title { margin: 0; font-weight: 900; letter-spacing: 1px; color: var(--primaryColor); }
        .usuarios-controls {
          width: min(1100px, 100%);
          margin-top: 14px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .usuarios-search {
          max-width: 320px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          background: var(--inputColor);
        }
        .usuarios-filter {
          max-width: 170px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
        }
        .usuarios-card {
          width: min(1200px, 100%);
          margin: 0 auto;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
        }
        .usuarios-thead th {
          background: var(--primaryColor);
          color: var(--whiteColor);
          font-weight: 800;
          border-bottom: 0;
          white-space: nowrap;
        }
        .usuarios-btn-primary {
          background: var(--primaryColor);
          border: none;
          color: #fff;
          font-weight: 800;
          border-radius: 12px;
          padding: 9px 14px;
        }
        .usuarios-btn-primary:hover { background: var(--hoverColor); color:#fff; }
        .usuarios-btn-pdf {
          background: #b02a37;
          border: none;
          border-radius: 12px;
          font-weight: 800;
        }
        .usuarios-btn-pdf:hover { background: #8f1f2a; }
        .usuarios-btn-success {
          background: #198754;
          border: none;
          border-radius: 12px;
          font-weight: 800;
        }
        .usuarios-pagination {
          padding: 12px 12px 16px 12px;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .estado-badge {
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 900;
          font-size: .78rem;
          letter-spacing: .2px;
        }
        .estado-badge.activo {
          background: rgba(25,135,84,0.15);
          color: #0f5132;
          border: 1px solid rgba(25,135,84,0.35);
        }
        .estado-badge.inactivo {
          background: rgba(176,42,55,0.15);
          color: #842029;
          border: 1px solid rgba(176,42,55,0.35);
        }
        .acciones {
          display:flex;
          gap: 8px;
          align-items:center;
          justify-content:flex-start;
          flex-wrap: wrap;
        }
        .btn-accion {
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
          font-size: 1.1rem;
        }
        .btn-accion:hover {
          transform: translateY(-1px);
          background: rgba(95, 125, 156, 0.10);
        }
        .btn-accion.danger { color: #b02a37; }
        .btn-accion.danger:hover { background: rgba(176,42,55,0.10); }
        .btn-accion.ok { color: #198754; }
        .btn-accion.ok:hover { background: rgba(25,135,84,0.10); }
        @media (max-width: 576px) {
          .usuarios-shell { padding: 10px; }
          .usuarios-title { font-size: 1.4rem; }
          .usuarios-card { width: 100%; }
        }
      `}</style>
            <Footer />
    </div>
  );
};

export default CompShowUsuario;
