// Componentes/ContraseñaPerdida.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaRegUser } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";


export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const enviarSolicitud = async (e) => {

    e.preventDefault();

    if (!email) {
      setError("Ingrese su correo electrónico");
      return;
    }

    setLoading(true);
    setError("");

    try {

      const res = await fetch(
        `${API_BASE}/api/password-reset/request`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email
          })
        }
      );


      const data = await res.json();


      if(!res.ok){
        setError(data.error || "Error al enviar solicitud");
      }
      else{
        setMensaje(
          "Si el correo existe, recibirá un enlace para recuperar su contraseña."
        );
      }


    } catch(error){

      console.error(error);
      setError("No se pudo conectar con el servidor");

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="loginPage">

      <div className="sideCard adminCard">

        <div className="loginHeader">

          <img 
            src={logo}
            alt="Logo"
            className="loginLogo"
          />

          <h3 className="loginTitle">
            Recuperar contraseña
          </h3>

          <p className="loginSubtitle">
            Ingresa tu correo para recibir el enlace
          </p>

        </div>


        <form 
          onSubmit={enviarSolicitud}
          className="loginForm"
        >


          {error && 
            <span className="loginMessage">
              {error}
            </span>
          }


          {mensaje &&
            <span 
              className="loginMessage"
              style={{
                background:"#d1e7dd",
                color:"#0f5132"
              }}
            >
              {mensaje}
            </span>
          }



          <div className="field">

            <label>
              Correo electrónico
            </label>


            <div className="inputRow">

              <FaRegUser className="inputIcon"/>


              <input

                type="email"

                placeholder="usuario@mspas.gob.gt"

                value={email}

                onChange={
                  (e)=>setEmail(e.target.value)
                }

              />


            </div>


          </div>



          <button
            type="submit"
            className="btnPrimary"
            disabled={loading}
          >

            <span>
              {
                loading 
                ? "Enviando..."
                : "Enviar enlace"
              }
            </span>


            <FaArrowRightLong/>


          </button>



          <button
            type="button"
            className="linkBtn secondary"
            onClick={()=>navigate("/login")}
          >
            Volver al inicio
          </button>



        </form>


      </div>


    </div>

  );

}