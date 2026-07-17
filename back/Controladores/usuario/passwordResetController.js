import crypto from "crypto";
import bcrypt from "bcrypt";
import Usuario from "../../Modelos/usuario/usuario.js";
import { enviarCorreoRecuperacion } from "../../servicios/correosTickets.js";


/* =====================================================
   SOLICITAR RECUPERACIÓN
===================================================== */

export const solicitarRecuperacion = async (req, res) => {
  try {

    const { email } = req.body;


    if (!email) {
      return res.status(400).json({
        error: "Debe ingresar un correo."
      });
    }


    const usuario = await Usuario.findOne({
      where: { email }
    });



    // No revelar si existe o no
    if (!usuario) {

      return res.json({
        message:
          "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña."
      });

    }



    // Generar token
    const token = crypto.randomBytes(32).toString("hex");


    console.log("==============================");
    console.log("TOKEN GENERADO:");
    console.log(token);
    console.log("==============================");



    // Expira en 1 hora
    const expiracion = new Date(
      Date.now() + 60 * 60 * 1000
    );



usuario.resetPasswordToken = token;
usuario.resetPasswordExpires = expiracion;


    await usuario.save();



    console.log("==============================");
    console.log("TOKEN GUARDADO BD:");
    console.log(usuario.password_reset_token);

    console.log("EXPIRA:");
    console.log(usuario.resetPasswordExpires);
    console.log("==============================");



    const resetUrl =
      `http://10.21.25.54:3000/reset-password?token=${token}`;



    await enviarCorreoRecuperacion({

      emailUsuario: usuario.email,

      nombreUsuario: usuario.nombre,

      resetUrl

    });



    return res.json({

      message:
        "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña."

    });



  } catch(error){

    console.error(
      "solicitarRecuperacion:",
      error
    );


    return res.status(500).json({

      error:"Error interno del servidor."

    });

  }
};





/* =====================================================
   CAMBIAR CONTRASEÑA
===================================================== */

export const resetPassword = async (req,res)=>{

  try{


    const {
      token,
      password
    } = req.body;



    console.log("==============================");
    console.log("TOKEN RECIBIDO FRONT:");
    console.log(token);
    console.log("==============================");



    if(!token || !password){

      return res.status(400).json({

        error:
        "Token y contraseña son obligatorios."

      });

    }




    if(password.length < 6){

      return res.status(400).json({

        error:
        "La contraseña debe tener al menos 6 caracteres."

      });

    }




    const usuario = await Usuario.findOne({

      where:{

        password_reset_token: token

      }

    });




    console.log("==============================");
    console.log(
      "USUARIO ENCONTRADO:"
    );
    console.log(
      usuario ? usuario.email : "NO ENCONTRADO"
    );


    if(usuario){

      console.log(
        "TOKEN BD:"
      );

      console.log(
        usuario.password_reset_token
      );


      console.log(
        "EXPIRA:"
      );

      console.log(
        usuario.password_reset_expires
      );

    }

    console.log("==============================");





    if(!usuario){

      return res.status(400).json({

        error:
        "El enlace ya no es válido."

      });

    }





    if(
      usuario.password_reset_expires &&
      usuario.password_reset_expires < new Date()
    ){

      return res.status(400).json({

        error:
        "El enlace ha expirado."

      });

    }





    const passwordHash =
      await bcrypt.hash(password,10);





    usuario.password = passwordHash;

usuario.resetPasswordToken = null;
usuario.resetPasswordExpires = null;

    usuario.updatedAt = new Date();



    await usuario.save();





    return res.json({

      message:
      "Contraseña actualizada correctamente."

    });




  }catch(error){


    console.error(
      "resetPassword:",
      error
    );


    return res.status(500).json({

      error:
      "Error al actualizar contraseña."

    });


  }

};