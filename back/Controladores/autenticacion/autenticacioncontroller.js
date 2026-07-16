import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as LdapStrategy } from "passport-ldapauth";

import Usuario from "../../Modelos/usuario/usuario.js";
import Rol from "../../Modelos/usuario/roles.js";
import Permiso from "../../Modelos/usuario/permisos.js";
import "../../Modelos/usuario/asociaciones.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = "8h";

/* =====================================================
   CONFIGURACIÓN LDAP (ACTIVE DIRECTORY)
   ⚠️ REEMPLAZAR CON DATOS REALES DEL MSPAS
===================================================== */
const LDAP_OPTIONS = {
  server: {
    url: "ldap://IP_O_SERVIDOR_AD",
    bindDN: "CN=usuario_servicio,DC=dominio,DC=local",
    bindCredentials: "PASSWORD_SERVICIO",
    searchBase: "DC=dominio,DC=local",
    searchFilter: "(sAMAccountName={{username}})"
  }
};

passport.use(new LdapStrategy(LDAP_OPTIONS));

/* =====================================================
   LOGIN CON WINDOWS / ACTIVE DIRECTORY
===================================================== */
export const loginConWindows = (req, res, next) => {
  passport.authenticate("ldapauth", { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        return res.status(401).json({ error: "Credenciales de dominio inválidas" });
      }

      const email = user.mail || user.sAMAccountName;

      // Buscar usuario en tu sistema
      let usuarioDB = await Usuario.findOne({ where: { email } });

      // Auto-provisionamiento
      if (!usuarioDB) {
        const rolSolicitante = await Rol.findOne({ where: { nombre: "SOLICITANTE" } });

        usuarioDB = await Usuario.create({
          nombre: user.displayName || email,
          email: email,
          password: null,
          rolId: rolSolicitante ? rolSolicitante.id : null,
          activo: true,
          emailVerificado: true
        });

        if (rolSolicitante) {
          await usuarioDB.addRol(rolSolicitante.id);
        }
      }

      const usuarioCompleto = await Usuario.findOne({
        where: { id: usuarioDB.id },
        include: {
          model: Rol,
          as: "Rols",
          through: { attributes: [] },
          include: {
            model: Permiso,
            through: { attributes: [] }
          }
        }
      });

      const roles = usuarioCompleto?.Rols?.map(r => r.nombre) || [];

      const permisos = usuarioCompleto?.Rols?.flatMap(rol =>
        rol.Permisos.map(p => p.nombre)
      ) || [];

      const permisosUnicos = [...new Set(permisos)];

      const token = jwt.sign(
        {
          id: usuarioDB.id,
          email: usuarioDB.email,
          rolId: usuarioDB.rolId,
          roles,
          permisos: permisosUnicos
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(200).json({
        ok: true,
        token,
        usuario: {
          id: usuarioDB.id,
          email: usuarioDB.email,
          rolId: usuarioDB.rolId,
          roles,
          permisos: permisosUnicos
        }
      });

    } catch (error) {
      console.error("loginConWindows:", error);
      return res.status(500).json({ error: "Error en autenticación Windows" });
    }
  })(req, res, next);
};

/* =====================================================
   LOGIN SOLO CON EMAIL (SOLICITANTES)
===================================================== */
export const loginConEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: "El correo es obligatorio" });

    const usuario = await Usuario.findOne({
      where: { email },
      include: {
        model: Rol,
        as: "Rols",
        through: { attributes: [] },
        include: { model: Permiso, through: { attributes: [] } }
      }
    });

    if (!usuario)
      return res.status(401).json({ error: "Correo no registrado" });

    if (!usuario.activo)
      return res.status(403).json({ error: "Usuario inactivo" });

    const roles = usuario.Rols.map(r => r.nombre);

    // 🔒 ADMIN y TECNICO deben entrar por loginConPassword, no por email
    const rolesConPassword = ["ADMIN", "TECNICO"];
    const tieneRolRestringido = roles.some(r => rolesConPassword.includes(r));

    if (tieneRolRestringido) {
      return res.status(403).json({
        error: "Este usuario debe iniciar sesión con contraseña"
      });
    }

    const permisos = [...new Set(
      usuario.Rols.flatMap(r => r.Permisos.map(p => p.nombre))
    )];

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rolId: usuario.rolId, roles, permisos },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({ ok: true, token, usuario });

  } catch (error) {
    console.error("loginConEmail:", error);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/* =====================================================
   LOGIN CON CONTRASEÑA (TU SISTEMA ACTUAL)
===================================================== */
export const loginConPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });

    const usuario = await Usuario.findOne({
      where: { email },
      include: {
        model: Rol,
        as: "Rols",
        through: { attributes: [] },
        include: { model: Permiso, through: { attributes: [] } }
      }
    });

    if (!usuario || !usuario.password)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const valido = await bcrypt.compare(String(password), usuario.password);

    if (!valido)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const roles = usuario.Rols.map(r => r.nombre);

    const permisos = [...new Set(
      usuario.Rols.flatMap(r => r.Permisos.map(p => p.nombre))
    )];

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rolId: usuario.rolId,
        roles,
        permisos
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({ ok: true, token, usuario });

  } catch (error) {
    console.error("loginConPassword:", error);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/* =====================================================
   LOGOUT
===================================================== */
export const logout = async (req, res) => {
  return res.status(200).json({ ok: true, message: "Sesión cerrada" });
};