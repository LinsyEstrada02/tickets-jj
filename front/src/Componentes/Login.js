// Componentes/Login.jsx
import React, { useState } from "react";
import UserLogin from "./UserLogin";
import AdminLogin from "./AdminLogin";
import fondo from "../assets/fondo.jpeg";

const Login = () => {
  const [view, setView] = useState("user");

  const goAdmin = () => setView("admin");
  const goUser  = () => setView("user");

  return (
    <div className="loginPage">
      <div className={`loginContainer ${view === "admin" ? "showAdmin" : ""}`}>
        <div className="slot slotLeft">
          <div
            className="loginBg"
            style={{ backgroundImage: `url(${fondo})` }}
            aria-hidden="true"
          />
        </div>
        <div className="slot slotRight">
          {view === "user"
            ? <UserLogin onHelpClick={goAdmin} />
            : <AdminLogin onBackClick={goUser} />}
        </div>
      </div>
    </div>
  );
};

export default Login;