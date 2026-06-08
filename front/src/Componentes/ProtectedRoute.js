// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function isTokenValido() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirado = payload.exp * 1000 < Date.now();
    if (expirado) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  if (!isTokenValido()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}