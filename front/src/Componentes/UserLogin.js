import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaRegUser } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const UserLogin = ({ onHelpClick }) => {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError("Ingresa un correo válido"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      // Guardar sesión
      localStorage.setItem("token",      data.token);
      localStorage.setItem("usuario",    JSON.stringify(data.usuario));
      localStorage.setItem("id_usuario", String(data.usuario.id));

      // Redirigir
      navigate("/mis-tickets", { replace: true });

    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="loginSide">
      <div className="sideCard userCard">
        <div className="loginHeader">
          <img src={logo} alt="Logo" className="loginLogo" />
          <h3 className="loginTitle">Acceso de Usuario</h3>
          <p className="loginSubtitle">Ingresa tu correo para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          {error && <span className="loginMessage">{error}</span>}

          <div className="field">
            <label>Correo</label>
            <div className="inputRow">
              <FaRegUser className="inputIcon" />
              <input
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btnPrimary ${(!isValid || loading) ? "isDisabled" : ""}`}
            disabled={!isValid || loading}
          >
            <span>{loading ? "Ingresando..." : "Iniciar sesión"}</span>
            <FaArrowRightLong className="btnIcon" />
          </button>

          <div className="loginLinks single">
            <button type="button" className="linkBtn secondary" onClick={onHelpClick}>
              Acceso Administrador
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UserLogin;
