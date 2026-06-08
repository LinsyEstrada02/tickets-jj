// Controladores/PasswordResetTokenController.js
import PasswordResetToken from "../../Modelo/usuario/password_reset_token.js";

// ==============================
// GET /api/password-reset-tokens
// ==============================
export const getPasswordResetTokens = async (req, res) => {
  try {
    const tokens = await PasswordResetToken.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(tokens);
  } catch (error) {
    console.error("getPasswordResetTokens:", error);
    return res.status(500).json({
      error: "Error al obtener los tokens de reseteo",
    });
  }
};

// ==============================
// GET /api/password-reset-tokens/:id
// ==============================
export const getPasswordResetTokenById = async (req, res) => {
  const { id } = req.params;

  try {
    const token = await PasswordResetToken.findByPk(id);

    if (!token) {
      return res.status(404).json({
        error: "Token de reseteo no encontrado",
      });
    }

    return res.status(200).json(token);
  } catch (error) {
    console.error("getPasswordResetTokenById:", error);
    return res.status(500).json({
      error: "Error al obtener el token de reseteo",
    });
  }
};

// ==============================
// POST /api/password-reset-tokens
// body: { id, token, usuarioId, expiresAt }
// ==============================
export const createPasswordResetToken = async (req, res) => {
  try {
    const { id, token, usuarioId, expiresAt } = req.body;

    if (!id || !token || !usuarioId || !expiresAt) {
      return res.status(400).json({
        error: "id, token, usuarioId y expiresAt son obligatorios",
      });
    }

    const nuevoToken = await PasswordResetToken.create({
      id,
      token,
      usuarioId,
      expiresAt,
      createdAt: new Date(),
      usado: 0,
    });

    return res.status(201).json(nuevoToken);
  } catch (error) {
    console.error("createPasswordResetToken:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "El token ya existe",
      });
    }

    return res.status(400).json({
      error: "Error al crear el token de reseteo",
      details: error.message,
    });
  }
};

// ==============================
// PATCH /api/password-reset-tokens/:id/use
// Marca el token como usado
// ==============================
export const usePasswordResetToken = async (req, res) => {
  const { id } = req.params;

  try {
    const token = await PasswordResetToken.findByPk(id);

    if (!token) {
      return res.status(404).json({
        error: "Token de reseteo no encontrado",
      });
    }

    if (token.usado === 1) {
      return res.status(409).json({
        error: "El token ya fue utilizado",
      });
    }

    if (new Date(token.expiresAt) < new Date()) {
      return res.status(410).json({
        error: "El token ha expirado",
      });
    }

    await token.update({
      usado: 1,
      usedAt: new Date(),
    });

    return res.status(200).json({
      message: "Token marcado como usado correctamente",
    });
  } catch (error) {
    console.error("usePasswordResetToken:", error);
    return res.status(500).json({
      error: "Error al usar el token de reseteo",
    });
  }
};

// ==============================
// DELETE /api/password-reset-tokens/:id
// ==============================
export const deletePasswordResetToken = async (req, res) => {
  const { id } = req.params;

  try {
    const token = await PasswordResetToken.findByPk(id);

    if (!token) {
      return res.status(404).json({
        error: "Token de reseteo no encontrado",
      });
    }

    await token.destroy();

    return res.status(200).json({
      message: "Token eliminado correctamente",
    });
  } catch (error) {
    console.error("deletePasswordResetToken:", error);
    return res.status(500).json({
      error: "Error al eliminar el token de reseteo",
    });
  }
};
