// hooks/useRol.js

/**
 * Decodifica el payload del JWT sin librerías externas.
 * Retorna null si el token es inválido o está expirado.
 */
const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * useRol()
 *
 * Lee el JWT del localStorage y expone flags de rol listos para usar.
 *
 * Tu JWT (loginConPassword.js) tiene esta forma:
 * {
 *   id:       number,
 *   email:    string,
 *   rolId:    number,
 *   roles:    string[]    ← ej: ["ADMIN"] | ["SUPERVISOR"] | ["TECNICO"]
 *   permisos: string[]    ← ej: ["VER_TICKETS", "ASIGNAR_TECNICO", ...]
 * }
 *
 * Uso en cualquier componente:
 *   const { esAdmin, esSupervisor, tienePermiso } = useRol();
 *   {esAdmin && <button>Crear</button>}
 *   {tienePermiso("ASIGNAR_TECNICO") && <button>Asignar</button>}
 */
const useRol = () => {
  const token = localStorage.getItem("token");

  const empty = {
    roles:        [],
    permisos:     [],
    rolId:        null,
    esAdmin:      false,
    esSupervisor: false,
    esTecnico:    false,
    esSolicitante:false,
    tienePermiso: () => false,
    tieneRol:     () => false,
    usuario:      null,
  };

  if (!token) return empty;

  const payload = decodeToken(token);
  if (!payload) return empty;

  // ── roles: array de strings que manda tu backend ─────────────────────
  // loginConPassword.js → jwt.sign({ ..., roles, permisos })
  // roles = usuario.Rols.map((rol) => rol.nombre)  → ["ADMIN"], ["SUPERVISOR"], etc.
  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => String(r).toUpperCase().trim())
    : [];

  // ── permisos efectivos ────────────────────────────────────────────────
  const permisos = Array.isArray(payload.permisos)
    ? payload.permisos.map((p) => String(p).toUpperCase().trim())
    : [];

  const tieneRol     = (nombre) => roles.includes(String(nombre).toUpperCase().trim());
  const tienePermiso = (nombre) => permisos.includes(String(nombre).toUpperCase().trim());

  return {
    // Arrays completos (por si necesitas iterar)
    roles,
    permisos,
    rolId: payload.rolId ?? null,

    // ── Flags de rol ─────────────────────────────────────────────────
    esAdmin:       tieneRol("ADMIN"),
    esSupervisor:  tieneRol("SUPERVISOR"),
    esTecnico:     tieneRol("TECNICO"),
    esSolicitante: tieneRol("SOLICITANTE"),

    // ── Funciones de verificación dinámica ───────────────────────────
    tieneRol,      // tieneRol("ADMIN")               → true/false
    tienePermiso,  // tienePermiso("ASIGNAR_TECNICO")  → true/false

    // ── Datos del usuario logueado ───────────────────────────────────
    usuario: {
      id:    payload.id    ?? null,
      email: payload.email ?? "",
    },
  };
};

export default useRol;
