// App.js
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./Componentes/PrivateRoute";
import Login from "./Componentes/Login";
import Dashboard from "./Componentes/Dashboard";
// Usuarios
import Usuario           from "./Componentes/ShowUsuario";
import CompCreateUsuario from "./Componentes/CreateUsuario";
import CompEditUsuario   from "./Componentes/EditUsuario";
// Departamentos
import Departamento           from "./Componentes/ShowDepartamento";
import CompCreateDepartamento from "./Componentes/CreateDepartamento";
import CompEditDepartamento   from "./Componentes/EditDepartamento";
// Permisos
import CompShowPermisos from "./Componentes/ShowPermisos.js";
// Tickets
import CompShowTickets      from "./Componentes/Solicitud/ShowTickets.js";
import SolicitanteDashboard from "./Componentes/Solicitud/solicitantedashboard.js";
import TecnicoDashboard     from "./Componentes/Tecnicos/TecnicoDashboard.js";
// Asignación / Reasignación
import CompAsignacionTickets   from "./Componentes/Asignacion/asignacion.js";
import CompReasignacionTickets from "./Componentes/Reasignacion/reasignacion.js";
// Supervisor
import SupervisorDashboard from "./Componentes/Supervisor/supervisor.js";

//Encuesta
import EncuestaTicket from "./Componentes/Encuesta/Encuestaticket.js"
import ResultadosEncuesta from "./Componentes/Encuesta/Resultadosencuesta.js"

// ─── Roles de conveniencia ────────────────────────────────────────────────────
const ADMIN = ["ADMINISTRADOR", "ADMIN"];
const ADMIN_SUP = ["ADMINISTRADOR", "ADMIN", "SUPERVISOR"];
const TECNICO    = ["TECNICO"];
const SOLIC      = ["SOLICITANTE"];
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (             
    <div className="App">
      <Routes>
        {/* Raíz → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* ── Dashboard general (admin) ── */}
        <Route path="/dashboard"
          element={<PrivateRoute roles={ADMIN}><Dashboard /></PrivateRoute>}
        />

        {/* ── Dashboard supervisor ── */}
        <Route path="/supervisor"
          element={<PrivateRoute roles={ADMIN_SUP}><SupervisorDashboard /></PrivateRoute>}
        />

        {/* ── Usuarios — solo admin ── */}
        <Route path="/usuarios"
          element={<PrivateRoute roles={ADMIN}><Usuario /></PrivateRoute>}
        />
        <Route path="/usuarios/crear"
          element={<PrivateRoute roles={ADMIN}><CompCreateUsuario /></PrivateRoute>}
        />
        <Route path="/usuarios/edit/:id"
          element={<PrivateRoute roles={ADMIN}><CompEditUsuario /></PrivateRoute>}
        />
        <Route path="/usuarios/:id/permisos"
          element={<PrivateRoute roles={ADMIN}><CompShowPermisos /></PrivateRoute>}
        />

        {/* ── Departamentos — solo admin ── */}
        <Route path="/departamentos"
          element={<PrivateRoute roles={ADMIN}><Departamento /></PrivateRoute>}
        />
        <Route path="/departamentos-solicitantes/crear"
          element={<PrivateRoute roles={ADMIN}><CompCreateDepartamento /></PrivateRoute>}
        />
        <Route path="/departamentos-solicitantes/edit/:id"
          element={<PrivateRoute roles={ADMIN}><CompEditDepartamento /></PrivateRoute>}
        />

        {/* ── Tickets — admin y supervisor pueden ver y asignar ── */}
        <Route path="/tickets"
          element={<PrivateRoute roles={ADMIN_SUP}><CompShowTickets /></PrivateRoute>}
        />

        {/* ── Asignación — admin y supervisor ── */}
        <Route path="/asignacion-tickets"
          element={<PrivateRoute roles={ADMIN_SUP}><CompAsignacionTickets /></PrivateRoute>}
        />
        <Route path="/reasignacion-tickets"
          element={<PrivateRoute roles={ADMIN_SUP}><CompReasignacionTickets /></PrivateRoute>}
        />
        <Route path="/encuestas"
          element={<PrivateRoute roles={ADMIN_SUP}><ResultadosEncuesta /></PrivateRoute>}
        />

        {/* ── Solicitante ── */}
        <Route path="/mis-tickets"
          element={<PrivateRoute roles={SOLIC}><SolicitanteDashboard /></PrivateRoute>}
        />

        {/* ── Técnico ── */}
        <Route path="/tecnico"
          element={<PrivateRoute roles={TECNICO}><TecnicoDashboard /></PrivateRoute>}
        />

        {/* ── Encuesta (pública) ── */}
        <Route path="/encuesta/:id" element={<EncuestaTicket />} />

        {/* 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </div>
  );
}

export default App;
