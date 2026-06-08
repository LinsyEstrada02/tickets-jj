import Usuario from "../../Modelos/usuario/usuario.js";
import Rol from "../../Modelos/usuario/roles.js";
import departamento_solicitante from "../../Modelos/departamento.solicitante/departamento_solicitante.js";
import sub_departamento_solicitante from "../../Modelos/departamento.solicitante/sub_departamento_solicitante.js";

import bcrypt from "bcrypt";
import { Op } from "sequelize";

const SALT_ROUNDS = 10;

// Include base reutilizable para no repetirlo en cada query
const INCLUDE_USUARIO = [
  {
    model: Rol,
    as: "Rols",                        // belongsToMany (tabla intermedia)
    attributes: ["id", "nombre"],
    through: { attributes: [] },
  },
  {
    model: Rol,
    as: "rol",                         // belongsTo directo (columna rolId)
    attributes: ["id", "nombre"],
  },
  {
    model: departamento_solicitante,
    as: "departamentoSolicitante",
    attributes: ["id", "nombre", "abreviatura"],
  },
  {
    model: sub_departamento_solicitante,
    as: "subDepartamentoSolicitante",
    attributes: ["id", "nombre", "abreviatura"],
  },
];

// ────────────────────────────────────────────────
//  GET /api/usuarios
// ────────────────────────────────────────────────
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      include: INCLUDE_USUARIO,
      order: [["id", "ASC"]],
    });

    return res.json(usuarios);
  } catch (error) {
    console.error("getUsuarios:", error);
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// ────────────────────────────────────────────────
//  GET /api/usuarios/:id
// ────────────────────────────────────────────────
export const getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: INCLUDE_USUARIO,
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json(usuario);
  } catch (error) {
    console.error("getUsuarioById:", error);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
};

// ────────────────────────────────────────────────
//  GET /api/usuarios/by-email?email=xxx@xxx.com
// ────────────────────────────────────────────────
export const getUsuarioByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "El parámetro email es requerido" });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
      attributes: ["id", "nombre", "email", "departamentoSolicitanteId", "subDepartamentoSolicitanteId"],
      include: [
        {
          model: departamento_solicitante,
          as: "departamentoSolicitante",
          attributes: ["id", "nombre", "abreviatura"],
        },
        {
          model: sub_departamento_solicitante,
          as: "subDepartamentoSolicitante",
          attributes: ["id", "nombre", "abreviatura"],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ usuario });
  } catch (error) {
    console.error("getUsuarioByEmail:", error);
    return res.status(500).json({ error: "Error al consultar usuario por email" });
  }
};

// ────────────────────────────────────────────────
//  POST /api/usuarios/registro-solicitante
// ────────────────────────────────────────────────
export const registroSolicitante = async (req, res) => {
  try {
    const { nombre, email, departamentoSolicitanteId, subDepartamentoSolicitanteId } = req.body;

    if (!nombre?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Nombre y correo son obligatorios" });
    }

    const existe = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existe) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }

    const rolDb = await Rol.findOne({ where: { nombre: "SOLICITANTE" } });
    if (!rolDb) {
      return res.status(500).json({ error: "Rol SOLICITANTE no encontrado" });
    }

    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: null,
      rolId: rolDb.id,
      departamentoSolicitanteId: departamentoSolicitanteId ?? null,
      subDepartamentoSolicitanteId: subDepartamentoSolicitanteId ?? null,
      emailVerificado: true,
      activo: true,
    });

    await usuario.addRol(rolDb.id);

    return res.status(201).json({
      ok: true,
      message: "Cuenta creada exitosamente.",
    });
  } catch (error) {
    console.error("registroSolicitante:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// ────────────────────────────────────────────────
//  POST /api/usuarios
// ────────────────────────────────────────────────
export const createUsuario = async (req, res) => {
  try {
    const {
      nombre,
      email,
      rol,
      password,
      tecnicoId,
      solicitanteId,
      createdByUserId,
      departamentoSolicitanteId,
      subDepartamentoSolicitanteId,
    } = req.body;

    if (!nombre?.trim() || !email?.trim() || !rol) {
      return res.status(400).json({ error: "Nombre, email y rol son obligatorios" });
    }

    const rolNombre = rol.trim().toUpperCase();

    const rolDb = await Rol.findOne({
      where: { nombre: { [Op.like]: rolNombre } },
    });

    if (!rolDb) {
      return res.status(400).json({ error: `Rol inválido: ${rol}` });
    }

    let passwordHash = null;
    if (rolNombre !== "SOLICITANTE") {
      if (!password || password.length < 6) {
        return res.status(400).json({
          error: "La contraseña es obligatoria y debe tener al menos 6 caracteres",
        });
      }
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (subDepartamentoSolicitanteId && !departamentoSolicitanteId) {
      return res.status(400).json({
        error: "Si se indica subdepartamento, el departamento es obligatorio",
      });
    }

    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: passwordHash,
      rolId: rolDb.id,
      tecnicoId: tecnicoId ?? null,
      solicitanteId: solicitanteId ?? null,
      departamentoSolicitanteId: departamentoSolicitanteId ?? null,
      subDepartamentoSolicitanteId: subDepartamentoSolicitanteId ?? null,
      emailVerificado: false,
      activo: true,
      createdByUserId: createdByUserId ?? null,
    });

    await usuario.addRol(rolDb.id);

    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ["password"] },
      include: INCLUDE_USUARIO,
    });

    return res.status(201).json(usuarioCompleto);
  } catch (error) {
    console.error("createUsuario:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe un usuario con ese email" });
    }
    return res.status(500).json({ error: "Error al crear usuario" });
  }
};

