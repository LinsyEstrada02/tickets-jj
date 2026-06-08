// Controladores/SessionController.js
import Session from "../../Modelo/usuario/session.js";

// ==============================
// GET /api/sessions
// ==============================
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error("getSessions:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener las sesiones" });
  }
};

// ==============================
// GET /api/sessions/:id
// ==============================
export const getSessionById = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findByPk(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("getSessionById:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener la sesión" });
  }
};

// ==============================
// POST /api/sessions
// body: { id, usuarioId, data, expiresAt }
// ==============================
export const createSession = async (req, res) => {
  try {
    const { id, usuarioId, data, expiresAt } = req.body;

    if (!id || !usuarioId || !data || !expiresAt) {
      return res.status(400).json({
        error: "id, usuarioId, data y expiresAt son obligatorios",
      });
    }

    const nuevaSession = await Session.create({
      id,
      usuarioId,
      data,
      expiresAt,
      createdAt: new Date(),
    });

    return res.status(201).json(nuevaSession);
  } catch (error) {
    console.error("createSession:", error);
    return res
      .status(400)
      .json({ error: "Error al crear la sesión" });
  }
};

// ==============================
// PUT /api/sessions/:id
// body: { data?, expiresAt? }
// ==============================
export const updateSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findByPk(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    const { data, expiresAt } = req.body;

    await session.update({
      ...(data !== undefined ? { data } : {}),
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    });

    return res.status(200).json(session);
  } catch (error) {
    console.error("updateSession:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la sesión" });
  }
};

// ==============================
// DELETE /api/sessions/:id
// ==============================
export const deleteSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findByPk(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    await session.destroy();

    return res.status(200).json({
      message: "Sesión eliminada correctamente",
    });
  } catch (error) {
    console.error("deleteSession:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar la sesión" });
  }
};
