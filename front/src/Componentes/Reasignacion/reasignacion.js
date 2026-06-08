import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaEye, FaUserCheck, FaHistory } from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://10.21.25.54:3001';

const URI_TICKETS = `${API_BASE}/api/tickets`;
const URI_USUARIOS = `${API_BASE}/api/usuarios`;

const PRIORIDAD_BADGE = {
  ALTA: { label: 'Alta', bg: 'rgba(255,149,0,0.15)', color: '#7d4800', border: 'rgba(255,149,0,0.35)' },
  MEDIA: { label: 'Media', bg: 'rgba(255,193,7,0.15)', color: '#664d03', border: 'rgba(255,193,7,0.35)' },
  BAJA: { label: 'Baja', bg: 'rgba(25,135,84,0.15)', color: '#0f5132', border: 'rgba(25,135,84,0.35)' },
  SIN_ASIGNAR: { label: 'Sin asignar', bg: 'rgba(108,117,125,0.15)', color: '#343a40', border: 'rgba(108,117,125,0.35)' },
};

const axiosCfg = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const CompReasignacionTickets = () => {
  const navigate = useNavigate();

  // Estados
  const [estados, setEstados] = useState([]);
  const [prioridades, setPrioridades] = useState([]);

  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todos');
  const [sortField, setSortField] = useState('fechaSolicitud');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const [showDetail, setShowDetail] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tecnicoSel, setTecnicoSel] = useState('');
  const [motivo, setMotivo] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  /* ── Cargar tickets ── */
  const getTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar prioridades
      axios.get(`${API_BASE}/api/prioridad-ticket`, axiosCfg())
        .then(res => setPrioridades(Array.isArray(res.data) ? res.data : []))
        .catch(() => setPrioridades([]));

      const params = new URLSearchParams({ page: 1, limit: 500 });
      if (filterEstado !== 'todos') params.append('estadoId', filterEstado);
      if (filterPrioridad !== 'todos') params.append('prioridad', filterPrioridad);

      const res = await axios.get(`${URI_TICKETS}?${params.toString()}`, axiosCfg());
      const data = res.data;

      let lista = Array.isArray(data.tickets) ? data.tickets : [];
      lista = lista.filter(t => t.tecnicoId && t.tecnico?.nombre);

      setTickets(lista);
      setFilteredTickets(lista);
    } catch (err) {
      console.error('Error al obtener tickets:', err);
      setError(err);
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterPrioridad]);

  /* ── Cargar técnicos ── */
  const getTecnicos = useCallback(async () => {
    try {
      setLoadingTecnicos(true);
      const res = await axios.get(URI_USUARIOS, axiosCfg());
      const data = Array.isArray(res.data) ? res.data : [];
      const soloTecnicos = data.filter(u =>
        u.activo !== false &&
        (u.rol?.nombre === 'TECNICO' || u.Rols?.some(r => r.nombre === 'TECNICO'))
      );
      setTecnicos(soloTecnicos);
    } catch (err) {
      console.error('Error al obtener técnicos:', err);
    } finally {
      setLoadingTecnicos(false);
    }
  }, []);

  useEffect(() => {
    getTickets();
    getTecnicos();
    axios.get(`${API_BASE}/api/estado-ticket`, axiosCfg())
      .then(res => setEstados(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEstados([]));
  }, [getTickets, getTecnicos]);

  /* ── Filtro local ── */
  useEffect(() => {
    let filtered = tickets;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.noSolicitud || '').toLowerCase().includes(term) ||
        (t.descripcion || '').toLowerCase().includes(term) ||
        (t.solicitante?.nombre || '').toLowerCase().includes(term) ||
        (t.tipoTicket?.nombre || '').toLowerCase().includes(term) ||
        (t.departamento?.nombre || '').toLowerCase().includes(term) ||
        (t.tecnico?.nombre || '').toLowerCase().includes(term)
      );
    }
    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [searchTerm, tickets]);

  /* ── Ordenamiento ── */
  const sortTickets = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...filteredTickets].sort((a, b) => {
      const va = (a[field] ?? '').toString().toLowerCase();
      const vb = (b[field] ?? '').toString().toLowerCase();
      return order === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
    });
    setFilteredTickets(sorted);
    setSortField(field);
    setSortOrder(order);
  };

  const renderSortArrow = (field) =>
    sortField === field ? <span className="ms-1">{sortOrder === 'asc' ? '↑' : '↓'}</span> : null;

  /* ── Paginación ── */
  const indexOfLast = currentPage * ticketsPerPage;
  const indexOfFirst = indexOfLast - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  /* ── Acciones ── */
  const openDetail = (ticket) => { setSelectedTicket(ticket); setShowDetail(true); };

  const openReassign = (ticket) => {
    setSelectedTicket(ticket);
    setTecnicoSel(ticket.tecnicoId ? String(ticket.tecnicoId) : '');
    setMotivo('');
    setShowReassign(true);
  };

  const openHistory = async (ticket) => {
    setSelectedTicket(ticket);
    setShowHistory(true);
    setLoadingHistory(true);
    setHistorial([]);
    try {
      const res = await axios.get(`${URI_TICKETS}/${ticket.id}/historial-reasignaciones`, axiosCfg());
      setHistorial(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setHistorial([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReassign = async () => {
    if (!tecnicoSel || !motivo.trim()) return;
    try {
      setSaving(true);
      await axios.patch(
        `${URI_TICKETS}/${selectedTicket.id}/reasignar-tecnico`,
        { tecnicoId: Number(tecnicoSel), motivo: motivo.trim() },
        axiosCfg()
      );
      await getTickets();
      setShowReassign(false);
      setSelectedTicket(null);
      setMotivo('');
    } catch (err) {
      console.error('Error al reasignar:', err);
      alert(err.response?.data?.error || 'Error al guardar la reasignación. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Exportar ── */
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reasignación de Tickets', 20, 20);
    autoTable(doc, {
      head: [['No. Solicitud', 'Tipo', 'Estado', 'Técnico Actual', 'Solicitante', 'Depto.']],
      body: filteredTickets.map(t => [
        t.noSolicitud ?? '—',
        t.tipoTicket?.nombre ?? '—',
        t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? '—',
        t.tecnico?.nombre ?? '—',
        t.solicitante?.nombre ?? '—',
        t.departamento?.abreviatura ?? t.departamento?.nombre ?? '—',
      ]),
      startY: 30, theme: 'striped', styles: { fontSize: 8 },
    });
    doc.save('reasignacion_tickets.pdf');
  };

  const downloadExcel = () => {
    const data = filteredTickets.map(t => ({
      'No. Solicitud': t.noSolicitud ?? '',
      'Tipo': t.tipoTicket?.nombre ?? '',
      'Estado': t.estadoTicket?.nombreVerboso ?? t.estadoTicket?.nombre ?? '',
      'Técnico Actual': t.tecnico?.nombre ?? '',
      'Correo Técnico': t.tecnico?.email ?? '',
      'Solicitante': t.solicitante?.nombre ?? '',
      'Departamento': t.departamento?.nombre ?? '',
      'Descripción': t.descripcion ?? '',
      'Fecha Solicitud': t.fechaSolicitud ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reasignaciones');
    XLSX.writeFile(wb, 'reasignacion_tickets.xlsx');
  };

  /* ── Helpers de render ── */
  const renderPrioridadBadge = (prioridad) => {
    const cfg = PRIORIDAD_BADGE[prioridad];
    if (!cfg) return <span className="text-muted">—</span>;
    return (
      <span style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: 999,
        fontWeight: 700, fontSize: '.75rem',
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      }}>
        {cfg.label}
      </span>
    );
  };

  const renderEstadoBadge = (estadoTicket, fueReabierto = false) => {
    if (!estadoTicket) return <span className="text-muted">—</span>;
    const nombre = estadoTicket.nombre ?? '';
    const label = estadoTicket.nombreVerboso ?? nombre;
    const estilos = {
      ABIERTO: { bg: 'rgba(13,110,253,0.12)', color: '#084298', border: 'rgba(13,110,253,0.30)' },
      EN_PROCESO: { bg: 'rgba(255,193,7,0.15)', color: '#664d03', border: 'rgba(255,193,7,0.35)' },
      RESUELTO: { bg: 'rgba(25,135,84,0.15)', color: '#0f5132', border: 'rgba(25,135,84,0.35)' },
      CERRADO: { bg: 'rgba(108,117,125,0.15)', color: '#343a40', border: 'rgba(108,117,125,0.35)' },
      ANULADO: { bg: 'rgba(176,42,55,0.15)', color: '#842029', border: 'rgba(176,42,55,0.35)' },
      REABIERTO: { bg: 'rgba(111,66,193,0.12)', color: '#6f42c1', border: 'rgba(111,66,193,0.3)' },
    };
    const cfg = estilos[nombre] ?? estilos.CERRADO;
    const rCfg = estilos.REABIERTO;
    const badgeStyle = {
      display: 'inline-block', padding: '4px 10px', borderRadius: 999,
      fontWeight: 700, fontSize: '.75rem', whiteSpace: 'nowrap',
    };

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  /* ── Tabla body ── */
  const renderTableBody = () => {
    if (loading || loadingTecnicos) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Cargando...
          </td>
        </tr>
      );
    }
    if (error) {
      return <tr><td colSpan="7" className="text-center text-muted py-4">Error al cargar los tickets.</td></tr>;
    }
    if (!currentTickets.length) {
      return <tr><td colSpan="7" className="text-center text-muted py-4">No hay tickets asignados con los filtros actuales.</td></tr>;
    }

    return currentTickets.map(ticket => (
      <tr key={ticket.id}>
        <td>
          <span style={{ fontWeight: 700, color: 'var(--primaryColor)' }}>
            {ticket.noSolicitud ?? `#${ticket.id}`}
          </span>
        </td>
        <td style={{ maxWidth: 220 }}>
          <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{ticket.tipoTicket?.nombre ?? '—'}</div>
          <small className="text-muted">
            {ticket.descripcion?.substring(0, 55)}{ticket.descripcion?.length > 55 ? '…' : ''}
          </small>
        </td>
        <td>{renderEstadoBadge(ticket.estadoTicket)}</td>
        <td>
          <div style={{ fontSize: '.88rem' }}>{ticket.solicitante?.nombre ?? '—'}</div>
          <small className="text-muted">{ticket.departamento?.abreviatura ?? ticket.departamento?.nombre ?? ''}</small>
        </td>
        <td>
          <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{ticket.tecnico?.nombre}</div>
          <small className="text-muted">{ticket.tecnico?.email ?? ''}</small>
        </td>
        <td style={{ whiteSpace: 'nowrap', fontSize: '.83rem', color: '#666' }}>
          {formatFecha(ticket.fechaSolicitud)}
        </td>
        <td>
          <div className="acciones d-flex gap-2" style={{ justifyContent: 'center' }}>
            <Button className="btn-accion" title="Ver detalle" onClick={() => openDetail(ticket)}>
              <FaEye />
            </Button>
            <Button
              className="btn-accion ok"
              title="Reasignar técnico"
              onClick={() => openReassign(ticket)}
              disabled={ticket.estadoTicket?.nombre?.toUpperCase() === 'ANULADO'}
            >
              <FaUserCheck />
            </Button>
            <Button
              className="btn-accion"
              title="Ver historial de reasignaciones"
              onClick={() => openHistory(ticket)}
            >
              <FaHistory />
            </Button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bgColor)' }}>
      <Header onLogout={handleLogout} />
      <main className="container-fluid" style={{ paddingTop: 24 }}>
        <div className="asign-shell">
          <div className="asign-top">
            <h2 className="asign-title">REASIGNACIÓN DE TICKETS</h2>
            <div style={{ fontSize: '.82rem', color: '#888', marginTop: 2 }}>
              {filteredTickets.length} tickets asignados
            </div>

            <div className="asign-controls">
              <input
                type="text"
                className="form-control asign-search"
                placeholder="Buscar por no. solicitud, solicitante..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />

              {/* Filtro Estado */}
              <select className="form-select asign-filter" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombreVerboso || estado.nombre}
                  </option>
                ))}
              </select>

              {/* Filtro Prioridad */}
              <select className="form-select asign-filter" value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)}>
                <option value="todos">Todas las prioridades</option>
                {prioridades
                  .filter(p => p.nombre?.toUpperCase() !== "SIN_ASIGNAR")
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombreVerboso || p.nombre}
                    </option>
                  ))}
              </select>

              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={getTickets} className="asign-btn-reload" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : '↻ Actualizar'}
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
                    <th onClick={() => sortTickets('noSolicitud')} style={{ cursor: 'pointer' }}>
                      No. Solicitud {renderSortArrow('noSolicitud')}
                    </th>
                    <th>Tipo / Descripción</th>
                    <th>Estado</th>
                    <th onClick={() => sortTickets('solicitanteId')} style={{ cursor: 'pointer' }}>
                      Solicitante {renderSortArrow('solicitanteId')}
                    </th>
                    <th>Técnico Actual</th>
                    <th onClick={() => sortTickets('fechaSolicitud')} style={{ cursor: 'pointer' }}>
                      Fecha {renderSortArrow('fechaSolicitud')}
                    </th>
                    <th style={{ width: 160, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="asign-pagination">
                <nav className="d-flex justify-content-center">
                  <ul className="pagination mb-0">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      const active = currentPage === page;
                      return (
                        <li key={page} className={`page-item ${active ? 'active' : ''}`}>
                          <button
                            onClick={() => setCurrentPage(page)}
                            className="page-link"
                            style={{
                              background: active ? 'var(--primaryColor)' : '#fff',
                              color: active ? '#fff' : 'var(--primaryColor)',
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
            )}
          </div>
        </div>
      </main>

      {/* Modal Detalle */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: 'var(--primaryColor)', color: 'white' }}>
          <h5>Detalle del Ticket</h5>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedTicket && (
            <table className="table table-borderless">
              <tbody>
                {[
                  ['No. Solicitud', selectedTicket.noSolicitud ?? `#${selectedTicket.id}`],
                  ['Tipo', selectedTicket.tipoTicket?.nombre ?? '—'],
                  ['Descripción', selectedTicket.descripcion ?? '—'],
                  ['Técnico Actual', selectedTicket.tecnico?.nombre ?? '—'],
                  ['Prioridad', renderPrioridadBadge(selectedTicket.prioridadTicket?.nombre)],
                  ['Estado', renderEstadoBadge(selectedTicket.estadoTicket)],
                  ['Solicitante', selectedTicket.solicitante?.nombre ?? '—'],
                  ['Fecha', formatFecha(selectedTicket.fechaSolicitud)],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ width: 190, fontWeight: 700 }}>{label}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { setShowDetail(false); openReassign(selectedTicket); }}>
            Reasignar Técnico
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Reasignar */}
      <Modal show={showReassign} onHide={() => setShowReassign(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--primaryColor)', color: 'white' }}>
          <Modal.Title>Reasignar Técnico</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedTicket && (
            <div className="mb-4 p-3 rounded-3 bg-light">
              <strong>{selectedTicket.noSolicitud}</strong><br />
              <small>{selectedTicket.tipoTicket?.nombre}</small><br />
              <small className="text-muted">Técnico actual: <strong>{selectedTicket.tecnico?.nombre}</strong></small>
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label><strong>Nuevo técnico</strong></Form.Label>
            {loadingTecnicos ? (
              <Spinner size="sm" />
            ) : (
              <Form.Select value={tecnicoSel} onChange={e => setTecnicoSel(e.target.value)}>
                <option value="">-- Seleccione un técnico --</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.email ? `— ${t.email}` : ''}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
          <Form.Group>
            <Form.Label><strong>Motivo de la reasignación <span className="text-danger">*</span></strong></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Explica brevemente por qué se está reasignando este ticket..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReassign(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleReassign}
            disabled={!tecnicoSel || !motivo.trim() || saving}
          >
            {saving ? <><Spinner size="sm" className="me-2" /> Guardando...</> : 'Confirmar Reasignación'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Historial */}
      <Modal show={showHistory} onHide={() => setShowHistory(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: 'var(--primaryColor)', color: 'white' }}>
          <Modal.Title>
            Historial de Reasignaciones — {selectedTicket?.noSolicitud}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {loadingHistory ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : historial.length === 0 ? (
            <div className="alert alert-info text-center">
              Este ticket aún no ha sido reasignado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {historial.map((h, i) => (
                <div key={i} className="rounded-3 p-3" style={{
                  border: '1px solid #e9ecef',
                  background: i === 0 ? 'rgba(13,110,253,0.04)' : '#fafafa',
                }}>
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div style={{ fontSize: '.8rem', color: '#888' }}>
                      🕐 {new Date(h.fechaReasignacion).toLocaleString('es-GT')}
                    </div>
                    {h.usuarioReasigno && (
                      <div style={{ fontSize: '.8rem', color: '#888' }}>
                        👤 Realizado por: <strong>{h.usuarioReasigno.nombre}</strong>
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                    <span className="badge" style={{
                      background: 'rgba(108,117,125,0.15)', color: '#343a40',
                      border: '1px solid rgba(108,117,125,0.3)', fontWeight: 700,
                    }}>
                      {h.tecnicoAnterior?.nombre ?? 'Sin asignar'}
                    </span>
                    <span style={{ color: '#adb5bd', fontSize: '1.1rem' }}>→</span>
                    <span className="badge" style={{
                      background: 'rgba(25,135,84,0.15)', color: '#0f5132',
                      border: '1px solid rgba(25,135,84,0.3)', fontWeight: 700,
                    }}>
                      {h.tecnicoNuevo?.nombre ?? '—'}
                    </span>
                  </div>
                  <div style={{
                    background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)',
                    borderRadius: 8, padding: '8px 12px', fontSize: '.88rem',
                  }}>
                    <strong>Motivo:</strong> {h.motivo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistory(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .asign-shell { padding: 10px 20px 20px 20px; }
        .asign-top { display: flex; flex-direction: column; align-items: center; margin: 10px 0 18px 0; }
        .asign-title { margin: 0; font-weight: 900; letter-spacing: 1px; color: var(--primaryColor); }
        .asign-controls { width: min(1300px, 100%); margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: center; }
        .asign-search, .asign-filter { max-width: 360px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); }
        .asign-card { width: min(1400px, 100%); margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 28px rgba(0,0,0,0.08); }
        .asign-thead th { background: var(--primaryColor); color: white; font-weight: 800; }
        .asign-btn-reload { background: #6c757d; border: none; border-radius: 12px; font-weight: 800; }
        .asign-btn-reload:hover { background: #5a6268; }
        .asign-btn-pdf { background: #b02a37; border: none; border-radius: 12px; font-weight: 800; }
        .asign-btn-pdf:hover { background: #8f1f2a; }
        .asign-btn-success { background: #198754; border: none; border-radius: 12px; font-weight: 800; }
        .asign-pagination { padding: 12px 12px 16px 12px; background: #fff; border-top: 1px solid rgba(0,0,0,0.06); }
        .acciones { display: flex; gap: 6px; }
        .btn-accion { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08)!important; background: white!important; color: var(--primaryColor)!important; display: flex; align-items: center; justify-content: center; padding: 0; }
        .btn-accion.ok { color: #198754!important; }
        .btn-accion:hover { transform: translateY(-1px); background: rgba(95,125,156,0.10)!important; }
      `}</style>

      <Footer />
    </div>
  );
};

export default CompReasignacionTickets;