// src/Componentes/Header.js
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logoblanco.png';
import {
  FaHome,
  FaUser,
  FaUsers,
  FaSitemap,
  FaExchangeAlt,
  FaChevronDown,
  FaTimes,
  FaBars,
  FaSignOutAlt,
  FaChartBar
} from 'react-icons/fa';

/* ===== Base URL ===== */
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://10.21.25.54:3001';

/* ===== axios instance ===== */
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

/* ===== Helpers ===== */
function decodeJWT(token) {
  try {
    if (!token) return null;
    const base = token.split('.')[1];
    if (!base) return null;
    const json = atob(base.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function resolveUserIdLocal() {
  const token = localStorage.getItem('token');
  const payload = decodeJWT(token);
  const idFromToken = Number(payload?.id_usuario ?? payload?.sub ?? payload?.id);
  if (idFromToken) {
    const storedRaw = localStorage.getItem('id_usuario') || localStorage.getItem('userId');
    const stored = storedRaw ? Number(storedRaw) : null;
    if (!stored || stored !== idFromToken) {
      localStorage.setItem('id_usuario', String(idFromToken));
      if (stored && stored !== idFromToken) {
        localStorage.removeItem('userName');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userDepartamento');
        localStorage.removeItem('userSubDepartamento');
      }
    }
    return idFromToken;
  }
  const stored = localStorage.getItem('id_usuario') || localStorage.getItem('userId');
  return stored && Number(stored) ? Number(stored) : null;
}

async function resolveUserIdRemote() {
  const candidates = ['/usuarios/me', '/auth/me', '/perfiles/me'];
  for (const path of candidates) {
    try {
      const { data } = await api.get(path, { params: { _ts: Date.now() } });
      const id =
        data?.id_usuario ??
        data?.usuario?.id_usuario ??
        data?.user?.id ??
        data?.id;
      if (id) {
        localStorage.setItem('id_usuario', String(id));
        return Number(id);
      }
    } catch {}
  }
  return null;
}

function readRolesFromStorage() {
  let rolesArr = [];
  try {
    const raw = localStorage.getItem('userRoles');
    rolesArr = raw ? JSON.parse(raw) : [];
  } catch {
    rolesArr = [];
  }
  const labelStored = (localStorage.getItem('userRole') || '').trim();
  const names = Array.isArray(rolesArr)
    ? rolesArr
        .map((r) => (typeof r === 'string' ? r : (r?.nombre || r?.name || '')))
        .filter(Boolean)
    : [];
  const label = names.length ? names.join(' • ') : labelStored;
  return { names, label };
}

/* ===== Refetchers ===== */
async function fetchAndSetPerfil(setCurrentUser) {
  try {
    const { data } = await api.get(`/usuarios/me`, { params: { _ts: Date.now() } });
    const userObj = data?.usuario ?? data ?? {};
    const id =
      Number(
        userObj?.id_usuario ??
        userObj?.id ??
        userObj?.usuarioId
      ) || resolveUserIdLocal() || null;

    const nameFromApi =
      userObj?.username ||
      userObj?.name ||
      userObj?.nombre ||
      localStorage.getItem('userName') ||
      '';

    const departamento = userObj?.departamento || null;
    const subDepartamento = userObj?.subdepartamento || null;
    const rolesFromApi = Array.isArray(userObj?.roles) ? userObj.roles : [];
    const rolPrincipal = userObj?.rolPrincipal || null;
    const roleLabel = rolesFromApi.length
      ? rolesFromApi.join(' • ')
      : (rolPrincipal || '');

    setCurrentUser((u) => {
      const next = {
        ...u,
        id: id || u.id,
        name: nameFromApi || u.name,
        departamento: departamento || u.departamento || null,
        subDepartamento: subDepartamento || u.subDepartamento || null,
        roles: rolesFromApi.length ? rolesFromApi : u.roles,
        role: roleLabel || u.role,
      };

      if (next.id) localStorage.setItem('id_usuario', String(next.id));
      if (next.name) localStorage.setItem('userName', next.name);
      if (next.departamento) localStorage.setItem('userDepartamento', JSON.stringify(next.departamento));
      if (next.subDepartamento) localStorage.setItem('userSubDepartamento', JSON.stringify(next.subDepartamento));
      if (rolesFromApi.length) localStorage.setItem('userRoles', JSON.stringify(rolesFromApi));
      if (roleLabel) localStorage.setItem('userRole', roleLabel);

      return next;
    });
    return;
  } catch (err) {
    // fallback local
  }

  const token = localStorage.getItem('token');
  const payload = decodeJWT(token) || {};
  const id = resolveUserIdLocal() || null;
  const fallbackName =
    localStorage.getItem('userName') ||
    payload?.username ||
    payload?.name ||
    payload?.email ||
    '';

  let fallbackDepartamento = null;
  let fallbackSubDepartamento = null;
  try {
    const rawDepto = localStorage.getItem('userDepartamento');
    const rawSubDepto = localStorage.getItem('userSubDepartamento');
    fallbackDepartamento = rawDepto ? JSON.parse(rawDepto) : null;
    fallbackSubDepartamento = rawSubDepto ? JSON.parse(rawSubDepto) : null;
  } catch {}

  const { names, label } = readRolesFromStorage();

  setCurrentUser((u) => ({
    ...u,
    id: u.id || id,
    name: u.name || fallbackName,
    departamento: u.departamento || fallbackDepartamento,
    subDepartamento: u.subDepartamento || fallbackSubDepartamento,
    roles: u.roles?.length ? u.roles : names,
    role: u.role || label,
  }));
}

async function fetchAndSetRoles(setCurrentUser) {
  const id = resolveUserIdLocal() || (await resolveUserIdRemote()) || null;
  const { names, label } = readRolesFromStorage();

  setCurrentUser((u) => {
    if (u.roles?.length && u.role) return { ...u, id: u.id || id };
    const next = { ...u, id: u.id || id, roles: names, role: label };
    if (next.id && !localStorage.getItem('id_usuario')) {
      localStorage.setItem('id_usuario', String(next.id));
    }
    return next;
  });
}

/* ===================================================== */
/*                       COMPONENTE                        */
/* ===================================================== */
export default function Header({ onLogout }) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const baseUser = useMemo(() => {
    const token = localStorage.getItem('token');
    const payload = decodeJWT(token) || {};
    const idFromToken = Number(payload?.id_usuario ?? payload?.sub ?? payload?.id) || null;
    const storedId = Number(localStorage.getItem('id_usuario') || localStorage.getItem('userId')) || null;

    if (idFromToken && storedId && idFromToken !== storedId) {
      localStorage.setItem('id_usuario', String(idFromToken));
      localStorage.removeItem('userName');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userDepartamento');
      localStorage.removeItem('userSubDepartamento');
    } else if (!storedId && idFromToken) {
      localStorage.setItem('id_usuario', String(idFromToken));
    }

    const id = idFromToken || storedId || null;
    const storedName = id ? localStorage.getItem('userName') : null;
    const { names, label } = readRolesFromStorage();

    let storedDepartamento = null;
    let storedSubDepartamento = null;
    try {
      const rawDepto = localStorage.getItem('userDepartamento');
      const rawSubDepto = localStorage.getItem('userSubDepartamento');
      storedDepartamento = rawDepto ? JSON.parse(rawDepto) : null;
      storedSubDepartamento = rawSubDepto ? JSON.parse(rawSubDepto) : null;
    } catch {}

    return {
      id,
      name: storedName || '',
      roles: names,
      role: label,
      token,
      departamento: storedDepartamento,
      subDepartamento: storedSubDepartamento,
    };
  }, []);

  const [currentUser, setCurrentUser] = useState(baseUser);
  const initial = (currentUser.name?.trim()?.[0] || 'U').toUpperCase();

  const hasSolicitante = useMemo(() => {
    const roles = currentUser.roles || [];
    return roles.some((r) => {
      const name = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return name.includes('solicitante');
    });
  }, [currentUser.roles]);

  const hasTecnico = useMemo(() => {
    const roles = currentUser.roles || [];
    return roles.some((r) => {
      const name = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return name.includes('tecnico') || name.includes('técnico');
    });
  }, [currentUser.roles]);

  const hasSupervisor = useMemo(() => {
    const roles = currentUser.roles || [];
    return roles.some((r) => {
      const name = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return name.includes('supervisor');
    });
  }, [currentUser.roles]);

  const hasAdmin = useMemo(() => {
    const roles = currentUser.roles || [];
    return roles.some((r) => {
      const name = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return name.includes('admin');
    });
  }, [currentUser.roles]);

  // Ocultar hamburguesa/sidebar para solicitante o técnico que NO sea admin/supervisor
  const esSolamenteSolicitante = useMemo(() => {
    return (hasSolicitante || hasTecnico) && !hasAdmin && !hasSupervisor;
  }, [hasSolicitante, hasTecnico, hasAdmin, hasSupervisor]);

  const esSupervisorSinAdmin = useMemo(() => {
    return hasSupervisor && !hasAdmin;
  }, [hasSupervisor, hasAdmin]);

  const theme = {
    navbarBg: 'var(--primaryColor)',
    navbarText: 'var(--whiteColor)',
    sidebarBg: 'var(--paleColor)',
    sidebarText: 'var(--blackColor)',
    sidebarBorder: 'var(--lightGrey)',
    itemHover: 'rgba(95, 125, 156, 0.12)',
    itemActiveBg: 'rgba(95, 125, 156, 0.18)',
    itemActiveBorder: 'var(--primaryColor)',
    avatarBg: 'var(--primaryColor)',
    cardBg: 'var(--whiteColor)',
    muted: 'var(--mediumGrey)',
    danger: '#dc3545',
  };

  useEffect(() => {
    if (currentUser.token) {
      api.defaults.headers.common.Authorization = `Bearer ${currentUser.token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [currentUser.token]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    fetchAndSetPerfil(setCurrentUser).catch(() => {});
    fetchAndSetRoles(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser.roles?.length || !currentUser.role) {
      fetchAndSetRoles(setCurrentUser).catch(() => {});
    }
  }, [currentUser.name, currentUser.roles?.length, currentUser.role]);

  const handlePowerClick = () => {
    if (onLogout) onLogout();
    localStorage.clear();
    navigate('/login');
  };

  const handleGoToProfile = async () => {
    let id = resolveUserIdLocal();
    if (!id) id = await resolveUserIdRemote();
    if (id) navigate(`/perfiles/${id}`);
    setOpen(false);
    setUserMenuOpen(false);
  };

  const getDashboardPath = (roles) => {
    const hasSolicitante = roles?.some((r) => {
      const roleName = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return roleName.includes('solicitante') || roleName === 'solicitante';
    });

    const hasTecnico = roles?.some((r) => {
      const roleName = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return roleName.includes('tecnico') || roleName.includes('técnico');
    });

    const hasSupervisor = roles?.some((r) => {
      const roleName = (typeof r === 'string' ? r : r?.nombre || '').toLowerCase();
      return roleName.includes('supervisor');
    });

    if (hasTecnico) return '/tecnico';
    if (hasSolicitante) return '/mis-tickets';
    if (hasSupervisor) return '/supervisor';
    return '/dashboard';
  };

  const allModules = [
    { name: 'Principal', path: '/dashboard', icon: FaHome },
    { name: 'Supervisor', path: '/supervisor', icon: FaUser },
    { name: 'Asignar', path: '/asignacion-tickets', icon: FaUsers },
    { name: 'Reasignar', path: '/reasignacion-tickets', icon: FaExchangeAlt },
    { name: 'Usuarios', path: '/usuarios', icon: FaUsers },
    { name: 'Departamentos', path: '/departamentos', icon: FaSitemap },
    { name: 'Encuestas', path: '/encuestas', icon: FaChartBar },
  ];

  const modules = useMemo(() => {
    if (esSupervisorSinAdmin) {
      return allModules.filter((mod) =>
        ['/supervisor', '/asignacion-tickets', '/reasignacion-tickets'].includes(mod.path)
      );
    }
    return allModules;
  }, [esSupervisorSinAdmin]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const deptoSidebarLabel = currentUser.departamento?.nombre || null;
  const subDeptoSidebarLabel = currentUser.subDepartamento?.nombre || null;

  return (
    <>
      <nav
        className="app-navbar"
        style={{
          backgroundColor: theme.navbarBg,
          height: 70,
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 1050,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}
      >
        {!esSolamenteSolicitante && (
          <button
            className="btn"
            onClick={() => setOpen((v) => !v)}
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.navbarText,
              width: 44,
              height: 44,
              borderRadius: 10,
            }}
            title="Menú"
          >
            {open ? <FaTimes style={{ fontSize: '1.4rem' }} /> : <FaBars style={{ fontSize: '1.4rem' }} />}
          </button>
        )}

        <Link
          to={getDashboardPath(currentUser.roles)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <img src={logo} alt="Logo" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          <span style={{ color: theme.navbarText, fontWeight: 700, letterSpacing: 0.2 }}>Tickets</span>
        </Link>

        <div style={{ flex: 1 }} />

        {deptoSidebarLabel && (
          <div
            className="d-none d-md-flex align-items-center gap-1"
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '4px 10px',
              color: theme.navbarText,
              fontSize: '0.8rem',
              fontWeight: 600,
              gap: 4,
            }}
          >
            <FaSitemap style={{ opacity: 0.8, fontSize: '0.75rem' }} />
            <span>{deptoSidebarLabel}</span>
            {subDeptoSidebarLabel && (
              <>
                <span style={{ opacity: 0.5, margin: '0 2px' }}>›</span>
                <span style={{ opacity: 0.85 }}>{subDeptoSidebarLabel}</span>
              </>
            )}
          </div>
        )}

        <div className="position-relative" ref={userMenuRef}>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => setUserMenuOpen((v) => !v)}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.12)',
              padding: '6px 10px',
              borderRadius: 12,
              color: theme.navbarText,
            }}
            title="Cuenta"
          >
            <span
              style={{
                fontWeight: 600,
                maxWidth: 160,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.name || 'Usuario'}
            </span>
            <FaChevronDown />
          </button>

          {userMenuOpen && (
            <div
              className="card shadow"
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                minWidth: 260,
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14,
                overflow: 'hidden',
                background: theme.cardBg,
              }}
            >
              <div style={{ padding: 14, background: 'var(--paleColor)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {currentUser.foto ? (
                    <img
                      src={currentUser.foto}
                      alt="Avatar"
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: theme.avatarBg,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                      }}
                    >
                      {initial}
                    </div>
                  )}

                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontWeight: 800, color: 'var(--blackColor)' }}>
                      {currentUser.name || 'Usuario'}
                    </div>
                    <small style={{ color: theme.muted }}>{currentUser.role || '—'}</small>

                    {(currentUser.departamento || currentUser.subDepartamento) && (
                      <div
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        {currentUser.departamento && (
                          <span
                            style={{
                              background: 'rgba(95,125,156,0.13)',
                              color: 'var(--primaryColor)',
                              borderRadius: 6,
                              padding: '1px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <FaSitemap style={{ fontSize: '0.65rem' }} />
                            {currentUser.departamento.abreviatura}
                          </span>
                        )}
                        {currentUser.subDepartamento && (
                          <span
                            style={{
                              background: 'rgba(95,125,156,0.08)',
                              color: 'var(--primaryColor)',
                              borderRadius: 6,
                              padding: '1px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              opacity: 0.85,
                            }}
                          >
                            {currentUser.subDepartamento.abreviatura}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>



              <div style={{ padding: 10, background: '#f8f9fa' }}>
                <button
                  className="btn w-100"
                  onClick={handlePowerClick}
                  style={{
                    backgroundColor: theme.navbarBg,
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 700,
                  }}
                >
                  <FaSignOutAlt className="me-2" /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {!esSolamenteSolicitante && (
        <>
          <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

          <aside
            className={`app-sidebar ${open ? 'open' : ''}`}
            style={{
              width: 280,
              backgroundColor: theme.sidebarBg,
              color: theme.sidebarText,
              position: 'fixed',
              left: 0,
              top: 70,
              height: 'calc(100vh - 70px)',
              zIndex: 1040,
              transform: open ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              boxShadow: '2px 0 18px rgba(0,0,0,0.10)',
              borderRight: `1px solid ${theme.sidebarBorder}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: 'var(--blackColor)' }}>Menú</div>
              <button
                className="btn"
                onClick={() => setOpen(false)}
                style={{ border: 'none', background: 'transparent', borderRadius: 10, width: 40, height: 40 }}
                title="Cerrar"
              >
                <FaTimes style={{ fontSize: '1.2rem', color: 'var(--blackColor)' }} />
              </button>
            </div>

            <div style={{ padding: '0 14px 14px 14px' }}>
              <div
                role={!esSupervisorSinAdmin ? 'button' : undefined}
                onClick={!esSupervisorSinAdmin ? handleGoToProfile : undefined}
                title={!esSupervisorSinAdmin ? 'Ir a mi perfil' : undefined}
                style={{
                  background: 'var(--whiteColor)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  cursor: !esSupervisorSinAdmin ? 'pointer' : 'default',
                }}
              >
                {currentUser.foto ? (
                  <img
                    src={currentUser.foto}
                    alt="Avatar"
                    style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      backgroundColor: theme.avatarBg,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {initial}
                  </div>
                )}

                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 800, color: 'var(--blackColor)' }}>
                    {currentUser.name || 'Usuario'}
                  </div>
                  <small style={{ color: theme.muted }}>{currentUser.role || '—'}</small>

                  {(currentUser.departamento || currentUser.subDepartamento) && (
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {currentUser.departamento && (
                        <span
                          style={{
                            background: 'rgba(95,125,156,0.13)',
                            color: 'var(--primaryColor)',
                            borderRadius: 6,
                            padding: '1px 7px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <FaSitemap style={{ fontSize: '0.65rem' }} />
                          {currentUser.departamento.abreviatura}
                        </span>
                      )}
                      {currentUser.subDepartamento && (
                        <span
                          style={{
                            background: 'rgba(95,125,156,0.08)',
                            color: 'var(--primaryColor)',
                            borderRadius: 6,
                            padding: '1px 7px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            opacity: 0.85,
                          }}
                        >
                          {currentUser.subDepartamento.abreviatura}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <nav className="sidebar-nav" style={{ padding: 14, overflowY: 'auto' }}>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {modules.map((mod, idx) => {
                  const active = isActive(mod.path);
                  return (
                    <li key={idx}>
                      <Link
                        to={mod.path}
                        onClick={() => setOpen(false)}
                        className={`sidebar-item ${active ? 'active' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 12,
                          textDecoration: 'none',
                          color: 'var(--blackColor)',
                          borderLeft: active ? `4px solid ${theme.itemActiveBorder}` : '4px solid transparent',
                          background: active ? theme.itemActiveBg : 'transparent',
                          fontWeight: active ? 800 : 600,
                        }}
                      >
                        <mod.icon />
                        <span>{mod.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </>
      )}

      <style>{`
        .sidebar-overlay{
          position: fixed;
          inset: 70px 0 0 0;
          background: rgba(0,0,0,0.25);
          z-index: 1035;
          opacity: 0;
          pointer-events: none;
          transition: opacity .25s ease;
        }
        .sidebar-overlay.show{
          opacity: 1;
          pointer-events: auto;
        }
        .sidebar-item:hover{
          background: rgba(95,125,156,0.12) !important;
        }
        @media (min-width: 992px){
          .sidebar-overlay{ display: none; }
        }
      `}</style>
    </>
  );
}









