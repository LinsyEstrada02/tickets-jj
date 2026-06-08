import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useServerWatch(intervaloSegundos = 15) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const verificar = async () => {
      try {
        const res = await fetch("http://10.21.25.54:3001/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          navigate("/login", { replace: true });
        }
      } catch {
        // Servidor caído → cerrar sesión
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        navigate("/login", { replace: true });
      }
    };

    verificar();
    const intervalo = setInterval(verificar, intervaloSegundos * 1000);
    return () => clearInterval(intervalo);
  }, []);
}