// Componentes/AdminLogin.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaRegUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { TbLockPassword } from "react-icons/tb";
import { FaArrowRightLong } from "react-icons/fa6";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";

const AdminLogin = ({ onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();

  const isValid = useMemo(() => form.email.trim() && form.password.trim(), [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError("Completa todos los campos"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return; }

      // Guardar sesión
      localStorage.setItem("token",      data.token);
      localStorage.setItem("usuario",    JSON.stringify(data.usuario));
      localStorage.setItem("id_usuario", String(data.usuario.id));

      // Redirección por rol
 // ✅ Después
const roles = data.usuario.roles || [];
if (roles.includes("ADMINISTRADOR")) {
  navigate("/dashboard", { replace: true });
} else if (roles.includes("SUPERVISOR")) {
  navigate("/supervisor", { replace: true });
} else if (roles.includes("TECNICO")) {
  navigate("/tecnico", { replace: true });
} else if (roles.includes("SOLICITANTE")) {
  navigate("/mis-tickets", { replace: true });
} else {
  navigate("/dashboard", { replace: true });
}
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="loginSide">
      <div className="sideCard adminCard">
        <div className="loginHeader">
          <img src={logo} alt="Logo" className="loginLogo" />
          <h3 className="loginTitle">Acceso Administrativo</h3>
          <p className="loginSubtitle">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          {error && <span className="loginMessage">{error}</span>}

          <div className="field">
            <label>Correo</label>
            <div className="inputRow">
              <FaRegUser className="inputIcon" />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@correo.com"
              />
            </div>
          </div>

          <div className="field">
            <label>Contraseña</label>
            <div className="inputRow">
              <TbLockPassword className="inputIcon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="iconBtn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="btnPrimary"
          >
            <span>{loading ? "Ingresando..." : "Iniciar sesión"}</span>
            <FaArrowRightLong />
          </button>

          <button type="button" className="linkBtn secondary" onClick={onBackClick}>
            Volver
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminLogin;
