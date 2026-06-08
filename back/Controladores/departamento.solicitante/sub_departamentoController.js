import SubDepartamentoSolicitante from "../../Modelos/departamento.solicitante/sub_departamento_solicitante.js";
import DepartamentoSolicitante from "../../Modelos/departamento.solicitante/departamento_solicitante.js";
import { Op } from "sequelize";

const norm = (v) => String(v ?? "").trim();
const normUpper = (v) => norm(v).toUpperCase();

/* ==========================
   LISTAR
   - Opcional: ?departamentoId=#
========================== */
export const listarSubDepartamentos = async (req, res) => {
  try {
    const departamentoId = req.query?.departamentoId ? Number(req.query.departamentoId) : null;

    const where = {};
    if (departamentoId !== null) {
      if (!Number.isFinite(departamentoId)) {
        return res.status(400).json({ error: "departamentoId inválido" });
      }
      where.departamentoId = departamentoId;
    }

    const data = await SubDepartamentoSolicitante.findAll({
      where,
      include: {
        model: DepartamentoSolicitante,
        as: "departamento",
        attributes: ["id", "nombre"],
      },
      order: [["nombre", "ASC"]],
    });

    return res.json(data);
  } catch (error) {
    console.error("listarSubDepartamentos:", error);
    return res.status(500).json({ error: "Error al listar subdepartamentos" });
  }
};

/* ==========================
   OBTENER POR ID
========================== */
export const obtenerSubDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sub = await SubDepartamentoSolicitante.findByPk(id, {
      include: {
        model: DepartamentoSolicitante,
        as: "departamento",
        attributes: ["id", "nombre"],
      },
    });

    if (!sub) {
      return res.status(404).json({ error: "Subdepartamento no encontrado" });
    }

    return res.json(sub);
  } catch (error) {
    console.error("obtenerSubDepartamento:", error);
    return res.status(500).json({ error: "Error al obtener subdepartamento" });
  }
};

/* ==========================
   CREAR
========================== */
export const crearSubDepartamento = async (req, res) => {
  try {
    const nombre = norm(req.body?.nombre);
    const abreviatura = normUpper(req.body?.abreviatura);
    const departamentoId = Number(req.body?.departamentoId);

    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!abreviatura) return res.status(400).json({ error: "La abreviatura es obligatoria" });
    if (!Number.isFinite(departamentoId)) return res.status(400).json({ error: "departamentoId inválido" });

    // Verificar que el departamento exista
    const departamento = await DepartamentoSolicitante.findByPk(departamentoId);
    if (!departamento) {
      return res.status(404).json({ error: "Departamento no encontrado" });
    }

    // Validar duplicado dentro del mismo departamento
    const existe = await SubDepartamentoSolicitante.findOne({
      where: {
        departamentoId,
        [Op.or]: [{ nombre }, { abreviatura }],
      },
    });

    if (existe) {
      return res.status(409).json({
        error: "Ya existe un subdepartamento con ese nombre o abreviatura en este departamento",
      });
    }

    const now = new Date();

    const nuevo = await SubDepartamentoSolicitante.create({
      nombre,
      abreviatura,
      departamentoId,
      activo: req.body?.activo ?? true,
      createdAt: now,
      updatedAt: now,
      createdByUserId: req.usuario?.id ?? null,
    });

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("crearSubDepartamento:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Datos duplicados." });
    }

    return res.status(500).json({ error: "Error al crear subdepartamento" });
  }
};

/* ==========================
   ACTUALIZAR
========================== */
export const actualizarSubDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sub = await SubDepartamentoSolicitante.findByPk(id);
    if (!sub) {
      return res.status(404).json({ error: "Subdepartamento no encontrado" });
    }

    const nombre = norm(req.body?.nombre);
    const abreviatura = normUpper(req.body?.abreviatura);
    const activo = req.body?.activo;

    if (!nombre || !abreviatura) {
      return res.status(400).json({ error: "Nombre y abreviatura son obligatorios" });
    }

    // Duplicado dentro del mismo departamento (excluyendo el actual)
    const existe = await SubDepartamentoSolicitante.findOne({
      where: {
        id: { [Op.ne]: id },
        departamentoId: sub.departamentoId,
        [Op.or]: [{ nombre }, { abreviatura }],
      },
    });

    if (existe) {
      return res.status(409).json({
        error: "Ya existe otro subdepartamento con ese nombre o abreviatura en este departamento",
      });
    }

    sub.nombre = nombre;
    sub.abreviatura = abreviatura;

    if (activo !== undefined && activo !== null) {
      sub.activo = typeof activo === "boolean" ? activo : Boolean(Number(activo));
    }

    sub.updatedAt = new Date();
    await sub.save();

    return res.json(sub);
  } catch (error) {
    console.error("actualizarSubDepartamento:", error);
    return res.status(500).json({ error: "Error al actualizar subdepartamento" });
  }
};

/* ==========================
   CAMBIAR ESTADO (SOFT DELETE)
   PATCH /api/sub-departamentos-solicitantes/:id/estado
   body: { activo: 0|1 }
========================== */
export const cambiarEstadoSubDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sub = await SubDepartamentoSolicitante.findByPk(id);
    if (!sub) {
      return res.status(404).json({ error: "Subdepartamento no encontrado" });
    }

    const { activo } = req.body;

    if (activo === undefined || activo === null) {
      return res.status(400).json({ error: "Debe enviar el campo 'activo' (0/1)." });
    }

    sub.activo = typeof activo === "boolean" ? activo : Boolean(Number(activo));
    sub.updatedAt = new Date();

    await sub.save();

    return res.json({ message: "Estado actualizado", activo: sub.activo });
  } catch (error) {
    console.error("cambiarEstadoSubDepartamento:", error);
    return res.status(500).json({ error: "Error al cambiar estado" });
  }
};