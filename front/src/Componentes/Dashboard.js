// src/components/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaUserTie,
  FaExchangeAlt,
  FaUsers,
  FaSitemap,
  FaLayerGroup,
  FaThLarge,
  FaChartBar
} from 'react-icons/fa';
import { useServerWatch } from "../Hooks/useServerWatch.js"; // ← AGREGAR

import Header from './Header';
import Footer from './Footer';

const Dashboard = () => {
  useServerWatch(15);
  const navigate = useNavigate();

  const modules = [
    { title: 'Solicitudes', desc: 'Gestión general de solicitudes.', path: '/asignacion-tickets', icon: FaHome },
    { title: 'Reasignar', desc: 'Reasignación de solicitudes.', path: '/reasignacion-tickets', icon: FaExchangeAlt },
    { title: 'Usuarios', desc: 'Administración de usuarios.', path: '/usuarios', icon: FaUsers },
    { title: 'Departamentos', desc: 'Gestión de departamentos.', path: '/departamentos', icon: FaSitemap },
    { title: 'Encuestas',    desc: 'Resultados de satisfacción.',       path: '/encuestas', icon: FaChartBar },
];

  return (
    <div className="d-flex flex-column min-vh-100 dashboard-root">
      <Header />

      <main className="flex-grow-1 py-5" style={{ paddingBottom: '60px' }}>

        <div className="container dashboard-shell">

          {/* ===== TÍTULO CON ICONO ===== */}
          <div className="dash-title-wrap">
            <div className="dash-title-row">
              <div className="dash-title-icon">
                <FaThLarge />
              </div>
              <h2 className="dash-title">Menú Principal</h2>
            </div>

            <div className="dash-title-line"></div>

            <p className="dash-subtitle">
              Seleccione un módulo para continuar
            </p>
          </div>

          {/* ===== TARJETAS ===== */}
          <div className="cards-wrapper">
            {modules.map((mod, index) => (
              <div
                key={index}
                className="ticket-card"
                onClick={() => navigate(mod.path)}
              >
                <div className="icon-badge">
                  <mod.icon />
                </div>

                <h5 className="card-title">{mod.title}</h5>
                <p className="card-desc">{mod.desc}</p>

                <button
                  className="ticket-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(mod.path);
                  }}
                >
                  Ingresar
                </button>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />

      {/* ===== ESTILOS ===== */}
      <style>{`
        .dashboard-root{
          background: var(--bgColor);
        }

        .dashboard-shell{
          position: relative;
        }

        /* ===== TÍTULO ===== */
       .dash-title-wrap{
  margin-top: -30x;      
  margin-bottom: 70px;
  text-align: left;
  padding-left: 40px;
}


        .dash-title-row{
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .dash-title-icon{
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            var(--primaryColor),
            var(--hoverColor)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          box-shadow: 0 8px 20px rgba(95,125,156,0.3);
        }

        .dash-title{
          color: var(--primaryColor);
          font-weight: 900;
          margin: 0;
          font-size: clamp(1.8rem, 2.6vw, 2.3rem);
        }

        .dash-title-line{
          width: 140px;
          height: 4px;
          background: var(--primaryColor);
          margin: 15px 0 12px 65px;
          border-radius: 10px;
          opacity: .7;
        }

        .dash-subtitle{
          color: var(--mediumGrey);
          font-weight: 600;
          margin-left: 65px;
        }

        /* ===== TARJETAS ===== */
        .cards-wrapper{
          display: grid;
          grid-template-columns: repeat(3, 260px);
          gap: 45px;
          justify-content: center;
          margin-top: -30px;
        }

        .ticket-card{
          width: 260px;
          padding: 28px 22px;
          border-radius: 22px;
          background: var(--whiteColor);
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
          text-align: center;
          transition: all .25s ease;
          cursor: pointer;
        }

        .ticket-card:hover{
          transform: translateY(-6px);
          box-shadow: 0 18px 45px rgba(0,0,0,0.15);
          background: var(--paleColor);
        }

        .icon-badge{
          width: 74px;
          height: 74px;
          margin: 0 auto 15px auto;
          border-radius: 18px;
          background: rgba(95,125,156,0.15);
          display:flex;
          align-items:center;
          justify-content:center;
          color: var(--primaryColor);
          font-size: 30px;
        }

        .card-title{
          font-weight: 800;
          color: var(--blackColor);
          margin-bottom: 8px;
        }

        .card-desc{
          font-size: 0.92rem;
          color: var(--mediumGrey);
          min-height: 44px;
          margin-bottom: 15px;
        }

        .ticket-btn{
          width: 100%;
          border: none;
          border-radius: 25px;
          padding: 9px 0;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(
            135deg,
            var(--primaryColor),
            var(--hoverColor)
          );
          transition: all .2s ease;
        }

        .ticket-btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(95,125,156,0.3);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px){
          .cards-wrapper{
            grid-template-columns: repeat(2, 250px);
          }
        }

        @media (max-width: 576px){
          .cards-wrapper{
            grid-template-columns: repeat(1, 270px);
          }

          .dash-title-wrap{
            padding-left: 10px;
          }

          .dash-subtitle,
          .dash-title-line{
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
