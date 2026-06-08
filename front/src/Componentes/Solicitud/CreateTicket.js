import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { FaPlus, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";

/* ===== API ===== */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ===== MODAL GENÉRICO ===== */
export function Modal({ title, onClose, children, maxWidth = 560 }) {
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
            style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <FaTimes />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===== FORMULARIO CREAR TICKET ===== */
const CrearTicketModal = ({ onClose, onSuccess, tipos }) => {
  const [form, setForm] = useState({
    oficina: "",
    extension: "",
    edificioId: "",
    nivelId: "",
    tipoTicketId: "",
    descripcion: "",
  });

  const [edificios, setEdificios] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [loadingEdificios, setLoadingEdificios] = useState(false);
  const [loadingNiveles, setLoadingNiveles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar edificios al montar el modal
  useEffect(() => {
    setLoadingEdificios(true);
    api.get("/edificios")
      .then(r => setEdificios(r.data || []))
      .catch(err => {
        console.error("Error al cargar edificios:", err);
        setError("No se pudieron cargar los edificios.");
      })
      .finally(() => setLoadingEdificios(false));
  }, []);

  // Cargar niveles cuando cambia el edificio
  const handleEdificioChange = async (e) => {
    const edificioId = e.target.value;
    setForm(f => ({ ...f, edificioId, nivelId: "" }));
    setNiveles([]);

    if (!edificioId) return;

    setLoadingNiveles(true);
    try {
      const { data } = await api.get("/niveles", { params: { edificioId } });
      setNiveles(data || []);
    } catch (err) {
      console.error("Error al cargar niveles:", err);
      setNiveles([]);
    } finally {
      setLoadingNiveles(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const { oficina, extension, edificioId, nivelId, tipoTicketId, descripcion } = form;

  if (!oficina.trim() || !extension.trim() || !edificioId || !nivelId || !tipoTicketId || !descripcion.trim()) {
    setError("Todos los campos son obligatorios.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    await api.post("/tickets", {
      oficina: oficina.trim(),
      extension: extension.trim(),
      id_edificio: Number(edificioId),
      id_nivel: Number(nivelId),
      tipoTicketId: Number(tipoTicketId),
      descripcion: descripcion.trim(),
      // NO enviamos solicitanteId ni createdByUserId → el backend usa el usuario del token
    });

    onSuccess();
  } catch (err) {
    console.error("Error al crear ticket:", err.response?.data || err);
    setError(
      err.response?.data?.error ||
      "Ocurrió un error al crear el ticket. Intenta nuevamente."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger small py-2 mb-3">
          <FaExclamationTriangle className="me-2" /> {error}
        </div>
      )}

      {/* Oficina + Extensión */}
      <div className="row g-3 mb-3">
        <div className="col-6">
          <div className="form-floating">
            <input
              name="oficina"
              value={form.oficina}
              onChange={handleChange}
              className="form-control modern-input"
              placeholder="Oficina"
              required
            />
            <label>Oficina *</label>
          </div>
        </div>
        <div className="col-6">
          <div className="form-floating">
            <input
              name="extension"
              value={form.extension}
              onChange={handleChange}
              className="form-control modern-input"
              placeholder="Extensión"
              required
            />
            <label>Extensión *</label>
          </div>
        </div>
      </div>

      {/* Edificio */}
      <div className="form-floating mb-3">
        <select
          name="edificioId"
          value={form.edificioId}
          onChange={handleEdificioChange}
          className="form-select modern-input"
          disabled={loadingEdificios}
          required
        >
          <option value="">Seleccionar edificio...</option>
          {edificios.map(e => (
            <option key={e.id_edificio} value={e.id_edificio}>
              {e.nombre}
            </option>
          ))}
        </select>
        <label>Edificio *</label>
      </div>

      {/* Nivel (solo si hay edificio seleccionado) */}
      {form.edificioId && (
        <div className="form-floating mb-3">
          <select
            name="nivelId"
            value={form.nivelId}
            onChange={handleChange}
            className="form-select modern-input"
            disabled={loadingNiveles}
            required
          >
            <option value="">Seleccionar nivel...</option>
            {niveles.map(n => (
              <option key={n.id_nivel} value={n.id_nivel}>
                {n.nombre}
              </option>
            ))}
          </select>
          <label>Nivel *</label>
        </div>
      )}

      {/* Tipo de Ticket */}
      <div className="form-floating mb-3">
        <select
          name="tipoTicketId"
          value={form.tipoTicketId}
          onChange={handleChange}
          className="form-select modern-input"
          required
        >
          <option value="">Seleccionar tipo...</option>
          {tipos.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <label>Tipo de Ticket *</label>
      </div>

      {/* Descripción */}
      <div className="form-floating mb-4">
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          className="form-control modern-input"
          placeholder="Describe el problema o solicitud..."
          style={{ height: 110 }}
          required
        />
        <label>Descripción *</label>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" />
              Creando...
            </>
          ) : (
            <>
              <FaPlus />
              Crear Ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CrearTicketModal;
