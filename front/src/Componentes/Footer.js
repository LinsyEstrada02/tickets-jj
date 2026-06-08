// src/components/Footer.js
import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      © {year} Ministerio de Salud Pública y Asistencia Social — 
      <span className="footer-sub">
        Soporte Técnico y Sección de Mantenimiento
      </span>

      <style>{`
        .app-footer {
          width: 100%;
          background: linear-gradient(
            135deg,
            var(--primaryColor),
            var(--hoverColor)
          );
          color: white;
          padding: 16px 20px;
          text-align: center;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -6px 25px rgba(0,0,0,0.15);
          margin-top: auto; /* 🔥 esta línea es la clave */
        }

        .footer-sub {
          margin-left: 6px;
          font-weight: 500;
          opacity: 0.9;
        }
      `}</style>
    </footer>
  );
};

export default Footer; 
