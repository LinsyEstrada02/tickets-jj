// Componentes/ResetPassword.js

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

import { TbLockPassword } from "react-icons/tb";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";


const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://10.21.25.54:3001";


export default function ResetPassword() {


  const [params] = useSearchParams();

  const token = params.get("token");


  const navigate = useNavigate();


  const [password,setPassword] = useState("");
  const [confirmar,setConfirmar] = useState("");

  const [showPassword,setShowPassword] = useState(false);
  const [showConfirmar,setShowConfirmar] = useState(false);


  const [error,setError] = useState("");
  const [mensaje,setMensaje] = useState("");

  const [loading,setLoading] = useState(false);



  const guardar = async(e)=>{

    e.preventDefault();


    setError("");
    setMensaje("");



    if(password !== confirmar){

      setError("Las contraseñas no coinciden");
      return;

    }



    if(password.length < 6){

      setError("La contraseña debe tener al menos 6 caracteres");
      return;

    }



    setLoading(true);


    try{


      const res = await fetch(
        `${API_BASE}/api/password-reset/reset`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            token,
            password
          })
        }
      );



      const data = await res.json();



      if(!res.ok){

        setError(
          data.error || "No se pudo actualizar la contraseña"
        );

      }
      else{

        setMensaje(data.message);


        setTimeout(()=>{

          navigate("/login");

        },3000);

      }



    }catch(error){

      console.error(error);

      setError(
        "No se pudo conectar con el servidor"
      );


    }finally{

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
        Nueva contraseña
      </h3>


      <p className="loginSubtitle">
        Ingresa tu nueva contraseña
      </p>



    </div>





    <form 
      className="loginForm"
      onSubmit={guardar}
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
          Nueva contraseña
        </label>


        <div className="inputRow">


          <TbLockPassword 
            className="inputIcon"
          />



          <input

            type={
              showPassword 
              ? "text" 
              : "password"
            }

            placeholder="Nueva contraseña"

            value={password}

            onChange={
              e=>setPassword(e.target.value)
            }

          />



          <button

            type="button"

            className="iconBtn"

            onClick={()=>
              setShowPassword(!showPassword)
            }

          >

            {
              showPassword
              ? <FaEyeSlash/>
              : <FaEye/>
            }


          </button>


        </div>


      </div>






      <div className="field">


        <label>
          Confirmar contraseña
        </label>



        <div className="inputRow">


          <TbLockPassword
            className="inputIcon"
          />



          <input


            type={
              showConfirmar
              ? "text"
              : "password"
            }


            placeholder="Confirmar contraseña"


            value={confirmar}


            onChange={
              e=>setConfirmar(e.target.value)
            }


          />




          <button

            type="button"

            className="iconBtn"

            onClick={()=>
              setShowConfirmar(!showConfirmar)
            }

          >

            {
              showConfirmar
              ? <FaEyeSlash/>
              : <FaEye/>
            }


          </button>



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
          ? "Guardando..."
          : "Cambiar contraseña"
        }

        </span>


        <FaArrowRightLong/>


      </button>







      <button

        type="button"

        className="linkBtn secondary"

        onClick={()=>
          navigate("/login")
        }

      >

        Volver al inicio


      </button>




    </form>




  </div>



</div>


);


}