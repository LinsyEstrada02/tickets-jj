// Componentes/Supervisor/SupervisorDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCog, FaExchangeAlt, FaThLarge, FaChartBar } from "react-icons/fa";
import Header from "../Header";
import Footer from "../Footer";
import useRol from "../../Hooks/useerol.js";
import { useServerWatch } from "../../Hooks/useServerWatch";

const accesos = [
  {
    icon: <FaUserCog />,
    titulo: "Asignación",
    ruta: "/asignacion-tickets",
  },
  {
    icon: <FaExchangeAlt />,
    titulo: "Reasignación",
    ruta: "/reasignacion-tickets",
  },
  {
    icon: <FaChartBar />, 
    titulo: "Encuestas",
    descripcion: "Resultados de satisfacción de los solicitantes.",
    ruta: "/encuestas",
  },
];

const SupervisorDashboard = () => {
    useServerWatch(15);
  const navigate = useNavigate();
  const { usuario } = useRol();

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="dashboard-root">
      <Header />

      <div className="dashboard-shell container py-5">
        {/* ===== TÍTULO ===== */}
        <div className="dash-title-wrap">
          <div className="dash-title-row">
            <div className="dash-title-icon">
              <FaThLarge />
            </div>

            <h1 className="dash-title">Menú Principal</h1>
          </div>

          <div className="dash-title-line"></div>

          <p className="dash-subtitle">
            {saludo}
            {usuario?.nombre
              ? `, ${usuario.nombre.split(" ")[0]}`
              : ""}. Seleccione un módulo para continuar
          </p>
        </div>

        {/* ===== TARJETAS ===== */}
        <div className="cards-wrapper">
          {accesos.map((item) => (
            <div className="ticket-card" key={item.ruta}>
              <div className="icon-badge">{item.icon}</div>

              <h3 className="card-title">{item.titulo}</h3>

              <button
                type="button"
                className="ticket-btn"
                onClick={() => navigate(item.ruta)}
              >
                Ingresar
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      <style>{`
        :root{
          --primaryColor: #5f7d9c;
          --hoverColor: #4c6884;
          --bgColor: #eef2f6;
          --whiteColor: #ffffff;
          --blackColor: #0f172a;
          --mediumGrey: #6b7280;
          --paleColor: #f8fbff;
        }

        .dashboard-root{
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bgColor);
        }

        .dashboard-shell{
          position: relative;
          flex: 1;
        }

        /* ===== TÍTULO ===== */

        .dash-title-wrap{
          margin-top: -30px;
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
          grid-template-columns: repeat(auto-fit, minmax(260px, 260px));
          gap: 45px;
          justify-content: center;
          margin-top: -30px;
        }

        .ticket-card{
          width: 260px;
          padding: 24px 20px;
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
          margin: 0 auto 16px auto;
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
          margin-bottom: 14px;
          font-size: 0.95rem;
          line-height: 1.2;
        }

        .ticket-btn{
          width: 100%;
          border: none;
          border-radius: 25px;
          padding: 9px 0;
          font-weight: 800;
          font-size: 0.95rem;
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

export default SupervisorDashboard;
