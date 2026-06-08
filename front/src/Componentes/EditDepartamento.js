// src/Componentes/EditDepartamento.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Spinner } from "react-bootstrap";
import { FaEdit, FaBuilding } from "react-icons/fa";

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

const CompEditDepartamento = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nombre, setNombre] = useState("");
  const [abreviatura, setAbreviatura] = useState("");
  const [activo, setActivo] = useState(true); // ✅ AGREGADO

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const axiosCfg = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  const normalizeAbrev = (val) =>
    val
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    const fetchDepartamento = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/departamentos-solicitantes/${id}`, axiosCfg);
        const d = res.data;

        setNombre(d?.nombre ?? "");
        setAbreviatura(d?.abreviatura ?? "");
        setActivo(Boolean(d?.activo)); // ✅ AGREGADO
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error al cargar el departamento.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDepartamento();
    else {
      setError("ID inválido.");
      setLoading(false);
    }
  }, [id, axiosCfg]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      setSaving(true);
      setError(null);

      await api.put(
        `/departamentos-solicitantes/${id}`,
        {
          nombre: n,
          abreviatura: a,
          activo: activo, // ✅ AGREGADO
        },
        axiosCfg
      );

      navigate("/departamentos");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error al actualizar el departamento.";
      setError(msg);
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
              <FaBuilding className="icon-user" />
            </div>

            <h3 className="fw-bold mb-1">Editar Departamento</h3>
            <p className="text-muted small mb-0">
              Actualiza la información del departamento
            </p>
          </div>

          {error && (
            <div className="alert alert-danger text-center small py-2 mb-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              Cargando departamento...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* Nombre */}
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control modern-input"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <label>Nombre</label>
              </div>

              {/* Abreviatura */}
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control modern-input"
                  placeholder="Abreviatura"
                  value={abreviatura}
                  onChange={(e) => setAbreviatura(e.target.value)}
                  required
                />
                <label>Abreviatura</label>
                <div className="form-text">
                  Se guardará en mayúsculas (ej. “TI”, “RRHH”, “SOP”).
                </div>
              </div>

              {/* Switch Activo */}
              <div className="form-check form-switch mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="activoSwitch"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  disabled={saving}
                />
                <label className="form-check-label" htmlFor="activoSwitch">
                  {activo ? "Activo" : "Inactivo"}
                </label>
              </div>

              <div className="d-flex justify-content-between gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/departamentos")}
                  type="button"
                  disabled={saving}
                  className="btn-cancel"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="px-4 fw-semibold btn-save"
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
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

        .edit-page{
          background: var(--pageBg);
        }

        .edit-card{
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
          display:flex;
          align-items:center;
          justify-content:center;
          gap: 6px;
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

export default CompEditDepartamento;
