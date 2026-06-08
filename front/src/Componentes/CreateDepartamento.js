// src/Componentes/CreateDepartamento.js
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Spinner } from "react-bootstrap";
import { FaPlusCircle, FaBuilding } from "react-icons/fa";

import Header from "./Header";
import Footer from "./Footer";

/* ===== Base URL ===== */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

/* ===== axios instance ===== */
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

/* ===== Helpers ===== */
function decodeJWT(token) {
  try {
    if (!token) return null;
    const base = token.split(".")[1];
    if (!base) return null;
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeRoleValue(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).toUpperCase().trim());
  if (typeof v === "object") {
    // por si viene como { nombre:"ADMIN" } o { role:"ADMIN" }
    const out = [];
    if (v.nombre) out.push(String(v.nombre).toUpperCase().trim());
    if (v.name) out.push(String(v.name).toUpperCase().trim());
    if (v.rol) out.push(String(v.rol).toUpperCase().trim());
    if (v.role) out.push(String(v.role).toUpperCase().trim());
    if (Array.isArray(v.roles))
      out.push(...v.roles.map((x) => String(x).toUpperCase().trim()));
    return out;
  }
  return [String(v).toUpperCase().trim()];
}

const CompCreateDepartamento = () => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [abreviatura, setAbreviatura] = useState("");
  const [activo, setActivo] = useState(true);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [permsLoaded, setPermsLoaded] = useState(false);

  const axiosCfg = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  /* ===== Verificar rol ADMIN desde TOKEN (y fallback user) ===== */
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const payload = decodeJWT(token);

      // fallback al user guardado
      let userObj = null;
      try {
        userObj = JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        userObj = null;
      }

      // posibles ubicaciones del rol
      const roles = [
        ...normalizeRoleValue(payload?.roles),
        ...normalizeRoleValue(payload?.rol),
        ...normalizeRoleValue(payload?.role),
        ...normalizeRoleValue(userObj?.roles),
        ...normalizeRoleValue(userObj?.rol),
        ...normalizeRoleValue(userObj?.role),
      ].filter(Boolean);

      const admin = roles.includes("ADMIN");
      setIsAdmin(admin);
    } finally {
      setPermsLoaded(true);
    }
  }, []);

  const normalizeAbrev = (val) => val.toUpperCase().replace(/\s+/g, " ").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("No tiene permisos para crear departamentos (solo ADMIN).");
      return;
    }

    const n = nombre.trim();
    const a = normalizeAbrev(abreviatura);

    if (!n || !a) {
      setError("Nombre y abreviatura son obligatorios.");
      return;
    }

    if (n.length > 191 || a.length > 191) {
      setError("Nombre o abreviatura demasiado largos (máx. 191 caracteres).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

  await api.post(
  "/departamentos-solicitantes",
  { 
    nombre: n, 
    abreviatura: a,
    activo 
  },
  axiosCfg
);


      navigate("/departamentos");
    } catch (err) {
      if (err?.response?.status === 403) {
        setError("No autorizado por el servidor. Verifique sus permisos.");
      } else {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error al crear el departamento.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 create-page">
      <Header />

      <main className="flex-grow-1 d-flex justify-content-center align-items-center px-3 py-4">
        <div className="card shadow-sm border-0 rounded-4 p-4 create-card">
          <div className="text-center mb-4">
            <div className="icon-circle mb-3">
              <FaBuilding className="icon-user" />
            </div>

            <h3 className="fw-bold mb-1">Crear Departamento</h3>
            <p className="text-muted small mb-0">
              Completa la información para registrar un nuevo departamento
            </p>
          </div>

          {!permsLoaded ? (
            <div className="text-center text-muted py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Verificando permisos...
            </div>
          ) : !isAdmin ? (
            <div className="alert alert-warning text-center small py-2 mb-3">
              No tiene permisos para crear departamentos (solo ADMIN).
            </div>
          ) : null}

          {error && (
            <div className="alert alert-danger text-center small py-2 mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control modern-input"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={!isAdmin || loading}
              />
              <label>Nombre</label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="text"
                className="form-control modern-input"
                placeholder="Abreviatura"
                value={abreviatura}
                onChange={(e) => setAbreviatura(e.target.value)}
                required
                disabled={!isAdmin || loading}
              />
              <label>Abreviatura</label>
              <div className="form-text">
                Se guardará en mayúsculas (ej. “TI”, “RRHH”, “SOP”).
              </div>
            </div>

            <div className="form-check form-switch mb-4">
  <input
    className="form-check-input"
    type="checkbox"
    role="switch"
    id="activoSwitch"
    checked={activo}
    onChange={(e) => setActivo(e.target.checked)}
    disabled={!isAdmin || loading}
  />
  <label className="form-check-label" htmlFor="activoSwitch">
    {activo ? "Activo" : "Inactivo"}
  </label>
</div>


            <div className="d-flex justify-content-between gap-2">
              <Button
                variant="outline-secondary"
                className="btn-cancel"
                onClick={() => navigate("/departamentos")}
                type="button"
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading || !isAdmin}
                className="px-4 fw-semibold btn-save"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaPlusCircle className="me-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      <style>{`
        :root{
          --brandBlue: #5f7d9c;
          --brandBlueDark: #4f6b88;
          --pageBg: #eef2f6;
          --cardBorder: #e4ebf2;
        }

        .create-page{
          background: var(--pageBg);
        }

        .create-card{
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border: 1px solid var(--cardBorder);
          box-shadow: 0 12px 30px rgba(31,42,54,.10);
        }

        .icon-circle{
          width: 64px;
          height: 64px;
          margin: 0 auto;
          border-radius: 50%;
          background: var(--brandBlue);
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow: 0 10px 20px rgba(95,125,156,.25);
        }

        .icon-user{
          font-size: 24px;
          color: #ffffff;
        }

        .modern-input{
          border-radius: 12px !important;
          border: 1px solid #d9e3ee !important;
        }

        .modern-input:focus{
          border-color: rgba(95,125,156,.45) !important;
          box-shadow: 0 0 0 .2rem rgba(95,125,156,.18) !important;
        }

        .btn-save{
          background: var(--brandBlue) !important;
          border: 1px solid var(--brandBlue) !important;
          border-radius: 12px !important;
        }

        .btn-save:hover{
          background: var(--brandBlueDark) !important;
          border-color: var(--brandBlueDark) !important;
        }

        .btn-cancel{
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default CompCreateDepartamento;
