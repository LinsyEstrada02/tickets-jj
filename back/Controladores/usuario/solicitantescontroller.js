// Controladores/SolicitanteController.js
import Solicitante from "../../Modelos/usuario/solicitantes";

// ==============================
// GET /api/solicitantes
// ==============================
export const getSolicitantes = async (req, res) => {
  try {
    const solicitantes = await Solicitante.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json(solicitantes);
  } catch (error) {
    console.error("getSolicitantes:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener los solicitantes" });
  }
};

// ==============================
// GET /api/solicitantes/:id
// ==============================
export const getSolicitanteById = async (req, res) => {
  const { id } = req.params;

  try {
    const solicitante = await Solicitante.findByPk(id);

    if (!solicitante) {
      return res
        .status(404)
        .json({ error: "Solicitante no encontrado" });
    }

    return res.status(200).json(solicitante);
  } catch (error) {
    console.error("getSolicitanteById:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener el solicitante" });
  }
};

// ==============================
// POST /api/solicitantes
// body: {
//   nombre, oficina, email, edificio,
//   departamentoSolicitanteId?, extension?, createdByUserId?
// }
// ==============================
export const createSolicitante = async (req, res) => {
  try {
    const {
      nombre,
      oficina,
      email,
      edificio,
      departamentoSolicitanteId,
      extension,
      createdByUserId,
    } = req.body;

    if (!nombre || !oficina || !email || !edificio) {
      return res.status(400).json({
        error: "nombre, oficina, email y edificio son obligatorios",
      });
    }

    const nuevoSolicitante = await Solicitante.create({
      nombre,
      oficina,
      email,
      edificio,
      departamentoSolicitanteId: departamentoSolicitanteId ?? null,
      extension: extension ?? null,
      createdByUserId: createdByUserId ?? null,
    });

    return res.status(201).json(nuevoSolicitante);
  } catch (error) {
    console.error("createSolicitante:", error);
    return res
      .status(400)
      .json({ error: "Error al crear el solicitante" });
  }
};

// ==============================
// PUT /api/solicitantes/:id
// body: {
//   nombre?, oficina?, email?, edificio?,
//   departamentoSolicitanteId?, extension?
// }
// ==============================
export const updateSolicitante = async (req, res) => {
  const { id } = req.params;

  try {
    const solicitante = await Solicitante.findByPk(id);

    if (!solicitante) {
      return res
        .status(404)
        .json({ error: "Solicitante no encontrado" });
    }

    const {
      nombre,
      oficina,
      email,
      edificio,
      departamentoSolicitanteId,
      extension,
    } = req.body;

    await solicitante.update({
      ...(nombre !== undefined ? { nombre } : {}),
      ...(oficina !== undefined ? { oficina } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(edificio !== undefined ? { edificio } : {}),
      ...(departamentoSolicitanteId !== undefined
        ? { departamentoSolicitanteId }
        : {}),
      ...(extension !== undefined ? { extension } : {}),
      updatedAt: new Date(),
    });

    return res.status(200).json(solicitante);
  } catch (error) {
    console.error("updateSolicitante:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar el solicitante" });
  }
};

// ==============================
// DELETE /api/solicitantes/:id
// ==============================
export const deleteSolicitante = async (req, res) => {
  const { id } = req.params;

  try {
    const solicitante = await Solicitante.findByPk(id);

    if (!solicitante) {
      return res
        .status(404)
        .json({ error: "Solicitante no encontrado" });
    }

    await solicitante.destroy();

    return res.status(200).json({
      message: "Solicitante eliminado correctamente",
    });
  } catch (error) {
    console.error("deleteSolicitante:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar el solicitante" });
  }
};