// ────────────────────────────────────────────────
//  PUT /api/usuarios/:id
// ────────────────────────────────────────────────
export const editUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      email,
      activo,
      emailVerificado,
      departamentoSolicitanteId,
      subDepartamentoSolicitanteId,
    } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (nombre !== undefined && !nombre?.trim()) {
      return res.status(400).json({ error: "El nombre no puede estar vacío" });
    }
    if (email !== undefined && !email?.trim()) {
      return res.status(400).json({ error: "El email no puede estar vacío" });
    }

    if (email && email.trim().toLowerCase() !== usuario.email) {
      const existe = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existe) return res.status(409).json({ error: "El correo ya está en uso" });
    }

    const nuevoDeptoId = departamentoSolicitanteId !== undefined
      ? departamentoSolicitanteId
      : usuario.departamentoSolicitanteId;
    const nuevoSubId = subDepartamentoSolicitanteId !== undefined
      ? subDepartamentoSolicitanteId
      : usuario.subDepartamentoSolicitanteId;

    if (nuevoSubId && !nuevoDeptoId) {
      return res.status(400).json({
        error: "Si se indica subdepartamento, el departamento es obligatorio",
      });
    }

    if (nombre !== undefined) usuario.nombre = nombre.trim();
    if (email !== undefined) usuario.email = email.trim().toLowerCase();

    if (activo !== undefined) {
      usuario.activo = activo === true || activo === "true" || activo === 1 || activo === "1";
    }
    if (emailVerificado !== undefined) {
      usuario.emailVerificado =
        emailVerificado === true || emailVerificado === "true" ||
        emailVerificado === 1 || emailVerificado === "1";
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "departamentoSolicitanteId")) {
      usuario.departamentoSolicitanteId = departamentoSolicitanteId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "subDepartamentoSolicitanteId")) {
      usuario.subDepartamentoSolicitanteId = subDepartamentoSolicitanteId ?? null;
    }

    usuario.updatedAt = new Date();
    await usuario.save();

    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ["password"] },
      include: INCLUDE_USUARIO,
    });

    return res.json(usuarioCompleto);
  } catch (error) {
    console.error("editUsuario:", error);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// ────────────────────────────────────────────────
//  PATCH /api/usuarios/:id/estado
// ────────────────────────────────────────────────
export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const activo =
      req.body.activo === true || req.body.activo === "true" ||
      req.body.activo === 1    || req.body.activo === "1";

    usuario.activo = activo;
    await usuario.save();

    return res.json({
      message: "Estado actualizado",
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, activo: usuario.activo },
    });
  } catch (error) {
    console.error("cambiarEstadoUsuario:", error);
    return res.status(500).json({ error: "Error al cambiar estado" });
  }
};

// ────────────────────────────────────────────────
//  PATCH /api/usuarios/:id/password
// ────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const usuario = await Usuario.findByPk(req.params.id, {
      include: [{ model: Rol, as: "Rols", through: { attributes: [] } }],
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const esSolicitante = usuario.Rols?.some((r) => r.nombre === "SOLICITANTE");
    if (esSolicitante) {
      return res.status(403).json({ error: "Los solicitantes no usan contraseña" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await usuario.update({ password: passwordHash });

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("changePassword:", error);
    return res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

// ────────────────────────────────────────────────
//  PATCH /api/usuarios/:id/rol
// ────────────────────────────────────────────────
export const cambiarRolUsuario = async (req, res) => {
  try {
    const { rolId } = req.body;
    if (!rolId) return res.status(400).json({ error: "rolId es requerido" });

    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const rol = await Rol.findByPk(rolId);
    if (!rol) return res.status(400).json({ error: "Rol no encontrado" });

    await usuario.update({ rolId: rol.id });
    await usuario.setRols([rol]);

    const usuarioActualizado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ["password"] },
      include: INCLUDE_USUARIO,
    });

    return res.json({ message: "Rol actualizado correctamente", usuario: usuarioActualizado });
  } catch (error) {
    console.error("cambiarRolUsuario:", error);
    return res.status(500).json({ error: "Error al cambiar rol" });
  }
};

// ────────────────────────────────────────────────
//  GET /api/usuarios/me
// ────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const userId = req.usuario?.id;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const usuario = await Usuario.findByPk(userId, {
      attributes: ["id", "nombre", "email"],
      include: INCLUDE_USUARIO,
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      departamento: usuario.departamentoSolicitante
        ? {
            id: usuario.departamentoSolicitante.id,
            nombre: usuario.departamentoSolicitante.nombre,
            abreviatura: usuario.departamentoSolicitante.abreviatura,
          }
        : null,
      subdepartamento: usuario.subDepartamentoSolicitante
        ? {
            id: usuario.subDepartamentoSolicitante.id,
            nombre: usuario.subDepartamentoSolicitante.nombre,
            abreviatura: usuario.subDepartamentoSolicitante.abreviatura,
          }
        : null,
      roles: usuario.Rols?.map(r => r.nombre) || [],
      rolPrincipal: usuario.rol?.nombre || null,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ error: "Error al obtener perfil del usuario" });
  }
};

export default {
  getUsuarios,
  getUsuarioById,
  getUsuarioByEmail,
  registroSolicitante,
  createUsuario,
  editUsuario,
  cambiarEstadoUsuario,
  changePassword,
  cambiarRolUsuario,
  getMe,
};