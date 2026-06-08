// Componentes/PrivateRoute.jsx
import React from "react";

function getPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirado = payload.exp * 1000 < Date.now();
    if (expirado) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      return null;
    }
    return payload;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return null;
  }
}

function redirigirSegunRol(rolesUsuario) {
  const rol = rolesUsuario[0];
  if (rol === "SOLICITANTE")     window.location.href = "/mis-tickets";
  else if (rol === "TECNICO")    window.location.href = "/tecnico";
  else if (rol === "SUPERVISOR") window.location.href = "/supervisor";
  else                           window.location.href = "/dashboard";
}

const PrivateRoute = ({ children, roles }) => {
  const payload = getPayload();

  // 👇 TEMPORAL — borrar después
  console.log("=== PrivateRoute ===");
  console.log("payload:", payload);
  console.log("roles en token:", payload?.roles);
  console.log("roles requeridos:", roles);

  if (!payload) {
    window.location.href = "/login";
    return null;
  }

  if (roles && roles.length > 0) {
    const rolesUsuario = payload.roles || [];
    const tieneAcceso = roles.some((r) => rolesUsuario.includes(r));

    console.log("rolesUsuario:", rolesUsuario);
    console.log("tieneAcceso:", tieneAcceso);

    if (!tieneAcceso) {
      redirigirSegunRol(rolesUsuario);
      return null;
    }
  }

  return children;
};

export default PrivateRoute;